package repository

import (
	"context"
	"errors"
	"products-service/internal/domain"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var ErrBannerNotFound = errors.New("banner not found")

type BannerRepository interface {
	Create(ctx context.Context, banner *domain.Banner) error
	FindActive(ctx context.Context) (*domain.Banner, error)
	FindAll(ctx context.Context) ([]domain.Banner, error)
	Update(ctx context.Context, id string, banner *domain.Banner) error
	SetActive(ctx context.Context, id string) error
	Delete(ctx context.Context, id string) error
	FindByID(ctx context.Context, id string) (*domain.Banner, error)
}

type MongoBannerRepository struct {
	collection *mongo.Collection
}

func NewMongoBannerRepository(db *mongo.Database) BannerRepository {
	return &MongoBannerRepository{
		collection: db.Collection("banners"),
	}
}

func (r *MongoBannerRepository) Create(ctx context.Context, banner *domain.Banner) error {
	banner.ID = primitive.NewObjectID()
	banner.CreatedAt = time.Now()
	banner.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, banner)
	return err
}

func (r *MongoBannerRepository) FindActive(ctx context.Context) (*domain.Banner, error) {
	var banner domain.Banner
	err := r.collection.FindOne(ctx, bson.M{"is_active": true}).Decode(&banner)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrBannerNotFound
		}
		return nil, err
	}
	return &banner, nil
}

func (r *MongoBannerRepository) FindAll(ctx context.Context) ([]domain.Banner, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var banners []domain.Banner
	if err = cursor.All(ctx, &banners); err != nil {
		return nil, err
	}
	return banners, nil
}

func (r *MongoBannerRepository) Update(ctx context.Context, id string, banner *domain.Banner) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrBannerNotFound
	}

	banner.UpdatedAt = time.Now()
	banner.ID = objectID

	filter := bson.M{"_id": objectID}
	update := bson.M{"$set": banner}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrBannerNotFound
	}

	return nil
}

func (r *MongoBannerRepository) SetActive(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrBannerNotFound
	}

	// First, set all banners to inactive
	_, err = r.collection.UpdateMany(ctx, bson.M{}, bson.M{"$set": bson.M{"is_active": false}})
	if err != nil {
		return err
	}

	// Then, set the target banner to active
	filter := bson.M{"_id": objectID}
	update := bson.M{"$set": bson.M{"is_active": true, "updated_at": time.Now()}}
	
	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrBannerNotFound
	}

	return nil
}

func (r *MongoBannerRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrBannerNotFound
	}

	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrBannerNotFound
	}

	return nil
}

func (r *MongoBannerRepository) FindByID(ctx context.Context, id string) (*domain.Banner, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrBannerNotFound
	}

	var banner domain.Banner
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&banner)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrBannerNotFound
		}
		return nil, err
	}
	return &banner, nil
}
