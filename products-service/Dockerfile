# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies for Bleve
RUN apk add --no-cache git build-base

# Copy shared module first
COPY shared/ ./shared/

# Move to service directory
WORKDIR /app/products-service

# Copy service code
COPY products-service/go.mod products-service/go.sum* ./
COPY products-service/ ./
RUN go mod tidy

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -o products-service ./cmd/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates libc6-compat

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/products-service/products-service .

# Create directory for Bleve index
RUN mkdir -p /data

EXPOSE 8080

CMD ["./products-service"]
