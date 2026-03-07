import enum

from sqlalchemy import BigInteger, Column, DateTime, Enum, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class ModelStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class TrainingDataMetadata(Base):
    __tablename__ = "training_data_metadata"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, nullable=False)
    s3_url = Column(String(512), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())


class TrainedModelMetadata(Base):
    __tablename__ = "trained_model_metadata"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, nullable=False)
    s3_url = Column(String(512), nullable=False)
    status = Column(Enum(ModelStatus), nullable=False, default=ModelStatus.INACTIVE)
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
