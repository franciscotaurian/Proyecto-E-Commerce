package http

import (
	"proyecto-ecommerce/shared/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all HTTP routes for the payments service
func SetupRoutes(router *gin.Engine, handler *Handler, jwtSecret string) {
	// Apply CORS middleware globally to handle preflight requests
	router.Use(middleware.CORSMiddleware())

	// Public routes (webhook for MercadoPago notifications)
	public := router.Group("/api/v1")
	{
		public.POST("/webhook/mercadopago", handler.MercadoPagoWebhook)
	}

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
		protectedAdmin.PUT("/orders/:id/shipped", handler.UpdateShippingStatusWithTrackID)
		protectedAdmin.PUT("/orders/:id/status", handler.UpdateShippingStatus)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "payments-service"})
	})
}
