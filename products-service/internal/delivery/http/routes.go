package http

import (
	"proyecto-ecommerce/shared/middleware"

	"github.com/gin-gonic/gin"
)

//cors

// SetupRoutes configures all HTTP routes for the products service
func SetupRoutes(router *gin.Engine, handler *Handler, jwtSecret string) {
	// Apply CORS middleware globally to handle preflight requests
	router.Use(middleware.CORSMiddleware())

	// Public routes
	public := router.Group("/api/v1")
	{
		public.GET("/products", handler.ListProducts)
		public.GET("/products/:id", handler.GetProduct)
		public.GET("/search", handler.Search)
		public.GET("/categories", handler.ListCategories)
		public.GET("/categories/featured", handler.GetFeaturedCategories)
		public.GET("/banners/active", handler.GetActiveBanner)
	}

	// Admin routes (should have auth middleware in production)
	admin := router.Group("/api/v1/admin")
	admin.Use(middleware.AuthAdminMiddleware(jwtSecret))
	{
		admin.POST("/products", handler.CreateProduct)
		admin.PUT("/products/:id", handler.UpdateProduct)
		admin.DELETE("/products/:id", handler.DeleteProduct)
		admin.POST("/categories", handler.CreateCategory)
		admin.PUT("/categories/:id", handler.UpdateCategory)
		admin.DELETE("/categories/:id", handler.DeleteCategory)
		admin.PUT("/categories/:id/feature", handler.SetFeaturedCategory)

		admin.GET("/banners", handler.ListBanners)
		admin.POST("/banners", handler.CreateBanner)
		admin.PUT("/banners/:id", handler.UpdateBanner)
		admin.PUT("/banners/:id/activate", handler.SetActiveBanner)
		admin.DELETE("/banners/:id", handler.DeleteBanner)
	}

	// Internal routes (for inter-service communication)
	internal := router.Group("/internal")
	{
		internal.POST("/reserve", handler.ReserveStock)
		internal.POST("/release", handler.ReleaseStock)
		internal.POST("/confirm", handler.ConfirmPurchase)
		internal.DELETE("/cart/clear/:user_id", handler.ClearUserCart)
	}

	// Cart routes (protected)
	cartRoutes := router.Group("/api/v1/cart")
	cartRoutes.Use(middleware.AuthMiddleware(jwtSecret))
	{
		cartRoutes.GET("", handler.GetCart)
		cartRoutes.POST("/items", handler.AddToCart)
		cartRoutes.PUT("/items/:productID", handler.UpdateCartItem)
		cartRoutes.DELETE("/items/:productID/:size/:color", handler.RemoveFromCart)
		cartRoutes.DELETE("", handler.ClearCart)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "products-service"})
	})
}
