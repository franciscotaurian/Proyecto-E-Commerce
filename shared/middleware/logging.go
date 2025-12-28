package middleware

import (
	"time"

	"proyecto-ecommerce/shared/logger"

	"github.com/gin-gonic/gin"
)

// LoggingMiddleware logs all HTTP requests asynchronously to RabbitMQ
func LoggingMiddleware(log *logger.InternalLogger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Process request
		c.Next()

		// Calculate request duration
		duration := time.Since(start)

		// Extract user ID from context if available
		userID, _ := c.Get("user_id")
		userIDStr := ""
		if uid, ok := userID.(string); ok {
			userIDStr = uid
		}

		// Log the request
		message := "HTTP Request processed in " + duration.String()
		log.InfoWithContext(
			message,
			c.Request.Method,
			c.Request.URL.Path,
			userIDStr,
		)

		// Log errors if any
		if len(c.Errors) > 0 {
			for _, err := range c.Errors {
				log.ErrorWithContext(
					err.Error(),
					c.Request.Method,
					c.Request.URL.Path,
					userIDStr,
					"",
				)
			}
		}
	}
}
