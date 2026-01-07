package usecase

import (
	"context"
	"fmt"
	"net/url"

	"payments-service/internal/client"
	"payments-service/internal/domain"
	"payments-service/internal/messaging"
	"payments-service/internal/repository"
	"payments-service/internal/worker"
	"proyecto-ecommerce/shared/logger"
)

// PaymentUseCase handles payment processing logic
type PaymentUseCase struct {
	orderRepo            repository.OrderRepository
	productClient        *client.ProductServiceClient
	userClient           *client.UserClient
	envioPackClient      *client.EnvioPackClient
	mercadoPagoClient    *client.MercadoPagoClient
	reservationWorker    *worker.ReservationWorker
	notificationProducer *messaging.NotificationProducer
	logger               *logger.InternalLogger
}

// NewPaymentUseCase creates a new payment use case
func NewPaymentUseCase(
	orderRepo repository.OrderRepository,
	productClient *client.ProductServiceClient,
	userClient *client.UserClient,
	envioPackClient *client.EnvioPackClient,
	mercadoPagoClient *client.MercadoPagoClient,
	reservationWorker *worker.ReservationWorker,
	notificationProducer *messaging.NotificationProducer,
	log *logger.InternalLogger,
) *PaymentUseCase {
	return &PaymentUseCase{
		orderRepo:            orderRepo,
		productClient:        productClient,
		userClient:           userClient,
		envioPackClient:      envioPackClient,
		mercadoPagoClient:    mercadoPagoClient,
		reservationWorker:    reservationWorker,
		notificationProducer: notificationProducer,
		logger:               log,
	}
}

// ConfirmPayment confirms a successful payment
func (uc *PaymentUseCase) ConfirmPayment(ctx context.Context, orderID string) error {
	// Get order
	order, err := uc.orderRepo.FindByOrderID(ctx, orderID)
	if err != nil {
		return err
	}

	// Cancel the timeout timer
	uc.reservationWorker.CancelTimer(orderID)

	// Confirm purchase (deduct stock)
	for _, item := range order.Items {
		err := uc.productClient.ConfirmPurchase(item.ProductID, item.Color, item.Size, item.Quantity)
		if err != nil {
			uc.logger.ErrorWithContext(
				fmt.Sprintf("Failed to confirm purchase for product %s: %v", item.ProductID, err),
				"PAYMENT",
				"/webhook",
				"",
				"",
			)
			return err
		}
	}

	// Update order status
	err = uc.orderRepo.UpdateStatus(ctx, orderID, domain.StatusPaid)
	if err != nil {
		return err
	}

	uc.logger.Info(fmt.Sprintf("Payment confirmed for order %s", orderID))

	// Get user info

	userInfo, err := uc.userClient.GetUserInfo(order.UserID)
	if err != nil {
		uc.logger.Error(fmt.Sprintf("Failed to get user info for order %s: %v", orderID, err))
		return err
	} else {
		uc.logger.Info(fmt.Sprintf("User info retrieved for order %s", orderID))
	}

	userInformation := domain.UserInfo{
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		DNI:       userInfo.DNI,
		Email:     userInfo.Email,
		Phone:     userInfo.Phone,
	}

	// Send notification based on shipping method
	if order.ShippingMethod == domain.ShippingMethodSend {
		return uc.EmailNotification(order, &userInformation)
	}

	// Send order to Enviopack

	return nil
}

// FailPayment handles failed payment
func (uc *PaymentUseCase) FailPayment(ctx context.Context, orderID string) error {
	// Get order
	order, err := uc.orderRepo.FindByOrderID(ctx, orderID)
	if err != nil {
		return err
	}

	// Cancel the timeout timer
	uc.reservationWorker.CancelTimer(orderID)

	// Release reserved stock
	for _, item := range order.Items {
		err := uc.productClient.ReleaseStock(item.ProductID, item.Color, item.Size, item.Quantity)
		if err != nil {
			uc.logger.Error(fmt.Sprintf("Failed to release stock for product %s: %v", item.ProductID, err))
		}
	}

	// Update order status
	err = uc.orderRepo.UpdateStatus(ctx, orderID, domain.StatusCancelled)
	if err != nil {
		return err
	}

	uc.logger.Info(fmt.Sprintf("Payment failed for order %s", orderID))

	return nil
}

