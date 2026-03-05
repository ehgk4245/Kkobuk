FROM public.ecr.aws/lambda/python:3.11

COPY lambda/requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY shared/ ./shared/
COPY lambda/handler.py .

CMD ["handler.handler"]
