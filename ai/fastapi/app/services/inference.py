import io
import os
import sys
import threading
from collections import OrderedDict
from typing import Any

import boto3
import joblib
import numpy as np
from sqlalchemy.orm import Session

# ai/shared 경로 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'shared'))
from preprocessing_V2 import compute_baseline, extract_features  # noqa: E402

from app.models.ai_metadata import ModelStatus, TrainedModelMetadata

_MAX_CACHE = 100
_model_cache: OrderedDict[int, Any] = OrderedDict()
_cache_lock = threading.Lock()

_s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "ap-northeast-2"))


def _parse_s3_url(s3_url: str) -> tuple[str, str]:
    """s3://bucket/key → (bucket, key)"""
    path = s3_url.removeprefix("s3://")
    bucket, key = path.split("/", 1)
    return bucket, key


def load_model(member_id: int, db: Session) -> Any | None:
    with _cache_lock:
        if member_id in _model_cache:
            _model_cache.move_to_end(member_id)
            return _model_cache[member_id]

    row = (
        db.query(TrainedModelMetadata)
        .filter_by(member_id=member_id, status=ModelStatus.ACTIVE)
        .first()
    )
    if row is None:
        return None

    bucket, key = _parse_s3_url(row.s3_url)
    buf = io.BytesIO()
    _s3.download_fileobj(bucket, key, buf)
    buf.seek(0)
    model = joblib.load(buf)

    with _cache_lock:
        if len(_model_cache) >= _MAX_CACHE:
            _model_cache.popitem(last=False)  # 가장 오래된 항목 제거
        _model_cache[member_id] = model

    return model


def invalidate_model_cache(member_id: int) -> None:
    with _cache_lock:
        _model_cache.pop(member_id, None)


def predict(model: Any, landmarks: dict, baseline: np.ndarray) -> tuple[str, float]:
    features = extract_features(landmarks, baseline)
    x = np.array([features])
    label_idx = int(model.predict(x)[0])
    proba = model.predict_proba(x)[0]
    label = "good" if label_idx == 0 else "bad"
    confidence = float(proba[label_idx])
    return label, confidence


def build_baseline(samples: list[dict]) -> np.ndarray:
    return compute_baseline(samples)
