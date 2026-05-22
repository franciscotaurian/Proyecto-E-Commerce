package main

import (
	"log"
	"os"

	"payments-service/internal/client"
	"payments-service/internal/delivery/http"
	"payments-service/internal/messaging"
	"payments-service/internal/repository"
	"payments-service/internal/usecase"
	"payments-service/internal/worker"
	"proyecto-ecommerce/shared/database"
	"proyecto-ecommerce/shared/logger"
	"proyecto-ecommerce/shared/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load environment variables
	mongoURI := getEnv("MONGO_URI", "mongodb://mongodb:27017")
	rabbitMQURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
	jwtSecret := getEnv("JWT_SECRET", "your-secret-key-change-in-production")
	port := getEnv("PORT", "8080")

	productsServiceURL := getEnv("PRODUCTS_SERVICE_URL", "http://products-service:8080")
	usersServiceURL := getEnv("USERS_SERVICE_URL", "http://users-service:8080")
	mercadoPagoToken := getEnv("MERCADOPAGO_ACCESS_TOKEN", "TEST-ACCESS-TOKEN")
	webhookURL := getEnv("WEBHOOK_URL", "http://localhost:8083/api/v1/webhook/mercadopago")
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:5173")

	// Mercado Pago redirect URLs - point to backend redirect endpoints (same ngrok tunnel)
	mercadoPagoSuccessURL := getEnv("MERCADOPAGO_SUCCESS_URL", "http://localhost:8083/payment/success")
	mercadoPagoFailureURL := getEnv("MERCADOPAGO_FAILURE_URL", "http://localhost:8083/payment/failure")
	mercadoPagoPendingURL := getEnv("MERCADOPAGO_PENDING_URL", "http://localhost:8083/payment/pending")

	// Initialize logger
	internalLogger, err := logger.NewInternalLogger("payments-service", rabbitMQURL)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer internalLogger.Close()

	internalLogger.Info("Payments service starting...")

	// Connect to MongoDB
	mongoClient, err := database.ConnectMongoDB(mongoURI, "ecommerce")
	if err != nil {
		internalLogger.Error("Failed to connect to MongoDB: " + err.Error())
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoClient.Close()

	internalLogger.Info("Connected to MongoDB")

	// Initialize clients
	productClient := client.NewProductServiceClient(productsServiceURL)
	userClient := client.NewUserClient(usersServiceURL)
	mercadoPagoClient := client.NewMercadoPagoClient(mercadoPagoToken, mercadoPagoSuccessURL, mercadoPagoFailureURL, mercadoPagoPendingURL)

	// Initialize repository
	orderRepo := repository.NewMongoOrderRepository(mongoClient.Database)

	// Initialize reservation worker
	reservationWorker := worker.NewReservationWorker(orderRepo, productClient, internalLogger)

	// Initialize notification producer
	notificationProducer, err := messaging.NewNotificationProducer(rabbitMQURL)
	if err != nil {
		internalLogger.Error("Failed to initialize notification producer: " + err.Error())
		log.Fatalf("Failed to initialize notification producer: %v", err)
	}
	defer notificationProducer.Close()

	// Initialize use cases

	checkoutUseCase := usecase.NewCheckoutUseCase(
		orderRepo,
		productClient,
		mercadoPagoClient,
		reservationWorker,
		internalLogger,
		webhookURL,
	)

	paymentUseCase := usecase.NewPaymentUseCase(
		orderRepo,
		productClient,
		userClient,
		mercadoPagoClient,
		reservationWorker,
		notificationProducer,
		internalLogger,
	)

	managerUsecase := usecase.NewManagerUseCase(
		orderRepo,
		userClient,
		notificationProducer,
		internalLogger,
	)

	// Initialize HTTP handler
	handler := http.NewHandler(checkoutUseCase, paymentUseCase, managerUsecase)

	// Setup Gin router
	router := gin.Default()

	// Add middlewares
	router.Use(middleware.RateLimitMiddleware())
	router.Use(middleware.LoggingMiddleware(internalLogger))

	// Setup routes
	http.SetupRoutes(router, handler, jwtSecret, frontendURL)

	internalLogger.Info("Payments service started on port " + port)

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
