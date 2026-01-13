# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy shared module first
COPY shared/ ./shared/

# Move to service directory
WORKDIR /app/audit-service

# Copy service code
COPY audit-service/go.mod audit-service/go.sum* ./
RUN go mod download

COPY audit-service/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o audit-service ./cmd/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/audit-service/audit-service .

CMD ["./audit-service"]
