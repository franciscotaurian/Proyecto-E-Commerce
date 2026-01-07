package repository

import (
	"context"
	"errors"

	"products-service/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var (
	ErrCartNotFound = errors.New("cart not found")
)

// CartRepository defines the interface for cart data access
type CartRepository interface {
	Create(ctx context.Context, cart *domain.Cart) error
	FindByUserID(ctx context.Context, userID string) (*domain.Cart, error)
	Update(ctx context.Context, cart *domain.Cart) error
	Delete(ctx context.Context, userID string) error
	Clear(ctx context.Context, userID string) error
}

// MongoCartRepository implements CartRepository using MongoDB
type MongoCartRepository struct {
	collection *mongo.Collection
}

// NewMongoCartRepository creates a new MongoDB cart repository
func NewMongoCartRepository(db *mongo.Database) CartRepository {
	return &MongoCartRepository{
		collection: db.Collection("carts"),
	}
}

// Create creates a new cart
func (r *MongoCartRepository) Create(ctx context.Context, cart *domain.Cart) error {
	if cart.ID.IsZero() {
		cart.ID = primitive.NewObjectID()
	}

	_, err := r.collection.InsertOne(ctx, cart)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return errors.New("cart already exists for this user")
		}
		return err
	}

	return nil
}

// FindByUserID retrieves a cart by user ID
func (r *MongoCartRepository) FindByUserID(ctx context.Context, userID string) (*domain.Cart, error) {
	var cart domain.Cart

	filter := bson.M{"user_id": userID}
	err := r.collection.FindOne(ctx, filter).Decode(&cart)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	return &cart, nil
}

// Update updates an existing cart
func (r *MongoCartRepository) Update(ctx context.Context, cart *domain.Cart) error {
	filter := bson.M{"user_id": cart.UserID}
	update := bson.M{
		"$set": bson.M{
			"items":      cart.Items,
			"updated_at": cart.UpdatedAt,
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrCartNotFound
	}

	return nil
}

// Delete deletes a cart by user ID
func (r *MongoCartRepository) Delete(ctx context.Context, userID string) error {
	filter := bson.M{"user_id": userID}

	result, err := r.collection.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrCartNotFound
	}

	return nil
}

// Clear removes all items from a cart
func (r *MongoCartRepository) Clear(ctx context.Context, userID string) error {
	filter := bson.M{"user_id": userID}
	update := bson.M{
		"$set": bson.M{
			"items":      []domain.CartItem{},
			"updated_at": primitive.NewDateTimeFromTime(primitive.NewObjectID().Timestamp()),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrCartNotFound
	}

	return nil
}
