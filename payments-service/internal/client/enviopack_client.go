package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// EnvioPackClient handles Envio Pack API communication
type EnvioPackClient struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// NewEnvioPackClient creates a new Envio Pack client
func NewEnvioPackClient(apiKey string) *EnvioPackClient {
	return &EnvioPackClient{
		apiKey:  apiKey,
		baseURL: "https://api.enviopack.com",
		client:  &http.Client{},
	}
}

// ShipmentAddress represents a shipping address
type ShipmentAddress struct {
	Street  string `json:"street"`
	Number  string `json:"number"`
	City    string `json:"city"`
	State   string `json:"state"`
	ZipCode string `json:"zip_code"`
	Country string `json:"country"`
}

// ShipmentRequest represents a shipment creation request
type ShipmentRequest struct {
	OrderID       string          `json:"order_id"`
	Destination   ShipmentAddress `json:"destination"`
	Weight        float64         `json:"weight"`
	DeclaredValue float64         `json:"declared_value"`
}

// ShipmentResponse represents the response from Envio Pack
type ShipmentResponse struct {
	ID         string `json:"id"`
	TrackingID string `json:"tracking_id"`
	LabelURL   string `json:"label_url"`
}

// CreateShipment creates a new shipment
func (c *EnvioPackClient) CreateShipment(req ShipmentRequest) (*ShipmentResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", c.baseURL+"/shipments", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create shipment: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("envio pack error: %s", string(bodyBytes))
	}

	var shipmentResp ShipmentResponse
	if err := json.NewDecoder(resp.Body).Decode(&shipmentResp); err != nil {
		return nil, err
	}

	return &shipmentResp, nil
}
