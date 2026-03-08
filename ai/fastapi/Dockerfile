FROM python:3.11-slim

WORKDIR /workspace

COPY fastapi/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 로컬 구조 (ai/shared/, ai/fastapi/) 그대로 유지
COPY shared/ shared/
COPY fastapi/ fastapi/

EXPOSE 8000

WORKDIR /workspace/fastapi
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
