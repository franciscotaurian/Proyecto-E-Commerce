package http

import (
	"net/http"
	"strconv"

	"products-service/internal/domain"
	"products-service/internal/usecase"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for products
type Handler struct {
	productUseCase  *usecase.ProductUseCase
	categoryUseCase *usecase.CategoryUseCase
	searchUseCase   *usecase.SearchUseCase
	cartUseCase     *usecase.CartUseCase
}

// NewHandler creates a new HTTP handler
func NewHandler(productUseCase *usecase.ProductUseCase, categoryUseCase *usecase.CategoryUseCase, searchUseCase *usecase.SearchUseCase, cartUseCase *usecase.CartUseCase) *Handler {
	return &Handler{
		productUseCase:  productUseCase,
		categoryUseCase: categoryUseCase,
		searchUseCase:   searchUseCase,
		cartUseCase:     cartUseCase,
	}
}

// CreateProduct handles product creation
func (h *Handler) CreateProduct(c *gin.Context) {
	var product domain.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.productUseCase.CreateProduct(c.Request.Context(), &product)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Index in search engine
	h.searchUseCase.IndexProduct(&product)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product created successfully",
		"product": product,
	})
}

// GetProduct retrieves a single product
func (h *Handler) GetProduct(c *gin.Context) {
	id := c.Param("id")

	product, err := h.productUseCase.GetProduct(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// ListProducts retrieves all products with pagination
func (h *Handler) ListProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	products, total, err := h.productUseCase.ListProducts(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// UpdateProduct updates a product
func (h *Handler) UpdateProduct(c *gin.Context) {
	id := c.Param("id")

	var product domain.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing product to preserve ID
	existing, err := h.productUseCase.GetProduct(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	product.ID = existing.ID
	err = h.productUseCase.UpdateProduct(c.Request.Context(), &product)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update search index
	h.searchUseCase.IndexProduct(&product)

	c.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"product": product,
	})
}

// DeleteProduct removes a product
func (h *Handler) DeleteProduct(c *gin.Context) {
	id := c.Param("id")

	err := h.productUseCase.DeleteProduct(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Remove from search index
	h.searchUseCase.DeleteFromIndex(id)

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// Search handles product search
func (h *Handler) Search(c *gin.Context) {
	filters := usecase.SearchFilters{
		Query:    c.Query("q"),
		Category: c.Query("category"),
		Color:    c.Query("color"),
		Size:     c.Query("size"),
	}

	if minPrice := c.Query("min_price"); minPrice != "" {
		price, _ := strconv.ParseFloat(minPrice, 64)
		filters.MinPrice = price
	}

	if maxPrice := c.Query("max_price"); maxPrice != "" {
		price, _ := strconv.ParseFloat(maxPrice, 64)
		filters.MaxPrice = price
	}

	products, err := h.searchUseCase.Search(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
	})
}

// ReserveStock handles stock reservation (internal endpoint)
func (h *Handler) ReserveStock(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id" binding:"required"`
		Color     string `json:"color" binding:"required"`
		Size      string `json:"size" binding:"required"`
		Quantity  int    `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.productUseCase.ReserveStock(c.Request.Context(), req.ProductID, req.Color, req.Size, req.Quantity)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock reserved successfully"})
}

// ReleaseStock handles stock release (internal endpoint)
func (h *Handler) ReleaseStock(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id" binding:"required"`
		Color     string `json:"color" binding:"required"`
		Size      string `json:"size" binding:"required"`
		Quantity  int    `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.productUseCase.ReleaseStock(c.Request.Context(), req.ProductID, req.Color, req.Size, req.Quantity)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock released successfully"})
}

// ConfirmPurchase handles stock confirmation (internal endpoint)
func (h *Handler) ConfirmPurchase(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id" binding:"required"`
		Color     string `json:"color" binding:"required"`
		Size      string `json:"size" binding:"required"`
		Quantity  int    `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.productUseCase.ConfirmPurchase(c.Request.Context(), req.ProductID, req.Color, req.Size, req.Quantity)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Purchase confirmed successfully"})
}

func (h *Handler) CreateCategory(c *gin.Context) {
	var category domain.Category

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.categoryUseCase.CreateCategory(c.Request.Context(), &category)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Category created successfully",
		"category": category,
	})
}

func (h *Handler) ListCategories(c *gin.Context) {

	categories, err := h.categoryUseCase.ListCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

func (h *Handler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")

	var category domain.Category

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.categoryUseCase.UpdateCategory(c.Request.Context(), id, &category)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Category updated successfully",
		"category": category,
	})
}

func (h *Handler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")

	err := h.categoryUseCase.DeleteCategory(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

// GetCart retrieves the user's shopping cart
func (h *Handler) GetCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	cart, err := h.cartUseCase.GetCart(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"cart":       cart,
		"total":      cart.GetTotal(),
		"item_count": cart.GetItemCount(),
	})
}

// AddToCart adds a product to the shopping cart
func (h *Handler) AddToCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		ProductID string `json:"product_id" binding:"required"`
		Color     string `json:"color" binding:"required"`
		Size      string `json:"size" binding:"required"`
		Quantity  int    `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item := domain.CartItem{
		ProductID: req.ProductID,
		Color:     req.Color,
		Size:      req.Size,
		Quantity:  req.Quantity,
	}

	cart, err := h.cartUseCase.AddToCart(c.Request.Context(), userID.(string), item)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Product added to cart",
		"cart":       cart,
		"total":      cart.GetTotal(),
		"item_count": cart.GetItemCount(),
	})
}

// UpdateCartItem updates the quantity of an item in the cart
func (h *Handler) UpdateCartItem(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	productID := c.Param("productID")

	var req struct {
		Color    string `json:"color" binding:"required"`
		Size     string `json:"size" binding:"required"`
		Quantity int    `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cart, err := h.cartUseCase.UpdateCartItem(c.Request.Context(), userID.(string), productID, req.Color, req.Size, req.Quantity)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Cart item updated",
		"cart":       cart,
		"total":      cart.GetTotal(),
		"item_count": cart.GetItemCount(),
	})
}

// RemoveFromCart removes an item from the cart
func (h *Handler) RemoveFromCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	productID := c.Param("productID")
	color := c.Param("color")
	size := c.Param("size")

	if color == "" || size == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "color and size query parameters are required"})
		return
	}

	cart, err := h.cartUseCase.RemoveFromCart(c.Request.Context(), userID.(string), productID, color, size)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Product removed from cart",
		"cart":       cart,
		"total":      cart.GetTotal(),
		"item_count": cart.GetItemCount(),
	})
}

// ClearCart removes all items from the cart
func (h *Handler) ClearCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := h.cartUseCase.ClearCart(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared successfully"})
}

func (h *Handler) ClearUserCart(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := h.cartUseCase.ClearCart(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared successfully"})
}
