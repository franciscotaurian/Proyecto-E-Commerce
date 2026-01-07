package repository

import (
	"context"
	"products-service/internal/domain"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MongoCategoryRepository struct {
	collection *mongo.Collection
}

type CategoryRepository interface {
	CreateCategory(ctx context.Context, category *domain.Category) error
	FindAllCategories(ctx context.Context) ([]domain.Category, error)
	FindCategoryByName(ctx context.Context, name string) (*domain.Category, error)
	UpdateCategory(ctx context.Context, id string, category *domain.Category) error
	DeleteCategory(ctx context.Context, id string) error
}

func NewMongoCategoryRepository(db *mongo.Database) CategoryRepository {
	return &MongoCategoryRepository{
		collection: db.Collection("categories"),
	}
}

func (r *MongoCategoryRepository) CreateCategory(ctx context.Context, category *domain.Category) error {
	category.ID = primitive.NewObjectID()
	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, category)
	return err
}

func (r *MongoCategoryRepository) FindAllCategories(ctx context.Context) ([]domain.Category, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var categories []domain.Category
	if err = cursor.All(ctx, &categories); err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *MongoCategoryRepository) FindCategoryByName(ctx context.Context, name string) (*domain.Category, error) {
	var category domain.Category
	err := r.collection.FindOne(ctx, bson.M{"name": name}).Decode(&category)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}
	return &category, nil
}

func (r *MongoCategoryRepository) UpdateCategory(ctx context.Context, id string, category *domain.Category) error {
	category.UpdatedAt = time.Now()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrCategoryNotFound
	}

	category.ID = objectID

	filter := bson.M{"_id": objectID}
	update := bson.M{"$set": category}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrCategoryNotFound
	}

	return nil
}

func (r *MongoCategoryRepository) DeleteCategory(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrCategoryNotFound
	}

	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrCategoryNotFound
	}

	return nil
}
