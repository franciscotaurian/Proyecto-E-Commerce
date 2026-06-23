package http

import (
	"proyecto-ecommerce/shared/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all HTTP routes for the users service
func SetupRoutes(router *gin.Engine, handler *Handler, jwtSecret string) {
	// Apply CORS middleware globally to handle preflight requests
	router.Use(middleware.CORSMiddleware())

	// Public routes
	public := router.Group("/api/v1")
	{
		public.POST("/register", handler.Register)
		public.POST("/login", handler.Login)
		public.GET("/auth/verify/:token", handler.VerifyEmail)
		public.POST("/auth/reset-password-email", handler.SendResetPasswordEmail)
		public.POST("/auth/resend-verification", handler.ResendVerificationEmail)
		public.GET("/auth/reset-password/:token", handler.ShowResetPasswordForm)
		public.POST("/auth/reset-password", handler.ResetPassword)
	}

	// Protected routes (require authentication)
	protected := router.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{

		protected.PUT("/profile", handler.UpdateProfile)
		protected.GET("/profile", handler.GetProfile)
	}

	internal := router.Group("/internal")
	{
		internal.GET("/user_information/:id", handler.GetUserInformation)
		internal.GET("/is-verified/:id", handler.IsVerifiedUser)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "users-service"})
	})
}
