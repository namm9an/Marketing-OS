# Stage 1: Build React Frontend
FROM node:22-slim AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Web Application
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/
COPY tests/ tests/

# Copy built React dist from Stage 1
COPY --from=build-frontend /app/frontend/dist /app/frontend/dist

ENV PYTHONPATH=/app
EXPOSE 10000

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 4 --timeout 120 app.main:app"]
