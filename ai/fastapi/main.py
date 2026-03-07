from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.model import router as model_router
from app.api.posture import router as posture_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "app://kkobuk"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posture_router)
app.include_router(model_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
