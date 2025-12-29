package repository

import (
	"context"

	"audit-service/internal/domain"

	"go.mongodb.org/mongo-driver/mongo"
)

// LogRepository interface defines log data operations
type LogRepository interface {
	Insert(ctx context.Context, log *domain.SystemLog) error
}

// MongoLogRepository implements LogRepository using MongoDB
type MongoLogRepository struct {
	collection *mongo.Collection
}

// NewMongoLogRepository creates a new MongoDB log repository
func NewMongoLogRepository(db *mongo.Database) LogRepository {
	return &MongoLogRepository{
		collection: db.Collection("system_logs"),
	}
}

// Insert inserts a new log entry
func (r *MongoLogRepository) Insert(ctx context.Context, log *domain.SystemLog) error {
	_, err := r.collection.InsertOne(ctx, log)
	return err
}
