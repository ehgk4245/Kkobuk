FROM python:3.11-slim

WORKDIR /app

COPY fastapi/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# shared 공통 모듈 복사
COPY shared/ ./shared/

# FastAPI 앱 복사
COPY fastapi/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
