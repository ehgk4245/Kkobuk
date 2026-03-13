import math

def _euclidean_2d(p1: dict, p2: dict) -> float:
    return math.sqrt((p1["x"] - p2["x"]) ** 2 + (p1["y"] - p2["y"]) ** 2)


def _euclidean_3d(p1: dict, p2: dict) -> float:
    return math.sqrt(
        (p1["x"] - p2["x"]) ** 2
        + (p1["y"] - p2["y"]) ** 2
        + (p1["z"] - p2["z"]) ** 2
    )


def extract_features(landmarks: dict) -> list[float]:
    nose = landmarks["nose"]
    left_ear = landmarks["leftEar"]
    right_ear = landmarks["rightEar"]
    left_shoulder = landmarks["leftShoulder"]
    right_shoulder = landmarks["rightShoulder"]

    d_shoulders_2d = _euclidean_2d(left_shoulder, right_shoulder)

    d_ears_3d = _euclidean_3d(left_ear, right_ear)
    f1 = d_ears_3d / d_shoulders_2d

    ear_mid_y = (left_ear["y"] + right_ear["y"]) / 2
    shoulder_mid_y = (left_shoulder["y"] + right_shoulder["y"]) / 2
    f2 = (shoulder_mid_y - ear_mid_y) / d_shoulders_2d

    shoulder_mid = {
        "x": (left_shoulder["x"] + right_shoulder["x"]) / 2,
        "y": (left_shoulder["y"] + right_shoulder["y"]) / 2,
    }
    d_nose_shoulder_mid = _euclidean_2d(nose, shoulder_mid)
    f3 = d_nose_shoulder_mid / d_shoulders_2d

    return [f1, f2, f3]
