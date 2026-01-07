# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy shared module (needs to be at ../shared relative to service)
COPY shared/ ./shared/

# Move to service directory
WORKDIR /app/notifications-service

# Copy service code
COPY notifications-service/go.mod notifications-service/go.sum* ./
RUN go mod download

COPY notifications-service/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o notifications-service ./cmd/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/notifications-service/notifications-service .

# Copy email templates
COPY notifications-service/templates ./templates

CMD ["./notifications-service"]
