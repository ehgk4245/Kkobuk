import logging
import os

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        host = os.environ.get("REDIS_HOST", "127.0.0.1")
        password = os.environ.get("REDIS_PASSWORD") or None
        try:
            _redis = aioredis.Redis(
                host=host,
                port=6379,
                password=password,
                decode_responses=False,
            )
        except Exception:
            logger.exception("[redis] 클라이언트 초기화 실패")
    return _redis
