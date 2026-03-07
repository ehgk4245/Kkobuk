from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_member_id
from app.core.database import get_db
from app.models.ai_metadata import ModelStatus, TrainedModelMetadata
from app.services.inference import invalidate_model_cache

router = APIRouter(prefix="/api/models")


@router.get("")
def list_models(member_id: int = Depends(get_current_member_id), db: Session = Depends(get_db)):
    rows = (
        db.query(TrainedModelMetadata)
        .filter_by(member_id=member_id)
        .order_by(TrainedModelMetadata.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "status": r.status,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.put("/{model_id}/activate")
def activate_model(
    model_id: int,
    member_id: int = Depends(get_current_member_id),
    db: Session = Depends(get_db),
):
    target = (
        db.query(TrainedModelMetadata)
        .filter_by(id=model_id, member_id=member_id)
        .first()
    )
    if target is None:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다.")

    db.query(TrainedModelMetadata).filter_by(member_id=member_id).update(
        {"status": ModelStatus.INACTIVE}
    )
    target.status = ModelStatus.ACTIVE
    db.commit()

    invalidate_model_cache(member_id)

    return {"ok": True}
