package usecase

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"payments-service/internal/client"
	"payments-service/internal/domain"
	"payments-service/internal/messaging"
	"payments-service/internal/repository"
	"proyecto-ecommerce/shared/logger"
	"strings"
	"time"
)

type ManagerUseCase struct {
	orderRepo            repository.OrderRepository
	userClient           *client.UserClient
	logger               *logger.InternalLogger
	notificationProducer *messaging.NotificationProducer
}

func NewManagerUseCase(orderRepo repository.OrderRepository, userClient *client.UserClient, notificationProducer *messaging.NotificationProducer, logger *logger.InternalLogger) *ManagerUseCase {
	return &ManagerUseCase{
		orderRepo:            orderRepo,
		userClient:           userClient,
		notificationProducer: notificationProducer,
		logger:               logger,
	}
}

func (uc *ManagerUseCase) FindAllPaid(ctx context.Context, from, to *time.Time) ([]domain.ReponseOrder, error) {
	return uc.orderRepo.FindAllPaid(ctx, from, to)
}

func (uc *ManagerUseCase) FindByShippingStatus(ctx context.Context, shippingStatus string) ([]domain.Order, error) {
	return uc.orderRepo.FindByShippingStatus(ctx, shippingStatus)
}

func (uc *ManagerUseCase) FindByID(ctx context.Context, orderID string) (*domain.Order, error) {
	// First try to find by business order_id (UUID)
	order, err := uc.orderRepo.FindByOrderID(ctx, orderID)
	if err == nil && order != nil {
		return order, nil
	}
	// Fallback to internal MongoDB ID
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

	go uc.EmailShippingNotification(ctx, shippedTrackID, order)

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

	if order.ShippingInfo.ShippingStatus == domain.ShippingDelivered {
		go uc.EmailDeliveredNotification(ctx, order)
	}

	return uc.orderRepo.Update(ctx, order)
}

func (uc *ManagerUseCase) EmailShippingNotification(ctx context.Context, trackID string, order *domain.Order) error {

	userInfo, err := uc.userClient.GetUserInfo(order.UserID)
	if err != nil {
		return err
	}

	products := []messaging.ProductItem{}
	for _, item := range order.Items {
		products = append(products, messaging.ProductItem{
			Name:     item.ProductName,
			Quantity: item.Quantity,
		})
	}

	templateData := messaging.SendEvent{
		CustomerName:  userInfo.FirstName + " " + userInfo.LastName,
		CustomerEmail: userInfo.Email,
		OrderID:       order.OrderID,
		Products:      products,
		TrackID:       trackID,
		ShippingInfo: messaging.ShippingInfo{
			Address:    order.ShippingInfo.ShippingAddress.Street,
			Number:     order.ShippingInfo.ShippingAddress.Number,
			Floor:      order.ShippingInfo.ShippingAddress.Floor,
			Apartment:  order.ShippingInfo.ShippingAddress.Apartment,
			City:       order.ShippingInfo.ShippingAddress.City,
			Province:   order.ShippingInfo.ShippingAddress.Province,
			PostalCode: order.ShippingInfo.ShippingAddress.ZipCode,
			Country:    order.ShippingInfo.ShippingAddress.Country,
		},
	}

	// Send email notification via RabbitMQ
	notification := messaging.EmailNotificationSend{
		To:           userInfo.Email,
		Subject:      "Hemos enviado tu pedido - " + order.OrderID,
		Body:         fmt.Sprintf("Tu pedido %s ha sido enviado exitosamente. Num de seguimiento: %s", order.OrderID, order.ShippingInfo.ShippedTrackID),
		TemplateName: "shipping_confirmation_email.html",
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

func (uc *ManagerUseCase) EmailDeliveredNotification(ctx context.Context, order *domain.Order) error {

	userInfo, err := uc.userClient.GetUserInfo(order.UserID)
	if err != nil {
		return err
	}

	var productNames []string
	products := []messaging.ProductItem{}
	for _, item := range order.Items {
		productNames = append(productNames, item.ProductName)
		products = append(products, messaging.ProductItem{
			Name:     item.ProductName,
			Quantity: item.Quantity,
		})
	}

	joinedProducts := strings.Join(productNames, ", ")

	// Generate WhatsApp URL
	phone := os.Getenv("ADMIN_PHONE_NUMBER")
	whatsappMessage := fmt.Sprintf("Hola, tengo una consulta sobre mi pedido %s", order.OrderID)
	whatsappURL := fmt.Sprintf("https://wa.me/%s?text=%s", phone, url.QueryEscape(whatsappMessage))

	templateData := messaging.DeliveredEvent{
		CustomerName:  userInfo.FirstName + " " + userInfo.LastName,
		CustomerEmail: userInfo.Email,
		OrderID:       order.OrderID,
		Products:      products,
		WhatsAppURL:   whatsappURL,
	}

	// Send email notification via RabbitMQ
	notification := messaging.EmailNotificationDelivered{
		To:           userInfo.Email,
		Subject:      "¡Tu pedido ha sido entregado! - " + order.OrderID,
		Body:         fmt.Sprintf("Felicidades %s, tu pedido %s ha sido entregado. Esperamos que disfrutes de tus nuevos productos: %s", templateData.CustomerName, order.OrderID, joinedProducts),
		TemplateName: "delivery_confirmation_email.html",
		TemplateData: templateData,
	}

	if err := uc.notificationProducer.PublishEmailNotification(notification); err != nil {
		uc.logger.Error(fmt.Sprintf("Failed to publish delivery notification for order %s: %v", order.OrderID, err))
	} else {
		uc.logger.Info(fmt.Sprintf("Delivery notification published for order %s", order.OrderID))
	}

	return nil
}
