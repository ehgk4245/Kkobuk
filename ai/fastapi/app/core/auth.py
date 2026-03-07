import os

import jwt

_JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "")


def verify_token(token: str) -> int:
    """JWT 검증 후 member_id(int) 반환. 실패 시 예외 발생."""
    payload = jwt.decode(
        token,
        _JWT_SECRET,
        algorithms=["HS256"],
    )
    return int(payload["sub"])
