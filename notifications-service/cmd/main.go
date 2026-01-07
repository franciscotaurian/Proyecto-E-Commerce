package main

import (
	"log"
	"os"

	"notifications-service/internal/consumer"
	"notifications-service/internal/email"
	"proyecto-ecommerce/shared/logger"
)

func main() {
	// Load environment variables
	rabbitmqURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")

	log.Println("Notifications service starting...")

	// Initialize logger
	internalLogger, err := logger.NewInternalLogger("notifications-service", rabbitmqURL)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer internalLogger.Close()

	internalLogger.Info("Notifications service starting...")

	// Initialize email service
	emailService, err := email.NewEmailService()
	if err != nil {
		internalLogger.Error("Failed to initialize email service: " + err.Error())
		log.Fatalf("Failed to initialize email service: %v", err)
	}

	internalLogger.Info("Email service initialized successfully")

	// Initialize consumer with email service and logger
	notificationConsumer, err := consumer.NewNotificationConsumer(rabbitmqURL, emailService, internalLogger)
	if err != nil {
		internalLogger.Error("Failed to initialize notification consumer: " + err.Error())
		log.Fatalf("Failed to initialize notification consumer: %v", err)
	}
	defer notificationConsumer.Close()

	internalLogger.Info("Notification consumer initialized successfully")

	// Start consuming
	log.Fatal(notificationConsumer.Start())
}

// getEnv gets environment variable or returns default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
