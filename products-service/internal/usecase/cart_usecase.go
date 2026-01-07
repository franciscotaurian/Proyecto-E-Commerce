package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"products-service/internal/domain"
	"products-service/internal/repository"
)

var (
	ErrProductNotAvailable = errors.New("product variant not available")
	ErrInsufficientStock   = errors.New("insufficient stock for requested quantity")
)

// CartUseCase handles shopping cart business logic
type CartUseCase struct {
	cartRepo    repository.CartRepository
	productRepo repository.ProductRepository
}

// NewCartUseCase creates a new cart use case
func NewCartUseCase(cartRepo repository.CartRepository, productRepo repository.ProductRepository) *CartUseCase {
	return &CartUseCase{
		cartRepo:    cartRepo,
		productRepo: productRepo,
	}
}

// CreateCart creates a new cart for a user
func (uc *CartUseCase) CreateCart(ctx context.Context, userID string) (*domain.Cart, error) {
	// Check if cart already exists
	existingCart, err := uc.cartRepo.FindByUserID(ctx, userID)
	if err == nil && existingCart != nil {
		return existingCart, nil
	}

	cart := &domain.Cart{
		UserID:    userID,
		Items:     []domain.CartItem{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := cart.Validate(); err != nil {
		return nil, err
	}

	err = uc.cartRepo.Create(ctx, cart)
	if err != nil {
		return nil, err
	}

	return cart, nil
}

// GetCart retrieves a user's cart
func (uc *CartUseCase) GetCart(ctx context.Context, userID string) (*domain.Cart, error) {
	cart, err := uc.cartRepo.FindByUserID(ctx, userID)
	if err != nil {
		if err == repository.ErrCartNotFound {
			// Create cart if it doesn't exist
			return uc.CreateCart(ctx, userID)
		}
		return nil, err
	}

	return cart, nil
}

// AddToCart adds a product to the cart
func (uc *CartUseCase) AddToCart(ctx context.Context, userID string, item domain.CartItem) (*domain.Cart, error) {
	// Validate item
	if err := item.Validate(); err != nil {
		return nil, err
	}

	// Get product to validate and get current price
	product, err := uc.productRepo.FindByID(ctx, item.ProductID)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	// Find variant and check stock
	variant := product.FindVariant(item.Color, item.Size)
	if variant == nil {
		return nil, fmt.Errorf("variant not found: color=%s, size=%s", item.Color, item.Size)
	}

	if variant.Available() < item.Quantity {
		return nil, fmt.Errorf("%w: available=%d, requested=%d", ErrInsufficientStock, variant.Available(), item.Quantity)
	}

	// Update item with current product data
	item.ProductName = product.Name
	item.Price = product.Price
	if len(product.Images) > 0 {
		item.Image = product.Images[0]
	}

	// Get or create cart
	cart, err := uc.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Add item to cart
	if err := cart.AddItem(item); err != nil {
		return nil, err
	}

	// Save cart
	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

// UpdateCartItem updates the quantity of an item in the cart
func (uc *CartUseCase) UpdateCartItem(ctx context.Context, userID, productID, color, size string, quantity int) (*domain.Cart, error) {
	if quantity <= 0 {
		return nil, errors.New("quantity must be greater than 0")
	}

	// Get product to validate stock
	product, err := uc.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	// Find variant and check stock
	variant := product.FindVariant(color, size)
	if variant == nil {
		return nil, fmt.Errorf("variant not found: color=%s, size=%s", color, size)
	}

	if variant.Available() < quantity {
		return nil, fmt.Errorf("%w: available=%d, requested=%d", ErrInsufficientStock, variant.Available(), quantity)
	}

	// Get cart
	cart, err := uc.cartRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Update item
	if err := cart.UpdateItem(productID, color, size, quantity); err != nil {
		return nil, err
	}

	// Save cart
	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

// RemoveFromCart removes an item from the cart
func (uc *CartUseCase) RemoveFromCart(ctx context.Context, userID, productID, color, size string) (*domain.Cart, error) {
	// Get cart
	cart, err := uc.cartRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Remove item
	if err := cart.RemoveItem(productID, color, size); err != nil {
		return nil, err
	}

	// Save cart
	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

// ClearCart removes all items from the cart
func (uc *CartUseCase) ClearCart(ctx context.Context, userID string) error {
	return uc.cartRepo.Clear(ctx, userID)
}

// DeleteCart deletes a user's cart
func (uc *CartUseCase) DeleteCart(ctx context.Context, userID string) error {
	return uc.cartRepo.Delete(ctx, userID)
}