// CancelOrder cancels an order
func (uc *PaymentUseCase) CancelOrder(ctx context.Context, orderID string) (string, error) {
	// Get order
	order, err := uc.orderRepo.FindByOrderID(ctx, orderID)
	if err != nil {
		return "", err
	}

	// Only allow cancellation of pending orders
	if order.Status != domain.StatusPending && order.Status != domain.StatusPaid {
		return "", fmt.Errorf("cannot cancel order with status %s", order.Status)
	}

	// Cancel timer if pending
	if order.Status == domain.StatusPending {
		uc.reservationWorker.CancelTimer(orderID)

		// Release stock
		for _, item := range order.Items {
			_ = uc.productClient.ReleaseStock(item.ProductID, item.Color, item.Size, item.Quantity)
		}
	}

	// Update status
	err = uc.orderRepo.UpdateStatus(ctx, orderID, domain.StatusCancelled)
	if err != nil {
		return "", err
	}

	// Generate WhatsApp URL (placeholder - would get user phone from user service)
	phone := "1234567890" // TODO: Get from user service
	whatsappURL := fmt.Sprintf("https://wa.me/%s?text=Cancelación%%20Pedido%%20ID:%s", phone, orderID)

	uc.logger.Info(fmt.Sprintf("Order %s cancelled", orderID))

	return whatsappURL, nil
}

// ProcessMercadoPagoNotification processes a payment notification from MercadoPago
func (uc *PaymentUseCase) ProcessMercadoPagoNotification(ctx context.Context, paymentID string) error {
	// Fetch payment details from MercadoPago
	payment, err := uc.mercadoPagoClient.GetPayment(paymentID)
	if err != nil {
		uc.logger.Error(fmt.Sprintf("Failed to get payment %s from MercadoPago: %v", paymentID, err))
		return fmt.Errorf("failed to get payment details: %w", err)
	}

	// Get the order ID from external_reference
	orderID := payment.ExternalReference
	if orderID == "" {
		uc.logger.Error(fmt.Sprintf("Payment %s has no external_reference", paymentID))
		return fmt.Errorf("payment has no external reference")
	}

	uc.logger.Info(fmt.Sprintf("Processing payment notification - PaymentID: %s, OrderID: %s, Status: %s", paymentID, orderID, payment.Status))

	// Check if this payment ID has already been processed for this order
	alreadyProcessed, err := uc.orderRepo.HasProcessedPaymentID(ctx, orderID, paymentID)
	if err != nil {
		uc.logger.Error(fmt.Sprintf("Failed to check if payment %s was already processed: %v", paymentID, err))
		return fmt.Errorf("failed to check payment status: %w", err)
	}

	if alreadyProcessed {
		uc.logger.Info(fmt.Sprintf("Payment %s already processed for order %s, skipping to avoid duplicates", paymentID, orderID))
		return nil
	}

	// Mark payment as processed BEFORE processing to prevent race conditions
	// If two webhooks arrive simultaneously, only one can mark it first
	err = uc.orderRepo.AddProcessedPaymentID(ctx, orderID, paymentID)
	if err != nil {
		uc.logger.Error(fmt.Sprintf("Failed to mark payment %s as processed: %v", paymentID, err))
		return fmt.Errorf("failed to mark payment as processed: %w", err)
	}

	uc.logger.Info(fmt.Sprintf("Payment %s marked as processed for order %s", paymentID, orderID))

	// Handle payment based on status
	switch payment.Status {
	case "approved":
		// Payment was successful
		return uc.ConfirmPayment(ctx, orderID)
	case "cancelled", "rejected":
		// Payment failed or was cancelled
		return uc.FailPayment(ctx, orderID)
	case "pending", "in_process", "in_mediation":
		// Payment is still being processed, don't do anything yet
		uc.logger.Info(fmt.Sprintf("Payment %s is pending/in_process for order %s", paymentID, orderID))
		return nil
	default:
		uc.logger.Warn(fmt.Sprintf("Unknown payment status %s for payment %s", payment.Status, paymentID))
		return nil
	}
}

