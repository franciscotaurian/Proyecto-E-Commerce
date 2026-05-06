package main

import (
	"context"
	"fmt"
	"log"
	"time"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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
	
	// Check categories
	cursor, _ := db.Collection("categories").Find(ctx, bson.M{})
	var categories []bson.M
	cursor.All(ctx, &categories)
	fmt.Println("Categories:")
	for _, c := range categories {
		fmt.Printf(" - ID: %v, Name: %v\n", c["_id"], c["name"])
	}

	// Check products
	cursor2, _ := db.Collection("products").Find(ctx, bson.M{})
	var products []bson.M
	cursor2.All(ctx, &products)
	fmt.Println("\nProducts:")
	for _, p := range products {
		fmt.Printf(" - ID: %v, Name: %v, Category: '%v', UpdatedAt: %v\n", p["_id"], p["name"], p["category"], p["updated_at"])
	}
}
