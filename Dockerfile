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

COPY runtime/ runtime/
COPY web/ web/
COPY tests/ tests/
COPY examples/ examples/
COPY run_agent.py .

# Copy built React dist from Stage 1
COPY --from=build-frontend /app/frontend/dist /app/frontend/dist

EXPOSE 5000

CMD ["python3", "web/app.py"]
