package usecase

import (
	"context"
	"os"
	"payments-service/internal/client"
	"payments-service/internal/domain"
	"payments-service/internal/repository"
	"proyecto-ecommerce/shared/logger"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

type EnvioUseCase struct {
	andreaniClient *client.AndreaniClient
	contrato       string // Se necesita el contrato para las peticiones a Andreani
	orderRepo      repository.OrderRepository
	logger         *logger.InternalLogger
}

func NewEnvioUseCase(andreaniClient *client.AndreaniClient, contrato string, orderRepo repository.OrderRepository, logger *logger.InternalLogger) *EnvioUseCase {
	return &EnvioUseCase{
		andreaniClient: andreaniClient,
		contrato:       contrato,
		orderRepo:      orderRepo,
		logger:         logger,
	}
}

func (uc *EnvioUseCase) GetQuotation(ctx context.Context, quotation *domain.Quotation) (*domain.QuotationResponse, error) {
	// TODO: Ajustar el zip code de origen de la tienda si es dinámico o cargarlo desde variables de entorno

	zipCodeOrigen := getEnv("ANDREANI_ZIP_CODE", "5000")

	req := domain.QuotationRequest{
		ZipCodeOrigen:      zipCodeOrigen,
		ZipCodeDestination: quotation.ZipCodeDestination,
		ContractNumber:     uc.contrato,
		Weight:             quotation.Weight,
		Dimensions:         quotation.Dimensions,
		DeclaredValue:      quotation.DeclaredValue,
	}

	return uc.andreaniClient.GetQuotation(req)
}

// CreateOrder genera un envío en Andreani basado en la información de la orden guardada
func (uc *EnvioUseCase) CreateOrder(ctx context.Context, order *domain.Order, user domain.UserInfo) (*domain.OrderResponse, error) {
	// TODO: Estos datos del remitente u origen deberían venir preferentemente de configuración (BD/Env).
	origen := domain.Address{
		Street:   getEnv("ANDREANI_STREET", "Ambrosio Olmos"),
		Number:   getEnv("ANDREANI_NUMBER", "939"),
		City:     getEnv("ANDREANI_CITY", "Córdoba Capital"),
		Province: getEnv("ANDREANI_PROVINCE", "Córdoba"),
		ZipCode:  getEnv("ANDREANI_ZIP_CODE", "5000"),
	}

	remitente := domain.UserInfo{
		FirstName: getEnv("FIRST_NAME", "Mi"),
		LastName:  getEnv("LAST_NAME", "Tienda"),
		Email:     getEnv("EMAIL", "[EMAIL_ADDRESS]"),
		Phone:     getEnv("PHONE", "3510000000"),
	}

	totalWeight := order.Weight
	declaredValue := order.TotalAmount

	bultos := []domain.Bulto{
		{
			Kilos:          totalWeight,
			LargoCm:        30,
			AltoCm:         20,
			AnchoCm:        15,
			VolumenCm:      30 * 20 * 15,
			ValorDeclarado: declaredValue,
		},
	}

	req := domain.OrderRequest{
		Contrato: uc.contrato,
		Origen: struct {
			Postal domain.AddressShipment `json:"postal"`
		}{Postal: domain.AddressShipment(origen)},
		Destino: struct {
			Postal domain.AddressShipment `json:"postal"`
		}{Postal: domain.AddressShipment(order.ShippingAddress)},
		Remitente:    remitente,
		Destinatario: user,
		Bultos:       bultos,
	}

	return uc.andreaniClient.CreateOrder(req)
}
