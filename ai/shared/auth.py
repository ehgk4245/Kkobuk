import os

import jwt

_JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "")

def _algorithm() -> str:
    key_len = len(_JWT_SECRET.encode())
    if key_len >= 64:
        return "HS512"
    if key_len >= 48:
        return "HS384"
    return "HS256"


def verify_token(token: str) -> int:
    """JWT 검증 후 member_id(int) 반환. 실패 시 예외 발생."""
    payload = jwt.decode(
        token,
        _JWT_SECRET,
        algorithms=[_algorithm()],
    )
    return int(payload["sub"])
