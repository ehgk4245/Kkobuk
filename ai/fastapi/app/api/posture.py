import numpy as np
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.auth import verify_token
from app.core.database import SessionLocal
from app.services.inference import build_baseline, load_model, predict

router = APIRouter()


@router.websocket("/ws/posture")
async def posture_ws(ws: WebSocket, token: str = Query(...)):
    # 1. JWT 검증
    try:
        member_id = verify_token(token)
    except Exception:
        await ws.close(code=4001)
        return

    await ws.accept()

    # 2. 모델 로드
    db = SessionLocal()
    try:
        model = load_model(member_id, db)
    finally:
        db.close()

    if model is None:
        await ws.send_json({
            "type": "error",
            "message": "학습된 모델이 없습니다. 먼저 AI 모델 학습을 완료해주세요."
        })
        await ws.close()
        return

    await ws.send_json({"type": "connected"})

    baseline: np.ndarray | None = None

    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "baseline":
                samples = data.get("samples", [])
                if not samples:
                    await ws.send_json({"type": "error", "message": "베이스라인 샘플이 없습니다."})
                    continue
                baseline = build_baseline(samples)
                await ws.send_json({"type": "ready"})

            elif msg_type == "frame":
                if baseline is None:
                    await ws.send_json({"type": "error", "message": "베이스라인이 설정되지 않았습니다."})
                    continue
                landmarks = data.get("landmarks")
                if not landmarks:
                    continue
                label, confidence = predict(model, landmarks, baseline)
                await ws.send_json({"type": "result", "label": label, "confidence": round(confidence, 4)})

    except WebSocketDisconnect:
        pass
