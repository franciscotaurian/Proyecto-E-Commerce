package repository

import (
	"context"
	"errors"
	"time"

	"users-service/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrDuplicateEmail  = errors.New("email already exists")
	ErrDuplicateDNI    = errors.New("DNI already exists")
	ErrUserNotVerified = errors.New("user not verified")
)

// UserRepository interface defines user data operations
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByDNI(ctx context.Context, dni string) (*domain.User, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
	FindByVerificationToken(ctx context.Context, token string) (*domain.User, error)
	Update(ctx context.Context, userID string, user *domain.UpdateUserInformation) (*domain.User, error)
	UpdateVerificationStatus(ctx context.Context, userID string, isVerified bool) error
	UpdateVerificationToken(ctx context.Context, userID string, token string) error
	FindByResetPasswordToken(ctx context.Context, token string) (*domain.User, error)
	UpdatePassword(ctx context.Context, userID string, password string) error
	UpdateResetPasswordToken(ctx context.Context, userID string, token string) error
}

// MongoUserRepository implements UserRepository using MongoDB
type MongoUserRepository struct {
	collection *mongo.Collection
}

// NewMongoUserRepository creates a new MongoDB user repository
func NewMongoUserRepository(db *mongo.Database) UserRepository {
	return &MongoUserRepository{
		collection: db.Collection("users"),
	}
}

// Create inserts a new user
func (r *MongoUserRepository) Create(ctx context.Context, user *domain.User) error {
	// Check for duplicate email
	existing, _ := r.FindByEmail(ctx, user.Email)
	if existing != nil {
		return ErrDuplicateEmail
	}

	// Check for duplicate DNI
	existing, _ = r.FindByDNI(ctx, user.DNI)
	if existing != nil {
		return ErrDuplicateDNI
	}

	user.CreatedAt = time.Now()
	user.ID = primitive.NewObjectID()

	_, err := r.collection.InsertOne(ctx, user)
	return err
}

// FindByEmail finds a user by email
func (r *MongoUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// FindByDNI finds a user by DNI
func (r *MongoUserRepository) FindByDNI(ctx context.Context, dni string) (*domain.User, error) {
	var user domain.User
	err := r.collection.FindOne(ctx, bson.M{"dni": dni}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// FindByID finds a user by ID
func (r *MongoUserRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrUserNotFound
	}

	var user domain.User
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// Update updates an existing user
func (r *MongoUserRepository) Update(ctx context.Context, userID string, updatedUser *domain.UpdateUserInformation) (*domain.User, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"first_name": updatedUser.FirstName,
			"last_name":  updatedUser.LastName,
			"phone":      updatedUser.Phone,
			"dni":        updatedUser.DNI,
			"address":    updatedUser.Address,
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return nil, err
	}

	if result.MatchedCount == 0 {
		return nil, ErrUserNotFound
	}

	var user domain.User
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// FindByVerificationToken finds a user by verification token
func (r *MongoUserRepository) FindByVerificationToken(ctx context.Context, token string) (*domain.User, error) {
	var user domain.User
	err := r.collection.FindOne(ctx, bson.M{"verification_token": token}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// UpdateVerificationStatus updates the verification status of a user and clears the token
func (r *MongoUserRepository) UpdateVerificationStatus(ctx context.Context, userID string, isVerified bool) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrUserNotFound
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"is_verified":        isVerified,
			"verification_token": "",
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *MongoUserRepository) FindByResetPasswordToken(ctx context.Context, token string) (*domain.User, error) {
	var user domain.User
	err := r.collection.FindOne(ctx, bson.M{"reset_password_token": token}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *MongoUserRepository) UpdatePassword(ctx context.Context, userID string, password string) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrUserNotFound
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"password": password,
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *MongoUserRepository) UpdateResetPasswordToken(ctx context.Context, userID string, token string) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrUserNotFound
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"reset_password_token": token,
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *MongoUserRepository) UpdateVerificationToken(ctx context.Context, userID string, token string) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrUserNotFound
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"verification_token": token,
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrUserNotFound
	}

	return nil
}
