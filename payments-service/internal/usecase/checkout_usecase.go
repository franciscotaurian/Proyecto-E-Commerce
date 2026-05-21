package usecase

import (
	"context"
	"fmt"
	"time"

	"payments-service/internal/client"
	"payments-service/internal/domain"
	"payments-service/internal/repository"
	"payments-service/internal/worker"
	"proyecto-ecommerce/shared/logger"

	"github.com/google/uuid"
)

// CheckoutUseCase handles checkout business logic
type CheckoutUseCase struct {
	orderRepo         repository.OrderRepository
	productClient     *client.ProductServiceClient
	mercadoPagoClient *client.MercadoPagoClient
	reservationWorker *worker.ReservationWorker
	logger            *logger.InternalLogger
	webhookURL        string
}

// NewCheckoutUseCase creates a new checkout use case
func NewCheckoutUseCase(
	orderRepo repository.OrderRepository,
	productClient *client.ProductServiceClient,
	mercadoPagoClient *client.MercadoPagoClient,
	reservationWorker *worker.ReservationWorker,
	log *logger.InternalLogger,
	webhookURL string,
) *CheckoutUseCase {
	return &CheckoutUseCase{
		orderRepo:         orderRepo,
		productClient:     productClient,
		mercadoPagoClient: mercadoPagoClient,
		reservationWorker: reservationWorker,
		logger:            log,
		webhookURL:        webhookURL,
	}
}

// CreateOrder creates a new order with stock reservation and payment link
func (uc *CheckoutUseCase) CreateOrder(ctx context.Context, order *domain.Order) error {
	// Validate order
	if err := order.Validate(); err != nil {
		return err
	}
	// Calculate total
	order.CalculateTotal()

	// Generate unique order ID
	order.OrderID = uuid.New().String()
	order.Status = domain.OrderStatusPending
	order.ShippingInfo.ShippingStatus = domain.ShippingPending

	//validacion de monto para precio de envio
	order.ShippingInfo.SelectShippingCost(order.TotalAmount)

	order.CreatedAt = time.Now()
	order.UpdatedAt = time.Now()

	// Step 1: Reserve stock for all items
	for _, item := range order.Items {
		err := uc.productClient.ReserveStock(item.ProductID, item.Color, item.Size, item.Quantity)
		if err != nil {
			// If reservation fails, release already reserved stock
			uc.releaseAllStock(order.Items[:len(order.Items)])
			return fmt.Errorf("failed to reserve stock for %s: %w", item.ProductName, err)
		}
		uc.logger.Info(fmt.Sprintf("Reserved stock for product %s", item.ProductID))
	}

	totalWeight := 0.0
	for _, item := range order.Items {
		totalWeight += item.Weight * float64(item.Quantity)
	}

	order.Weight = totalWeight

	// Step 2: Create order in database
	err := uc.orderRepo.Create(ctx, order)
	if err != nil {
		uc.releaseAllStock(order.Items)
		uc.logger.Error(fmt.Sprintf("Failed to create order: %v", err))
		return fmt.Errorf("failed to create order: %w", err)
	}

	// Step 3: Start 15-minute timeout timer
	uc.reservationWorker.StartTimer(order.OrderID, order.Items)

	// Step 4: Generate Mercado Pago preference
	items := make([]client.PreferenceItem, len(order.Items)+1)
	for i, item := range order.Items {
		items[i] = client.PreferenceItem{
			Title:       item.ProductName,
			Quantity:    item.Quantity,
			UnitPrice:   item.Price,
			Description: fmt.Sprintf("Color: %s, Size: %s", item.Color, item.Size),
		}
	}

	items[len(order.Items)] = client.PreferenceItem{
		Title:       "Envio",
		Quantity:    1,
		UnitPrice:   order.ShippingInfo.ShippingCost,
		Description: "Envio a domicilio",
	}

	paymentURL, err := uc.mercadoPagoClient.CreatePreference(order.OrderID, items, uc.webhookURL)
	if err != nil {
		uc.logger.Warn(fmt.Sprintf("Failed to create payment preference: %v", err))
		// Don't fail the order, just log the error
		paymentURL = "PAYMENT_URL_GENERATION_FAILED"
	}

	order.PaymentURL = paymentURL

	// Update order with payment URL
	err = uc.orderRepo.Update(ctx, order)
	if err != nil {
		uc.logger.Warn(fmt.Sprintf("Failed to update order with payment URL: %v", err))
	}

	uc.logger.Info(fmt.Sprintf("Order %s created successfully", order.OrderID))

	return nil
}

// releaseAllStock releases stock for all items
func (uc *CheckoutUseCase) releaseAllStock(items []domain.OrderItem) {
	for _, item := range items {
		_ = uc.productClient.ReleaseStock(item.ProductID, item.Color, item.Size, item.Quantity)
	}
}

// GetOrder retrieves an order by ID
func (uc *CheckoutUseCase) GetOrder(ctx context.Context, _id string) (*domain.Order, error) {
	return uc.orderRepo.FindByID(ctx, _id)
}

// GetUserOrders retrieves all orders for a user
func (uc *CheckoutUseCase) GetUserOrders(ctx context.Context, userID string) ([]domain.Order, error) {
	return uc.orderRepo.FindByUserID(ctx, userID)
}
