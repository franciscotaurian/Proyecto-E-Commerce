package usecase

import (
	"context"
	"strings"

	"products-service/internal/client"
	"products-service/internal/domain"
	"products-service/internal/repository"
)

// ProductUseCase handles product business logic
type ProductUseCase struct {
	productRepo  repository.ProductRepository
	categoryRepo repository.CategoryRepository
	r2Client     *client.R2Client
}

// NewProductUseCase creates a new product use case
func NewProductUseCase(productRepo repository.ProductRepository, categoryRepo repository.CategoryRepository, r2Client *client.R2Client) *ProductUseCase {
	return &ProductUseCase{
		productRepo:  productRepo,
		categoryRepo: categoryRepo,
		r2Client:     r2Client,
	}
}

// CreateProduct creates a new product
func (uc *ProductUseCase) CreateProduct(ctx context.Context, product *domain.Product) error {
	if err := product.Validate(); err != nil {
		return err
	}

	if _, err := uc.categoryRepo.FindCategoryByName(ctx, product.Category); err != nil {
		return err
	}

	// Carga de imágenes a R2
	for i, img := range product.Images {
		if strings.HasPrefix(img, "data:image") {
			publicURL, err := uc.r2Client.UploadImage(ctx, img, "products")
			if err != nil {
				return err
			}
			product.Images[i] = publicURL
		}
	}

	return uc.productRepo.Create(ctx, product)
}

// GetProduct retrieves a product by ID
func (uc *ProductUseCase) GetProduct(ctx context.Context, id string) (*domain.Product, error) {
	return uc.productRepo.FindByID(ctx, id)
}

// ListProducts retrieves all products with pagination
func (uc *ProductUseCase) ListProducts(ctx context.Context, page, limit int) ([]domain.Product, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return uc.productRepo.FindAll(ctx, page, limit)
}

// UpdateProduct updates an existing product
func (uc *ProductUseCase) UpdateProduct(ctx context.Context, product *domain.Product) error {
	if err := product.Validate(); err != nil {
		return err
	}
	
	// Carga de imágenes a R2
	for i, img := range product.Images {
		if strings.HasPrefix(img, "data:image") {
			publicURL, err := uc.r2Client.UploadImage(ctx, img, "products")
			if err != nil {
				return err
			}
			product.Images[i] = publicURL
		}
	}
	
	return uc.productRepo.Update(ctx, product)
}

// DeleteProduct removes a product
func (uc *ProductUseCase) DeleteProduct(ctx context.Context, id string) error {
	return uc.productRepo.Delete(ctx, id)
}

// ReserveStock reserves stock for a purchase
func (uc *ProductUseCase) ReserveStock(ctx context.Context, productID, color, size string, quantity int) error {
	if quantity <= 0 {
		return repository.ErrInsufficientStock
	}
	return uc.productRepo.ReserveStock(ctx, productID, color, size, quantity)
}

// ReleaseStock releases reserved stock
func (uc *ProductUseCase) ReleaseStock(ctx context.Context, productID, color, size string, quantity int) error {
	if quantity <= 0 {
		return nil
	}
	return uc.productRepo.ReleaseStock(ctx, productID, color, size, quantity)
}

// ConfirmPurchase confirms a purchase and deducts stock
func (uc *ProductUseCase) ConfirmPurchase(ctx context.Context, productID, color, size string, quantity int) error {
	if quantity <= 0 {
		return nil
	}
	return uc.productRepo.DeductStock(ctx, productID, color, size, quantity)
}

func (uc *ProductUseCase) ListProductsByCategoryName(ctx context.Context, categoryName string) ([]domain.Product, error) {
	return uc.productRepo.FindByCategoryName(ctx, categoryName)
}
