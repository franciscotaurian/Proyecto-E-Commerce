package usecase

import (
	"context"
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
