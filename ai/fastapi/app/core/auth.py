import os

import jwt
from fastapi import Header, HTTPException

_JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "")


def verify_token(token: str) -> int:
    """JWT 검증 후 member_id(int) 반환. 실패 시 예외 발생."""
    payload = jwt.decode(
        token,
        _JWT_SECRET,
        algorithms=["HS256"],
    )
    return int(payload["sub"])


def get_current_member_id(authorization: str = Header(...)) -> int:
    """REST 엔드포인트용 FastAPI 의존성. Authorization: Bearer <token>"""
    try:
        token = authorization.removeprefix("Bearer ")
        return verify_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
