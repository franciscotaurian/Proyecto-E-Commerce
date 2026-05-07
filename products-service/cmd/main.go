package main

import (
	"log"
	"os"

	"products-service/internal/client"
	"products-service/internal/delivery/http"
	"products-service/internal/repository"
	"products-service/internal/usecase"
	"products-service/internal/worker"
	"proyecto-ecommerce/shared/database"
	"proyecto-ecommerce/shared/logger"
	"proyecto-ecommerce/shared/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load environment variables
	mongoURI := getEnv("MONGO_URI", "mongodb://mongodb:27017")
	rabbitMQURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
	port := getEnv("PORT", "8080")
	jwtSecret := getEnv("JWT_SECRET", "your-secret-key-change-in-production")
	cfAccountID := getEnv("CF_ACCOUNT_ID", "")
	cfAccessKeyID := getEnv("CF_ACCESS_KEY", "")
	cfSecretAccessKey := getEnv("CF_SECRET_KEY", "")
	cfBucketName := getEnv("CF_BUCKET_NAME", "")
	cfS3Endpoint := getEnv("CF_S3_ENDPOINT", "")
	cfPublicURL := getEnv("CF_PUBLICURL", "")

	r2Client, err := client.NewR2Client(cfAccountID, cfAccessKeyID, cfSecretAccessKey, cfBucketName, cfS3Endpoint, cfPublicURL)
	if err != nil {
		log.Fatalf("Failed to initialize R2 client: %v", err)
	}

	// Initialize logger
	internalLogger, err := logger.NewInternalLogger("products-service", rabbitMQURL)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer internalLogger.Close()

	internalLogger.Info("Products service starting...")

	// Connect to MongoDB
	mongoClient, err := database.ConnectMongoDB(mongoURI, "ecommerce")
	if err != nil {
		internalLogger.Error("Failed to connect to MongoDB: " + err.Error())
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoClient.Close()

	internalLogger.Info("Connected to MongoDB")

	// Initialize repository
	productRepo := repository.NewMongoProductRepository(mongoClient.Database)
	categoryRepo := repository.NewMongoCategoryRepository(mongoClient.Database)
	cartRepo := repository.NewMongoCartRepository(mongoClient.Database)

	// Initialize use cases
	productUseCase := usecase.NewProductUseCase(productRepo, categoryRepo, r2Client)
	categoryUseCase := usecase.NewCategoryUseCase(categoryRepo, productRepo, r2Client)
	cartUseCase := usecase.NewCartUseCase(cartRepo, productRepo)
	searchUseCase, err := usecase.NewSearchUseCase(productRepo)
	if err != nil {
		internalLogger.Error("Failed to initialize search engine: " + err.Error())
		log.Fatalf("Failed to initialize search engine: %v", err)
	}
	defer searchUseCase.Close()

	internalLogger.Info("Bleve search engine initialized")

	// Initialize and start cart worker
	cartWorker, err := worker.NewCartWorker(cartRepo, rabbitMQURL)
	if err != nil {
		internalLogger.Warn("Failed to initialize cart worker: " + err.Error())
	} else {
		err = cartWorker.Start()
		if err != nil {
			internalLogger.Warn("Failed to start cart worker: " + err.Error())
		} else {
			internalLogger.Info("Cart worker started successfully")
			defer cartWorker.Close()
		}
	}

	// Initialize HTTP handler
	handler := http.NewHandler(productUseCase, categoryUseCase, searchUseCase, cartUseCase)

	// Setup Gin router
	router := gin.Default()

	// Add middlewares
	router.Use(middleware.RateLimitMiddleware())
	router.Use(middleware.LoggingMiddleware(internalLogger))

	// Setup routes
	http.SetupRoutes(router, handler, jwtSecret)

	internalLogger.Info("Products service started on port " + port)

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
