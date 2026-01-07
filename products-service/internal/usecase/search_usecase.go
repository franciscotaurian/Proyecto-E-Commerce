package usecase

import (
	"context"
	"fmt"
	"os"
	"strconv"

	"products-service/internal/domain"
	"products-service/internal/repository"

	"github.com/blevesearch/bleve/v2"
	"github.com/blevesearch/bleve/v2/search/query"
)

// SearchFilters represents search filter criteria
type SearchFilters struct {
	Category string
	MinPrice float64
	MaxPrice float64
	Color    string
	Size     string
	Query    string
}

// SearchUseCase handles product search using Bleve
type SearchUseCase struct {
	index       bleve.Index
	productRepo repository.ProductRepository
}

// NewSearchUseCase creates a new search use case and initializes Bleve index
func NewSearchUseCase(productRepo repository.ProductRepository) (*SearchUseCase, error) {
	indexPath := os.Getenv("BLEVE_INDEX_PATH")
	if indexPath == "" {
		indexPath = "/tmp/products.bleve"
	}

	var index bleve.Index
	var err error

	// Try to open existing index
	index, err = bleve.Open(indexPath)
	if err != nil {
		// Create new index if it doesn't exist
		mapping := bleve.NewIndexMapping()
		index, err = bleve.New(indexPath, mapping)
		if err != nil {
			return nil, fmt.Errorf("failed to create search index: %w", err)
		}
	}

	uc := &SearchUseCase{
		index:       index,
		productRepo: productRepo,
	}

	// Index all existing products on startup
	go uc.reindexAll()

	return uc, nil
}

// reindexAll indexes all products from the database
func (uc *SearchUseCase) reindexAll() {
	ctx := context.Background()
	products, _, err := uc.productRepo.FindAll(ctx, 1, 1000)
	if err != nil {
		return
	}

	batch := uc.index.NewBatch()
	for _, product := range products {
		batch.Index(product.ID.Hex(), uc.productToDocument(product))
	}
	uc.index.Batch(batch)
}

// productToDocument converts product to searchable document
func (uc *SearchUseCase) productToDocument(product domain.Product) map[string]interface{} {
	// Extract unique colors and sizes
	colors := []string{}
	sizes := []string{}
	for _, v := range product.Variants {
		colors = append(colors, v.Color)
		sizes = append(sizes, v.Size)
	}

	return map[string]interface{}{
		"name":        product.Name,
		"description": product.Description,
		"category":    product.Category,
		"price":       product.Price,
		"colors":      colors,
		"sizes":       sizes,
	}
}

// IndexProduct adds or updates a product in the search index
func (uc *SearchUseCase) IndexProduct(product *domain.Product) error {
	return uc.index.Index(product.ID.Hex(), uc.productToDocument(*product))
}

// DeleteFromIndex removes a product from search index
func (uc *SearchUseCase) DeleteFromIndex(productID string) error {
	return uc.index.Delete(productID)
}

// Search performs a search with filters
func (uc *SearchUseCase) Search(ctx context.Context, filters SearchFilters) ([]domain.Product, error) {
	// Build query
	var queries []query.Query

	// Text search on name and description
	if filters.Query != "" {
		textQuery := bleve.NewMatchQuery(filters.Query)
		queries = append(queries, textQuery)
	}

	// Category filter
	if filters.Category != "" {
		categoryQuery := bleve.NewTermQuery(filters.Category)
		categoryQuery.SetField("category")
		queries = append(queries, categoryQuery)
	}

	// Price range
	if filters.MinPrice > 0 || filters.MaxPrice > 0 {
		min := filters.MinPrice
		max := filters.MaxPrice
		if max == 0 {
			max = 999999999
		}
		priceQuery := bleve.NewNumericRangeQuery(&min, &max)
		priceQuery.SetField("price")
		queries = append(queries, priceQuery)
	}

	// Color filter
	if filters.Color != "" {
		colorQuery := bleve.NewTermQuery(filters.Color)
		colorQuery.SetField("colors")
		queries = append(queries, colorQuery)
	}

	// Size filter
	if filters.Size != "" {
		sizeQuery := bleve.NewTermQuery(filters.Size)
		sizeQuery.SetField("sizes")
		queries = append(queries, sizeQuery)
	}

	// Combine queries
	var finalQuery query.Query
	if len(queries) == 0 {
		finalQuery = bleve.NewMatchAllQuery()
	} else if len(queries) == 1 {
		finalQuery = queries[0]
	} else {
		conjunctionQuery := bleve.NewConjunctionQuery(queries...)
		finalQuery = conjunctionQuery
	}

	// Execute search
	searchRequest := bleve.NewSearchRequest(finalQuery)
	searchRequest.Size = 100
	searchResult, err := uc.index.Search(searchRequest)
	if err != nil {
		return nil, err
	}

	// Fetch full products from database
	var products []domain.Product
	for _, hit := range searchResult.Hits {
		product, err := uc.productRepo.FindByID(ctx, hit.ID)
		if err == nil {
			products = append(products, *product)
		}
	}

	return products, nil
}

// Close closes the search index
func (uc *SearchUseCase) Close() error {
	return uc.index.Close()
}

// Helper function to parse float from string
func parseFloat(s string) float64 {
	f, _ := strconv.ParseFloat(s, 64)
	return f
}
