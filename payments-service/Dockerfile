# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy shared module first
COPY shared/ ./shared/

# Move to service directory
WORKDIR /app/payments-service

# Copy service code
COPY payments-service/go.mod payments-service/go.sum* ./
RUN go mod download

COPY payments-service/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o payments-service ./cmd/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/payments-service/payments-service .

EXPOSE 8080

CMD ["./payments-service"]
