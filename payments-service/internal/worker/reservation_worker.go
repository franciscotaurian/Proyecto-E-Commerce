package worker

import (
	"context"
	"fmt"
	"sync"
	"time"

	"payments-service/internal/client"
	"payments-service/internal/domain"
	"payments-service/internal/repository"
	"proyecto-ecommerce/shared/logger"
)

// ReservationWorker manages stock reservation timeouts
type ReservationWorker struct {
	orderRepo     repository.OrderRepository
	productClient *client.ProductServiceClient
	logger        *logger.InternalLogger
	timers        map[string]*time.Timer
	mu            sync.Mutex
}

// NewReservationWorker creates a new reservation worker
func NewReservationWorker(
	orderRepo repository.OrderRepository,
	productClient *client.ProductServiceClient,
	log *logger.InternalLogger,
) *ReservationWorker {
	return &ReservationWorker{
		orderRepo:     orderRepo,
		productClient: productClient,
		logger:        log,
		timers:        make(map[string]*time.Timer),
	}
}

// StartTimer starts a 15-minute timer for an order
func (w *ReservationWorker) StartTimer(orderID string, items []domain.OrderItem) {
	w.mu.Lock()
	defer w.mu.Unlock()

	// Create timer for 15 minutes
	timer := time.AfterFunc(15*time.Minute, func() {
		w.handleTimeout(orderID, items)
	})

	w.timers[orderID] = timer
	w.logger.Info(fmt.Sprintf("Started 15-minute timer for order %s", orderID))
}

// CancelTimer cancels the timer for an order (called on successful payment)
func (w *ReservationWorker) CancelTimer(orderID string) {
	w.mu.Lock()
	defer w.mu.Unlock()

	if timer, exists := w.timers[orderID]; exists {
		timer.Stop()
		delete(w.timers, orderID)
		w.logger.Info(fmt.Sprintf("Cancelled timer for order %s", orderID))
	}
}

// handleTimeout handles the timeout event
func (w *ReservationWorker) handleTimeout(orderID string, items []domain.OrderItem) {
	ctx := context.Background()

	w.logger.Warn(fmt.Sprintf("Order %s timed out - releasing stock", orderID))

	// Get order to check status
	order, err := w.orderRepo.FindByOrderID(ctx, orderID)
	if err != nil {
		w.logger.Error(fmt.Sprintf("Failed to find order %s: %v", orderID, err))
		return
	}

	// Only release stock if order is still pending
	if order.Status != domain.OrderStatusPending {
		w.logger.Info(fmt.Sprintf("Order %s is no longer pending, skipping release", orderID))
		return
	}

	// Release stock for each item
	for _, item := range items {
		err := w.productClient.ReleaseStock(item.ProductID, item.Color, item.Size, item.Quantity)
		if err != nil {
			w.logger.ErrorWithContext(
				fmt.Sprintf("Failed to release stock for product %s: %v", item.ProductID, err),
				"TIMEOUT_WORKER",
				"",
				"",
				"",
			)
		} else {
			w.logger.Info(fmt.Sprintf("Released stock for product %s", item.ProductID))
		}
	}

	// Update order status to cancelled
	err = w.orderRepo.UpdateStatus(ctx, orderID, domain.OrderStatusCancelled)
	if err != nil {
		w.logger.Error(fmt.Sprintf("Failed to cancel order %s: %v", orderID, err))
	} else {
		w.logger.Info(fmt.Sprintf("Order %s cancelled due to timeout", orderID))
	}

	// Clean up timer reference
	w.mu.Lock()
	delete(w.timers, orderID)
	w.mu.Unlock()
}

// CleanupExpiredOrders finds all Pending orders older than 15 minutes (from a previous
// service instance whose timers were lost on restart), releases their stock,
// and marks them as Cancelled. Should be called once on service startup.
func (w *ReservationWorker) CleanupExpiredOrders(ctx context.Context) {
	orders, err := w.orderRepo.FindExpiredPendingOrders(ctx, 15*time.Minute)
	if err != nil {
		w.logger.Error(fmt.Sprintf("Startup cleanup: failed to find expired pending orders: %v", err))
		return
	}

	if len(orders) == 0 {
		w.logger.Info("Startup cleanup: no expired pending orders found")
		return
	}

	w.logger.Warn(fmt.Sprintf("Startup cleanup: found %d expired pending order(s), processing...", len(orders)))

	for _, order := range orders {
		// Release stock for each item in the expired order
		for _, item := range order.Items {
			if err := w.productClient.ReleaseStock(item.ProductID, item.Color, item.Size, item.Quantity); err != nil {
				w.logger.Error(fmt.Sprintf(
					"Startup cleanup: failed to release stock for product %s in order %s: %v",
					item.ProductID, order.OrderID, err,
				))
			} else {
				w.logger.Info(fmt.Sprintf(
					"Startup cleanup: released stock for product %s in order %s",
					item.ProductID, order.OrderID,
				))
			}
		}

		// Mark order as cancelled
		if err := w.orderRepo.UpdateStatus(ctx, order.OrderID, domain.OrderStatusCancelled); err != nil {
			w.logger.Error(fmt.Sprintf("Startup cleanup: failed to cancel expired order %s: %v", order.OrderID, err))
		} else {
			w.logger.Info(fmt.Sprintf("Startup cleanup: order %s cancelled (expired on previous run)", order.OrderID))
		}
	}
}
