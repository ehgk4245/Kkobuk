import io
import logging

import numpy as np

from app.core.redis import get_redis

logger = logging.getLogger(__name__)

_BASELINE_TTL = 86400  # 24시간


def _key(member_id: int) -> str:
    return f"baseline:{member_id}"


async def get_baseline(member_id: int) -> np.ndarray | None:
    r = get_redis()
    if r is None:
        return None
    try:
        data = await r.get(_key(member_id))
        if data is None:
            return None
        buf = io.BytesIO(data)
        return np.load(buf)
    except Exception:
        logger.exception("[baseline_cache] get 실패 member_id=%d", member_id)
        return None


async def set_baseline(member_id: int, baseline: np.ndarray) -> None:
    r = get_redis()
    if r is None:
        return
    try:
        buf = io.BytesIO()
        np.save(buf, baseline)
        await r.set(_key(member_id), buf.getvalue(), ex=_BASELINE_TTL)
    except Exception:
        logger.exception("[baseline_cache] set 실패 member_id=%d", member_id)
