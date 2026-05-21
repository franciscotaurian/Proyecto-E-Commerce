package http

import (
	"fmt"
	"net/http"

	"proyecto-ecommerce/shared/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all HTTP routes for the payments service
func SetupRoutes(router *gin.Engine, handler *Handler, jwtSecret string, frontendURL string) {
	// Apply CORS middleware globally to handle preflight requests
	router.Use(middleware.CORSMiddleware())

	// Public routes
	public := router.Group("/api/v1")
	{
		public.POST("/webhook/mercadopago", handler.MercadoPagoWebhook)
	}

	// MercadoPago redirect routes (public, no auth needed)
	// These receive the redirect from MercadoPago and forward to the frontend
	router.GET("/payment/success", func(c *gin.Context) {
		redirectURL := fmt.Sprintf("%s/payment-success?%s", frontendURL, c.Request.URL.RawQuery)
		c.Redirect(http.StatusFound, redirectURL)
	})
	router.GET("/payment/failure", func(c *gin.Context) {
		redirectURL := fmt.Sprintf("%s/payment-failure?%s", frontendURL, c.Request.URL.RawQuery)
		c.Redirect(http.StatusFound, redirectURL)
	})
	router.GET("/payment/pending", func(c *gin.Context) {
		redirectURL := fmt.Sprintf("%s/payment-pending?%s", frontendURL, c.Request.URL.RawQuery)
		c.Redirect(http.StatusFound, redirectURL)
	})

	// Protected routes (require authentication)
	protected := router.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		protected.POST("/checkout", handler.CreateOrder)
		protected.GET("/orders", handler.GetUserOrders)
		protected.GET("/orders/:id", handler.GetOrder)
		protected.POST("/orders/cancel/:id", handler.CancelOrder)
		protected.GET("/orders/whatsapp/:id", handler.WhatsAppNotification)
	}

	protectedAdmin := router.Group("/api/v1/admin")
	protectedAdmin.Use(middleware.AuthAdminMiddleware(jwtSecret))
	{
		protectedAdmin.GET("/orders", handler.GetAllPaidOrders)
		protectedAdmin.GET("/orders/status/:status", handler.FindByShippingStatus) // must be before /:id
		protectedAdmin.GET("/orders/:id", handler.FindByID)
		protectedAdmin.PUT("/orders/:id/shipped", handler.UpdateShippingStatus)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "payments-service"})
	})
}
