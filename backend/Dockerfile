FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
