# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go Backend
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod ./
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o calculator-server ./cmd/server/main.go

# Stage 3: Final Minimal Production Image
FROM alpine:3.19
WORKDIR /app

# Install CA certificates and create a non-root user (UID 10001)
RUN apk --no-cache add ca-certificates && \
    adduser -D -u 10001 appuser

# Copy compiled artifacts with ownership assigned to appuser
COPY --chown=appuser:appuser --from=backend-builder /app/backend/calculator-server ./calculator-server
COPY --chown=appuser:appuser --from=frontend-builder /app/frontend/build ./static

# Switch from root to the unprivileged user
USER appuser

EXPOSE 8080
ENV PORT=8080

CMD ["./calculator-server"]