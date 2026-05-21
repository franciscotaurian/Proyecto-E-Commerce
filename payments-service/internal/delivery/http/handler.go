package http

import (
	"context"
	"net/http"
	"time"

	"payments-service/internal/domain"
	"payments-service/internal/usecase"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for payments
type Handler struct {
	checkoutUseCase *usecase.CheckoutUseCase
	paymentUseCase  *usecase.PaymentUseCase
	managerUseCase  *usecase.ManagerUseCase
}

// NewHandler creates a new HTTP handler
func NewHandler(checkoutUseCase *usecase.CheckoutUseCase, paymentUseCase *usecase.PaymentUseCase, managerUseCase *usecase.ManagerUseCase) *Handler {
	return &Handler{
		checkoutUseCase: checkoutUseCase,
		paymentUseCase:  paymentUseCase,
		managerUseCase:  managerUseCase,
	}
}

// CreateOrder handles order creation (checkout)
func (h *Handler) CreateOrder(c *gin.Context) {
	var order domain.Order
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if exists {
		order.UserID = userID.(string)
	}

	err := h.checkoutUseCase.CreateOrder(c.Request.Context(), &order)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Order created successfully",
		"order_id":    order.OrderID,
		"payment_url": order.PaymentURL,
		"order":       order,
	})
}

// GetOrder retrieves an order
func (h *Handler) GetOrder(c *gin.Context) {
	orderID := c.Param("id")

	order, err := h.checkoutUseCase.GetOrder(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// GetUserOrders retrieves all orders for the authenticated user
func (h *Handler) GetUserOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	orders, err := h.checkoutUseCase.GetUserOrders(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"count":  len(orders),
	})
}

// MercadoPagoWebhook handles Mercado Pago payment notifications
func (h *Handler) MercadoPagoWebhook(c *gin.Context) {
	// MercadoPago sends notifications in two formats:
	// 1. New format: ?id=XXX&topic=payment
	// 2. Old format: ?data.id=XXX&type=payment

	// Try new format first
	paymentID := c.Query("id")
	topic := c.Query("topic")

	// If not found, try old format
	if paymentID == "" {
		paymentID = c.Query("data.id")
	}

	if topic == "" {
		topic = c.Query("type")
	}

	// Validate required parameters
	if paymentID == "" || topic == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	// Only process payment notifications, ignore merchant_order notifications
	if topic != "payment" {
		// Return 200 to avoid retries for non-payment notifications
		c.JSON(http.StatusOK, gin.H{"message": "Notification type ignored", "topic": topic})
		return
	}

	// IMPORTANT: Return 200 OK immediately to MercadoPago to avoid retries
	// Process the notification asynchronously
	go func(paymentID string) {
		// Use background context since the request context will be cancelled
		ctx := context.Background()

		// We have the payment ID from MercadoPago
		// Fetch the payment details from MercadoPago API to get the order ID and status
		err := h.paymentUseCase.ProcessMercadoPagoNotification(ctx, paymentID)
		if err != nil {
			// Log the error but don't fail - we already returned 200
			// The logger is inside the use case
		}
	}(paymentID)

	c.JSON(http.StatusOK, gin.H{"message": "Webhook received"})
}

// CancelOrder handles order cancellation
func (h *Handler) CancelOrder(c *gin.Context) {
	orderID := c.Param("id")

	whatsappURL, err := h.paymentUseCase.CancelOrder(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Order cancelled successfully",
		"whatsapp_url": whatsappURL,
	})
}

func (h *Handler) UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")
	status := c.Param("status")

	orderStatus := domain.OrderStatus(status)

	err := h.managerUseCase.UpdateStatus(c.Request.Context(), orderID, orderStatus)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully"})
}

func (h *Handler) FindByID(c *gin.Context) {
	orderID := c.Param("id")

	order, err := h.managerUseCase.FindByID(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

func (h *Handler) GetAllPaidOrders(c *gin.Context) {
	var from, to *time.Time

	if fromStr := c.Query("from"); fromStr != "" {
		t, err := time.Parse(time.RFC3339, fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid 'from' date format, use RFC3339"})
			return
		}
		from = &t
	}

	if toStr := c.Query("to"); toStr != "" {
		t, err := time.Parse(time.RFC3339, toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid 'to' date format, use RFC3339"})
			return
		}
		// Set to end of the day
		endOfDay := time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 999999999, t.Location())
		to = &endOfDay
	}

	orders, err := h.managerUseCase.FindAllPaid(c.Request.Context(), from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"count":  len(orders),
	})
}

func (h *Handler) FindByShippingStatus(c *gin.Context) {
	orders, err := h.managerUseCase.FindByShippingStatus(c.Request.Context(), c.Param("status"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}

func (h *Handler) UpdateShippingStatusWithTrackID(c *gin.Context) {
	orderID := c.Param("id")

	var body struct {
		TrackID string `json:"track_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.TrackID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "track_id is required in request body"})
		return
	}

	err := h.managerUseCase.UpdateShippingStatusWithTrackID(c.Request.Context(), orderID, body.TrackID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shipping status updated successfully"})
}

func (h *Handler) UpdateShippingStatus(c *gin.Context) {
	orderID := c.Param("id")

	var body struct {
		ShippingStatus string `json:"shipping_status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.ShippingStatus == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "shipping_status is required in request body"})
		return
	}

	err := h.managerUseCase.UpdateShippingStatus(c.Request.Context(), orderID, body.ShippingStatus)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shipping status updated successfully"})
}

func (h *Handler) WhatsAppNotification(c *gin.Context) {
	orderID := c.Param("id")

	whatsappURL, err := h.paymentUseCase.WhatsAppNotification(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "WhatsApp notification sent successfully",
		"whatsapp_url": whatsappURL,
	})
}
