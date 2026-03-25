package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"payments-service/internal/domain"
)

// AndreaniClient handles Andreani API communication
type AndreaniClient struct {
	token   string
	baseURL string
	client  *http.Client
}

// NewAndreaniClient creates a new Andreani client
func NewAndreaniClient(token string) *AndreaniClient {
	return &AndreaniClient{
		token:   token,
		baseURL: "https://apisqa.andreani.com/",
		client:  &http.Client{},
	}
}

func (c *AndreaniClient) GetQuotation(req domain.QuotationRequest) (*domain.QuotationResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("GET", c.baseURL+"/v1/tarifas", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-authorization-token", c.token)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to get quotation: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("envio pack error: %s", string(bodyBytes))
	}

	var quotationResp domain.QuotationResponse
	if err := json.NewDecoder(resp.Body).Decode(&quotationResp); err != nil {
		return nil, err
	}

	return &quotationResp, nil
}

// CreateShipment creates a new shipment

func (c *AndreaniClient) CreateOrder(req domain.OrderRequest) (*domain.OrderResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("error serializando request: %w", err)
	}

	endpoint := fmt.Sprintf("%s/v2/ordenes-de-envio", c.baseURL)
	httpReq, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	// Andreani V2 utiliza x-authorization-token según la documentación
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-authorization-token", c.token)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("error en la petición a Andreani: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("error de la API (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var orderResp domain.OrderResponse
	if err := json.NewDecoder(resp.Body).Decode(&orderResp); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta: %w", err)
	}

	return &orderResp, nil
}
