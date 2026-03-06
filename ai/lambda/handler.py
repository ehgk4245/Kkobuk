import json
import os
import pickle
import uuid
from datetime import datetime

import boto3
import numpy as np
import pymysql
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from shared.preprocessing_V2 import compute_baseline, extract_features

S3_BUCKET = os.environ["S3_BUCKET_NAME"]
DB_URL = os.environ["AI_DATABASE_URL"]

s3 = boto3.client("s3")


def _parse_db_url(url: str) -> dict:
    url = url.replace("mysql+pymysql://", "")
    user_pass, rest = url.split("@", 1)
    user, password = user_pass.split(":", 1)
    host_port, dbname = rest.split("/", 1)
    host, port = host_port.split(":", 1)
    return {"host": host, "port": int(port), "user": user, "password": password, "db": dbname}


def _get_db():
    params = _parse_db_url(DB_URL)
    return pymysql.connect(
        host=params["host"],
        port=params["port"],
        user=params["user"],
        password=params["password"],
        database=params["db"],
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def handler(event, context):
    member_id = event["memberId"]
    s3_key = event["s3Key"]

    obj = s3.get_object(Bucket=S3_BUCKET, Key=s3_key)
    samples = json.loads(obj["Body"].read())

    s3_url = f"s3://{S3_BUCKET}/{s3_key}"
    _save_training_metadata(member_id, s3_url)

    good_samples = [s for s in samples if s["label"] == 0]
    baseline = compute_baseline(good_samples)

    X, y = [], []
    for s in samples:
        landmarks = {
            "nose": s["nose"],
            "leftEar": s["leftEar"],
            "rightEar": s["rightEar"],
            "leftShoulder": s["leftShoulder"],
            "rightShoulder": s["rightShoulder"],
        }
        X.append(extract_features(landmarks, baseline))
        y.append(s["label"])

    X = np.array(X)
    y = np.array(y)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_scaled, y)

    model_bundle = {
        "model": model,
        "scaler": scaler,
        "baseline": baseline,
    }
    model_key = f"models/{member_id}/{uuid.uuid4()}.pkl"
    model_bytes = pickle.dumps(model_bundle)
    s3.put_object(Bucket=S3_BUCKET, Key=model_key, Body=model_bytes)

    model_s3_url = f"s3://{S3_BUCKET}/{model_key}"
    _save_model_metadata(member_id, model_s3_url)

    return {"statusCode": 200, "memberId": member_id, "modelKey": model_key}


def _save_training_metadata(member_id: int, s3_url: str):
    conn = _get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO training_data_metadata (member_id, s3_url, created_at) VALUES (%s, %s, %s)",
                (member_id, s3_url, datetime.utcnow()),
            )
        conn.commit()
    finally:
        conn.close()


def _save_model_metadata(member_id: int, s3_url: str):
    conn = _get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE trained_model_metadata SET status = 'INACTIVE' WHERE member_id = %s",
                (member_id,),
            )
            cur.execute(
                "INSERT INTO trained_model_metadata (member_id, s3_url, status, created_at) VALUES (%s, %s, 'ACTIVE', %s)",
                (member_id, s3_url, datetime.utcnow()),
            )
        conn.commit()
    finally:
        conn.close()