func (uc *PaymentUseCase) EmailNotification(order *domain.Order, userInfo *domain.UserInfo) error {
	products := []messaging.ProductItem{}
	for _, item := range order.Items {
		products = append(products, messaging.ProductItem{
			Name:     item.ProductName,
			Quantity: item.Quantity,
			Price:    fmt.Sprintf("$%.2f", item.Price),
		})
	}

	templateData := messaging.PaymentConfirmedEvent{
		CustomerName: userInfo.FirstName + " " + userInfo.LastName,
		OrderID:      order.OrderID,
		Products:     products,
		Total:        fmt.Sprintf("$%.2f", order.TotalAmount),
		ShippingInfo: messaging.ShippingInfo{
			Address:    order.ShippingAddress.Street,
			Number:     order.ShippingAddress.Number,
			Floor:      order.ShippingAddress.Floor,
			Apartment:  order.ShippingAddress.Apartment,
			City:       order.ShippingAddress.City,
			Province:   order.ShippingAddress.Province,
			PostalCode: order.ShippingAddress.ZipCode,
			Country:    order.ShippingAddress.Country,
		},
	}

	// Send email notification via RabbitMQ
	notification := messaging.EmailNotification{
		To:           userInfo.Email,
		Subject:      "Confirmación de Compra - Pedido " + order.OrderID,
		Body:         fmt.Sprintf("Tu pedido %s ha sido confirmado y pagado exitosamente.", order.OrderID),
		TemplateName: "confirmation_email.html",
		TemplateData: templateData,
	}

	if err := uc.notificationProducer.PublishEmailNotification(notification); err != nil {
		uc.logger.Error(fmt.Sprintf("Failed to publish notification for order %s: %v", order.OrderID, err))
		// Don't fail the payment if notification fails
	} else {
		uc.logger.Info(fmt.Sprintf("Notification published for order %s", order.OrderID))
	}

	return nil

}

func (uc *PaymentUseCase) WhatsAppNotification(ctx context.Context, orderID string) (whatsappURL string, err error) {
	// Build items list for the message

	order, err := uc.orderRepo.FindByOrderID(ctx, orderID)
	if err != nil {
		return "", err
	}

	if order.Status != domain.StatusPaid {
		return "", fmt.Errorf("order %s is not paid", orderID)
	}

	userInfo, err := uc.userClient.GetUserInfo(order.UserID)
	if err != nil {
		return "", err
	}

	// Build items list with each item on a new line
	itemsList := ""
	for i, item := range order.Items {
		itemsList += fmt.Sprintf("  • %s\n    Color: %s\n    Talla: %s\n    Cantidad: %d",
			item.ProductName, item.Color, item.Size, item.Quantity)
		if i < len(order.Items)-1 {
			itemsList += "\n\n"
		}
	}

	// Build address string with each field on a new line
	address := fmt.Sprintf("Calle: %s %s\nPiso: %s\nDpto: %s\nCiudad: %s\nProvincia: %s\nCódigo Postal: %s\nPaís: %s",
		order.ShippingAddress.Street,
		order.ShippingAddress.Number,
		order.ShippingAddress.Floor,
		order.ShippingAddress.Apartment,
		order.ShippingAddress.City,
		order.ShippingAddress.Province,
		order.ShippingAddress.ZipCode,
		order.ShippingAddress.Country,
	)

	// Build WhatsApp message with proper formatting
	message := fmt.Sprintf(
		"Hola, soy %s %s\n\nAcabo de realizar el pago de la orden: *%s*\n\n📦 *Items:*\n%s\n\n📍 *Dirección de envío:*\n%s",
		userInfo.FirstName,
		userInfo.LastName,
		order.OrderID,
		itemsList,
		address,
	)

	phone := "+542302347970" // TODO: Get from user service
	// URL encode the message to properly handle spaces and newlines
	whatsappURL = fmt.Sprintf("https://wa.me/%s?text=%s", phone, url.QueryEscape(message))

	return whatsappURL, nil
}
