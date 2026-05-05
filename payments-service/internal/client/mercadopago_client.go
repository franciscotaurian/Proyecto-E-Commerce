package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// MercadoPagoClient handles Mercado Pago API communication
type MercadoPagoClient struct {
	accessToken string
	baseURL     string
	client      *http.Client
	successURL  string
	failureURL  string
	pendingURL  string
}

// NewMercadoPagoClient creates a new Mercado Pago client
func NewMercadoPagoClient(accessToken, successURL, failureURL, pendingURL string) *MercadoPagoClient {
	return &MercadoPagoClient{
		accessToken: accessToken,
		baseURL:     "https://api.mercadopago.com/checkout/preferences",
		client:      &http.Client{},
		successURL:  successURL,
		failureURL:  failureURL,
		pendingURL:  pendingURL,
	}
}

// PreferenceItem represents an item in the preference
type PreferenceItem struct {
	Title       string  `json:"title"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Description string  `json:"description,omitempty"`
}

// PreferenceRequest represents a Mercado Pago preference creation request
type PreferenceRequest struct {
	Items             []PreferenceItem `json:"items"`
	ExternalReference string           `json:"external_reference"`
	BackURLs          BackURLs         `json:"back_urls,omitempty"`
	NotificationURL   string           `json:"notification_url,omitempty"`
	AutoReturn        string           `json:"auto_return,omitempty"`
}

// BackURLs represents callback URLs
type BackURLs struct {
	Success string `json:"success,omitempty"`
	Failure string `json:"failure,omitempty"`
	Pending string `json:"pending,omitempty"`
}

// PreferenceResponse represents the response from Mercado Pago
type PreferenceResponse struct {
	ID         string `json:"id"`
	InitPoint  string `json:"init_point"`
	SandboxURL string `json:"sandbox_init_point"`
}

// PaymentResponse represents a payment from MercadoPago API
type PaymentResponse struct {
	ID                int64   `json:"id"`
	Status            string  `json:"status"`
	StatusDetail      string  `json:"status_detail"`
	ExternalReference string  `json:"external_reference"`
	TransactionAmount float64 `json:"transaction_amount"`
	Description       string  `json:"description"`
	DateApproved      string  `json:"date_approved"`
	DateCreated       string  `json:"date_created"`
	DateLastUpdated   string  `json:"date_last_updated"`
	Payer             struct {
		Email          string `json:"email"`
		ID             string `json:"id"`
		Identification struct {
			Number string `json:"number"`
			Type   string `json:"type"`
		} `json:"identification"`
	} `json:"payer"`
	PaymentMethod struct {
		ID       string `json:"id"`
		Type     string `json:"type"`
		IssuerID string `json:"issuer_id"`
	} `json:"payment_method"`
	PaymentMethodID string `json:"payment_method_id"`
	PaymentTypeID   string `json:"payment_type_id"`
}

// CreatePreference creates a new payment preference
func (c *MercadoPagoClient) CreatePreference(orderID string, items []PreferenceItem, notificationURL string) (string, error) {
	req := PreferenceRequest{
		Items:             items,
		ExternalReference: orderID,
		NotificationURL:   notificationURL,
		AutoReturn:        "approved",
		BackURLs: BackURLs{
			Success: c.successURL,
			Failure: c.failureURL,
			Pending: c.pendingURL,
		},
	}

	body, err := json.Marshal(req)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequest("POST", c.baseURL, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.accessToken)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to create preference: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("mercado pago error: %s", string(bodyBytes))
	}

	var prefResp PreferenceResponse
	if err := json.NewDecoder(resp.Body).Decode(&prefResp); err != nil {
		return "", err
	}

	// Return sandbox URL if in test mode, otherwise return production URL
	if c.accessToken == "TEST-ACCESS-TOKEN" || prefResp.SandboxURL != "" {
		return prefResp.SandboxURL, nil
	}

	return prefResp.InitPoint, nil
}

// GetPayment retrieves payment information from MercadoPago
func (c *MercadoPagoClient) GetPayment(paymentID string) (*PaymentResponse, error) {
	url := fmt.Sprintf("https://api.mercadopago.com/v1/payments/%s", paymentID)

	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", "Bearer "+c.accessToken)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("mercado pago error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var payment PaymentResponse
	if err := json.Unmarshal(bodyBytes, &payment); err != nil {
		return nil, err
	}

	return &payment, nil
}
