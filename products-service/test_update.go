package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"products-service/internal/domain"
	"products-service/internal/repository"
	"products-service/internal/usecase"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	db := client.Database("ecommerce")

	catRepo := repository.NewMongoCategoryRepository(db)
	prodRepo := repository.NewMongoProductRepository(db)
	uc := usecase.NewCategoryUseCase(catRepo, prodRepo)

	// Create a dummy category "Prueba"
	cat := &domain.Category{
		Name: "Prueba",
		Image: "img",
	}
	err = catRepo.CreateCategory(ctx, cat)
	if err != nil {
		log.Fatal(err)
	}

	// Create a dummy product with "Prueba"
	prod := &domain.Product{
		Name: "Test Product",
		Category: "Prueba",
		Price: 10,
		Variants: []domain.StockVariant{{Color: "R", Size: "M", Quantity: 1}},
	}
	err = prodRepo.Create(ctx, prod)
	if err != nil {
		log.Fatal(err)
	}

	// Find the category we just created
	cats, _ := catRepo.FindAllCategories(ctx)
	var catID string
	for _, c := range cats {
		if c.Name == "Prueba" {
			catID = c.ID.Hex()
			break
		}
	}

	fmt.Println("Created Category ID:", catID)

	// Update category
	newCat := &domain.Category{
		Name: "PruebaEditado",
		Image: "img",
	}

	fmt.Println("Calling UpdateCategory...")
	err = uc.UpdateCategory(ctx, catID, newCat)
	if err != nil {
		fmt.Println("Error in UpdateCategory:", err)
	}

	// Check product
	foundProd, _ := prodRepo.FindByID(ctx, prod.ID.Hex())
	fmt.Printf("Product category is now: '%s', UpdatedAt: %v\n", foundProd.Category, foundProd.UpdatedAt)

	// Clean up
	objID, _ := primitive.ObjectIDFromHex(catID)
	db.Collection("categories").DeleteOne(ctx, bson.M{"_id": objID})
	db.Collection("products").DeleteOne(ctx, bson.M{"_id": prod.ID})
}
