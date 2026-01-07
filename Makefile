# Makefile for E-Commerce Microservices

.PHONY: help build up down logs clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-users: ## View logs from users service
	docker-compose logs -f users-service

logs-products: ## View logs from products service
	docker-compose logs -f products-service

logs-payments: ## View logs from payments service
	docker-compose logs -f payments-service

logs-audit: ## View logs from audit service
	docker-compose logs -f audit-service

logs-notifications: ## View logs from notifications service
	docker-compose logs -f notifications-service

ps: ## Show running containers
	docker-compose ps

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v
	docker system prune -f

restart: ## Restart all services
	docker-compose restart

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build
	docker-compose up -d

health: ## Check health of all services
	@echo "Checking services health..."
	@curl -s http://localhost:8081/health | json_pp || echo "Users service not responding"
	@curl -s http://localhost:8082/health | json_pp || echo "Products service not responding"
	@curl -s http://localhost:8083/health | json_pp || echo "Payments service not responding"

mongo: ## Connect to MongoDB shell
	docker exec -it ecommerce-mongodb mongosh ecommerce

rabbitmq: ## Open RabbitMQ management UI
	@echo "Opening RabbitMQ management UI at http://localhost:15672"
	@echo "Username: guest"
	@echo "Password: guest"

dev-users: ## Run users service locally for development
	cd users-service && go run cmd/main.go

dev-products: ## Run products service locally for development
	cd products-service && go run cmd/main.go

dev-payments: ## Run payments service locally for development
	cd payments-service && go run cmd/main.go
