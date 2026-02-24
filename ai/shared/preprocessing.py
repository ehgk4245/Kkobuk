import math
from typing import Optional


def _euclidean_2d(p1: dict, p2: dict) -> float:
    return math.sqrt((p1["x"] - p2["x"]) ** 2 + (p1["y"] - p2["y"]) ** 2)


def extract_features(landmarks: dict) -> Optional[list[float]]:
    nose = landmarks["nose"]
    left_ear = landmarks["leftEar"]
    right_ear = landmarks["rightEar"]
    left_shoulder = landmarks["leftShoulder"]
    right_shoulder = landmarks["rightShoulder"]

    d_left = _euclidean_2d(nose, left_ear)
    d_right = _euclidean_2d(nose, right_ear)

    if d_right == 0:
        return None

    yaw_ratio = d_left / d_right
    if yaw_ratio < 0.7 or yaw_ratio > 1.3:
        return None

    d_ears = _euclidean_2d(left_ear, right_ear)
    d_shoulders = _euclidean_2d(left_shoulder, right_shoulder)

    if d_ears == 0 or d_shoulders == 0:
        return None

    avg_y_ear = (left_ear["y"] + right_ear["y"]) / 2
    avg_y_shoulder = (left_shoulder["y"] + right_shoulder["y"]) / 2

    feature1 = d_ears / d_shoulders

    feature2 = (avg_y_shoulder - avg_y_ear) / d_shoulders

    feature3 = (avg_y_ear - nose["y"]) / d_ears

    return [feature1, feature2, feature3]