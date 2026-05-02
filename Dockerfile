# Stage 1: Build the React Frontend
FROM node:20-alpine AS build-stage
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install -g npm@latest && npm install --legacy-peer-deps

# Copy source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Python Backend and serve
FROM python:3.11-slim AS production-stage
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build from stage 1
COPY --from=build-stage /app/frontend/dist ./frontend/dist

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Run uvicorn
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
