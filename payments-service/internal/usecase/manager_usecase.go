package usecase

import (
	"context"
	"errors"
	"proyecto-ecommerce/shared/logger"
	"time"

	"payments-service/internal/domain"
	"payments-service/internal/repository"
)

type ManagerUseCase struct {
	orderRepo repository.OrderRepository
	logger    *logger.InternalLogger
}

func NewManagerUseCase(orderRepo repository.OrderRepository, logger *logger.InternalLogger) *ManagerUseCase {
	return &ManagerUseCase{
		orderRepo: orderRepo,
		logger:    logger,
	}
}

func (uc *ManagerUseCase) FindAllPaid(ctx context.Context, from, to *time.Time) ([]domain.Order, error) {
	return uc.orderRepo.FindAllPaid(ctx, from, to)
}

func (uc *ManagerUseCase) FindByShippingStatus(ctx context.Context, shippingStatus string) ([]domain.Order, error) {
	return uc.orderRepo.FindByShippingStatus(ctx, shippingStatus)
}

func (uc *ManagerUseCase) FindByID(ctx context.Context, orderID string) (*domain.Order, error) {
	return uc.orderRepo.FindByID(ctx, orderID)
}

func (uc *ManagerUseCase) UpdateStatus(ctx context.Context, orderID string, status domain.OrderStatus) error {

	order, err := uc.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}

	order.Status = status
	order.UpdatedAt = time.Now()

	return uc.orderRepo.Update(ctx, order)
}

func (uc *ManagerUseCase) UpdateShippingStatusWithTrackID(ctx context.Context, orderID string, shippedTrackID string) error {

	if shippedTrackID == "" {
		return errors.New("shipped track ID is required")
	}

	order, err := uc.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}

	order.ShippingInfo.ShippingStatus = domain.ShippingShipped
	order.ShippingInfo.ShippedTrackID = shippedTrackID
	order.UpdatedAt = time.Now()

	return uc.orderRepo.Update(ctx, order)
}

func (uc *ManagerUseCase) UpdateShippingStatus(ctx context.Context, orderID string, shippingStatus string) error {

	if shippingStatus == "" {
		return errors.New("shipping status is required")
	}

	// Validate that the status is a known value
	validStatuses := map[string]bool{
		string(domain.ShippingPending):   true,
		string(domain.ShippingShipped):   true,
		string(domain.ShippingDelivered): true,
		string(domain.ShippingCancelled): true,
	}
	if !validStatuses[shippingStatus] {
		return errors.New("invalid shipping status: " + shippingStatus)
	}

	order, err := uc.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}

	// Prevent setting the same status
	if string(order.ShippingInfo.ShippingStatus) == shippingStatus {
		return errors.New("shipping status is already " + shippingStatus)
	}

	order.ShippingInfo.ShippingStatus = domain.ShippingStatus(shippingStatus)
	order.UpdatedAt = time.Now()

	return uc.orderRepo.Update(ctx, order)
}
