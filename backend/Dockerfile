# Stage 1: Build the Go binary
FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod ./
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o calculator-server ./cmd/server/main.go

# Stage 2: Minimal runtime image
FROM alpine:3.19
WORKDIR /app

# Install CA certificates and create a non-root user (UID 10001)
RUN apk --no-cache add ca-certificates && \
    adduser -D -u 10001 appuser

# Copy binary with ownership assigned to appuser
COPY --chown=appuser:appuser --from=builder /app/calculator-server ./calculator-server

# Switch from root to the unprivileged user
USER appuser

EXPOSE 8080
ENV PORT=8080

CMD ["./calculator-server"]