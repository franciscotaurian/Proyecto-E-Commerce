package main

import (
	"log"
	"os"

	"audit-service/internal/consumer"
	"audit-service/internal/repository"
	"proyecto-ecommerce/shared/database"
)

func main() {
	// Load environment variables
	mongoURI := getEnv("MONGO_URI", "mongodb://mongodb:27017")
	rabbitMQURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")

	log.Println("Audit service starting...")

	// Connect to MongoDB
	mongoClient, err := database.ConnectMongoDB(mongoURI, "ecommerce")
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoClient.Close()

	log.Println("Connected to MongoDB")

	// Initialize repository
	logRepo := repository.NewMongoLogRepository(mongoClient.Database)

	// Initialize consumer
	logConsumer, err := consumer.NewLogConsumer(rabbitMQURL, logRepo)
	if err != nil {
		log.Fatalf("Failed to initialize log consumer: %v", err)
	}
	defer logConsumer.Close()

	// Start consuming
	log.Fatal(logConsumer.Start())
}

// getEnv gets environment variable or returns default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
