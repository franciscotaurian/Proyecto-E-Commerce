package repository

import (
	"context"
	"errors"
	"time"

	"products-service/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrProductNotFound   = errors.New("product not found")
	ErrInsufficientStock = errors.New("insufficient stock")
	ErrVariantNotFound   = errors.New("variant not found")
	ErrCategoryNotFound  = errors.New("category not found")
)

// ProductRepository interface defines product data operations
type ProductRepository interface {
	Create(ctx context.Context, product *domain.Product) error
	FindByID(ctx context.Context, id string) (*domain.Product, error)
	FindAll(ctx context.Context, page, limit int) ([]domain.Product, int64, error)
	Update(ctx context.Context, product *domain.Product) error
	Delete(ctx context.Context, id string) error
	FindByCategoryName(ctx context.Context, categoryName string) ([]domain.Product, error)
	ReserveStock(ctx context.Context, productID, color, size string, quantity int) error
	ReleaseStock(ctx context.Context, productID, color, size string, quantity int) error
	DeductStock(ctx context.Context, productID, color, size string, quantity int) error
}

// MongoProductRepository implements ProductRepository using MongoDB
type MongoProductRepository struct {
	collection *mongo.Collection
}

// NewMongoProductRepository creates a new MongoDB product repository
func NewMongoProductRepository(db *mongo.Database) ProductRepository {
	return &MongoProductRepository{
		collection: db.Collection("products"),
	}
}

// Create inserts a new product
func (r *MongoProductRepository) Create(ctx context.Context, product *domain.Product) error {
	product.ID = primitive.NewObjectID()
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, product)
	return err
}

// FindByID finds a product by ID
func (r *MongoProductRepository) FindByID(ctx context.Context, id string) (*domain.Product, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrProductNotFound
	}

	var product domain.Product
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&product)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return &product, nil
}

// FindAll retrieves all products with pagination
func (r *MongoProductRepository) FindAll(ctx context.Context, page, limit int) ([]domain.Product, int64, error) {
	skip := (page - 1) * limit

	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var products []domain.Product
	if err = cursor.All(ctx, &products); err != nil {
		return nil, 0, err
	}

	total, err := r.collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

// Update updates an existing product
func (r *MongoProductRepository) Update(ctx context.Context, product *domain.Product) error {
	product.UpdatedAt = time.Now()

	filter := bson.M{"_id": product.ID}
	update := bson.M{"$set": product}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrProductNotFound
	}

	return nil
}

// Delete removes a product
func (r *MongoProductRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrProductNotFound
	}

	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrProductNotFound
	}

	return nil
}

// ReserveStock reserves stock for a variant
func (r *MongoProductRepository) ReserveStock(ctx context.Context, productID, color, size string, quantity int) error {
	objectID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return ErrProductNotFound
	}

	// Find the product and variant
	product, err := r.FindByID(ctx, productID)
	if err != nil {
		return err
	}

	// Find variant index
	variantIndex := -1
	for i, v := range product.Variants {
		if v.Color == color && v.Size == size {
			variantIndex = i
			break
		}
	}

	if variantIndex == -1 {
		return ErrVariantNotFound
	}

	// Check if enough stock is available
	available := product.Variants[variantIndex].Available()
	if available < quantity {
		return ErrInsufficientStock
	}

	// Update reserved stock
	filter := bson.M{
		"_id": objectID,
		"variants": bson.M{
			"$elemMatch": bson.M{
				"color": color,
				"size":  size,
			},
		},
	}

	update := bson.M{
		"$inc": bson.M{
			"variants.$.reserved": quantity,
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrVariantNotFound
	}

	return nil
}

// ReleaseStock releases reserved stock
func (r *MongoProductRepository) ReleaseStock(ctx context.Context, productID, color, size string, quantity int) error {
	objectID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return ErrProductNotFound
	}

	filter := bson.M{
		"_id": objectID,
		"variants": bson.M{
			"$elemMatch": bson.M{
				"color": color,
				"size":  size,
			},
		},
	}

	update := bson.M{
		"$inc": bson.M{
			"variants.$.reserved": -quantity,
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrVariantNotFound
	}

	return nil
}

// DeductStock deducts from both reserved and quantity
func (r *MongoProductRepository) DeductStock(ctx context.Context, productID, color, size string, quantity int) error {
	objectID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return ErrProductNotFound
	}

	filter := bson.M{
		"_id": objectID,
		"variants": bson.M{
			"$elemMatch": bson.M{
				"color": color,
				"size":  size,
			},
		},
	}

	update := bson.M{
		"$inc": bson.M{
			"variants.$.reserved": -quantity,
			"variants.$.quantity": -quantity,
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrVariantNotFound
	}

	return nil
}

func (r *MongoProductRepository) FindByCategoryName(ctx context.Context, categoryName string) ([]domain.Product, error) {
	var products []domain.Product
	cursor, err := r.collection.Find(ctx, bson.M{"category": categoryName})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &products); err != nil {
		return nil, err
	}

	return products, nil
}
