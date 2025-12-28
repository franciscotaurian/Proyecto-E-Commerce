package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoClient wraps the MongoDB client
type MongoClient struct {
	Client   *mongo.Client
	Database *mongo.Database
}

// ConnectMongoDB establishes a connection to MongoDB
func ConnectMongoDB(uri, dbName string) (*MongoClient, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Set client options
	clientOptions := options.Client().ApplyURI(uri).
		SetMaxPoolSize(50).
		SetMinPoolSize(10).
		SetMaxConnIdleTime(30 * time.Second)

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping the database to verify connection
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	database := client.Database(dbName)

	return &MongoClient{
		Client:   client,
		Database: database,
	}, nil
}

// Close closes the MongoDB connection
func (mc *MongoClient) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return mc.Client.Disconnect(ctx)
}

// Collection returns a collection from the database
func (mc *MongoClient) Collection(name string) *mongo.Collection {
	return mc.Database.Collection(name)
}
