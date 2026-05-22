package repository

import (
	"context"
	"errors"
	"time"

	"payments-service/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrOrderNotFound = errors.New("order not found")
)

// OrderRepository interface defines order data operations
type OrderRepository interface {
	Create(ctx context.Context, order *domain.Order) error
	FindByID(ctx context.Context, id string) (*domain.Order, error)
	FindByOrderID(ctx context.Context, orderID string) (*domain.Order, error)
	FindByUserID(ctx context.Context, userID string) ([]domain.Order, error)
	FindByShippingStatus(ctx context.Context, shippingStatus string) ([]domain.Order, error)
	FindAllPaid(ctx context.Context, from, to *time.Time) ([]domain.ReponseOrder, error)
	UpdateStatus(ctx context.Context, orderID string, status domain.OrderStatus) error
	Update(ctx context.Context, order *domain.Order) error
	HasProcessedPaymentID(ctx context.Context, orderID string, paymentID string) (bool, error)
	AddProcessedPaymentID(ctx context.Context, orderID string, paymentID string) error
	UpdateTrackingNumber(ctx context.Context, orderID string, trackingNumber string) error
}

// MongoOrderRepository implements OrderRepository using MongoDB
type MongoOrderRepository struct {
	collection *mongo.Collection
}

// NewMongoOrderRepository creates a new MongoDB order repository
func NewMongoOrderRepository(db *mongo.Database) OrderRepository {
	return &MongoOrderRepository{
		collection: db.Collection("orders"),
	}
}

// Create inserts a new order
func (r *MongoOrderRepository) Create(ctx context.Context, order *domain.Order) error {
	order.ID = primitive.NewObjectID()
	order.CreatedAt = time.Now()
	order.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, order)
	return err
}

// FindByID finds an order by MongoDB ID
func (r *MongoOrderRepository) FindByID(ctx context.Context, id string) (*domain.Order, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	var order domain.Order
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&order)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}
	return &order, nil
}

// FindByOrderID finds an order by Order ID
func (r *MongoOrderRepository) FindByOrderID(ctx context.Context, orderID string) (*domain.Order, error) {
	var order domain.Order
	err := r.collection.FindOne(ctx, bson.M{"order_id": orderID}).Decode(&order)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}
	return &order, nil
}

// FindByUserID retrieves all orders for a user
func (r *MongoOrderRepository) FindByUserID(ctx context.Context, userID string) ([]domain.Order, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []domain.Order
	if err = cursor.All(ctx, &orders); err != nil {
		return nil, err
	}

	return orders, nil
}

func (r *MongoOrderRepository) FindAllPaid(ctx context.Context, from, to *time.Time) ([]domain.ReponseOrder, error) {
	filter := bson.M{"status": "Paid"}
	if from != nil || to != nil {
		dateFilter := bson.M{}
		if from != nil {
			dateFilter["$gte"] = *from
		}
		if to != nil {
			dateFilter["$lte"] = *to
		}
		filter["created_at"] = dateFilter
	}

	opts := &options.FindOptions{}
	sort := bson.D{{Key: "created_at", Value: -1}}
	opts.SetSort(sort)

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []domain.Order
	if err = cursor.All(ctx, &orders); err != nil {
		return nil, err
	}
	responseOrder := []domain.ReponseOrder{}
	for _, order := range orders {
		responseOrder = append(responseOrder, order.ToResponseOrder())
	}
	return responseOrder, nil
}

func (r *MongoOrderRepository) FindByShippingStatus(ctx context.Context, shippingStatus string) ([]domain.Order, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"shipping_status": shippingStatus, "status": "Paid"})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []domain.Order
	if err = cursor.All(ctx, &orders); err != nil {
		return nil, err
	}

	return orders, nil
}

// UpdateStatus updates the status of an order
func (r *MongoOrderRepository) UpdateStatus(ctx context.Context, orderID string, status domain.OrderStatus) error {
	filter := bson.M{"order_id": orderID}
	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"updated_at": time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrOrderNotFound
	}

	return nil
}

// Update updates an entire order
func (r *MongoOrderRepository) Update(ctx context.Context, order *domain.Order) error {
	order.UpdatedAt = time.Now()

	filter := bson.M{"_id": order.ID}
	update := bson.M{"$set": order}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrOrderNotFound
	}

	return nil
}

// HasProcessedPaymentID checks if a payment ID has already been processed for an order
func (r *MongoOrderRepository) HasProcessedPaymentID(ctx context.Context, orderID string, paymentID string) (bool, error) {
	filter := bson.M{
		"order_id":              orderID,
		"processed_payment_ids": bson.M{"$in": []string{paymentID}},
	}

	count, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// AddProcessedPaymentID adds a payment ID to the list of processed payments for an order
// Uses $addToSet to avoid duplicates atomically
func (r *MongoOrderRepository) AddProcessedPaymentID(ctx context.Context, orderID string, paymentID string) error {
	filter := bson.M{"order_id": orderID}
	update := bson.M{
		"$addToSet": bson.M{
			"processed_payment_ids": paymentID,
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
		return ErrOrderNotFound
	}

	return nil
}

func (r *MongoOrderRepository) UpdateTrackingNumber(ctx context.Context, orderID string, trackingNumber string) error {
	filter := bson.M{"order_id": orderID}
	update := bson.M{
		"$set": bson.M{
			"tracking_number": trackingNumber,
			"updated_at":      time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrOrderNotFound
	}

	return nil
}
