package main

import (
	"log"
	"os"

	"proyecto-ecommerce/shared/database"
	"proyecto-ecommerce/shared/logger"
	"proyecto-ecommerce/shared/middleware"
	"users-service/internal/delivery/http"
	"users-service/internal/repository"
	"users-service/internal/usecase"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load environment variables
	mongoURI := getEnv("MONGO_URI", "mongodb://mongodb:27017")
	rabbitMQURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
	jwtSecret := getEnv("JWT_SECRET", "your-secret-key-change-in-production")
	port := getEnv("PORT", "8080")

	// Initialize logger
	internalLogger, err := logger.NewInternalLogger("users-service", rabbitMQURL)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer internalLogger.Close()

	internalLogger.Info("Users service starting...")

	// Connect to MongoDB
	mongoClient, err := database.ConnectMongoDB(mongoURI, "ecommerce")
	if err != nil {
		internalLogger.Error("Failed to connect to MongoDB: " + err.Error())
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoClient.Close()

	internalLogger.Info("Connected to MongoDB")

	// Initialize repository
	userRepo := repository.NewMongoUserRepository(mongoClient.Database)

	// Initialize use case
	authUseCase := usecase.NewAuthUseCase(userRepo, jwtSecret)

	// Initialize HTTP handler
	handler := http.NewHandler(authUseCase, jwtSecret)

	// Setup Gin router
	router := gin.Default()

	// Add middlewares
	router.Use(middleware.RateLimitMiddleware())
	router.Use(middleware.LoggingMiddleware(internalLogger))

	// Setup routes
	http.SetupRoutes(router, handler, jwtSecret)

	internalLogger.Info("Users service started on port " + port)

	// Start server
	if err := router.Run(":" + port); err != nil {
		internalLogger.Error("Failed to start server: " + err.Error())
		log.Fatalf("Failed to start server: %v", err)
	}
}

// getEnv gets environment variable or returns default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
