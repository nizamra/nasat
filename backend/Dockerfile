FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev

COPY requirements.txt .

RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

FROM python:3.12-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

RUN pip install --no-cache --no-index --find-links=/wheels -r requirements.txt

COPY . .

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN DJANGO_SECRET_KEY=dummy python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
