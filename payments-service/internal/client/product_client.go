package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// ProductServiceClient handles communication with Product Service
type ProductServiceClient struct {
	baseURL string
	client  *http.Client
}

// NewProductServiceClient creates a new product service client
func NewProductServiceClient(baseURL string) *ProductServiceClient {
	return &ProductServiceClient{
		baseURL: baseURL,
		client:  &http.Client{},
	}
}

// ReserveStockRequest represents stock reservation request
type ReserveStockRequest struct {
	ProductID string `json:"product_id"`
	Color     string `json:"color"`
	Size      string `json:"size"`
	Quantity  int    `json:"quantity"`
}

// ReserveStock reserves stock in the product service
func (c *ProductServiceClient) ReserveStock(productID, color, size string, quantity int) error {
	req := ReserveStockRequest{
		ProductID: productID,
		Color:     color,
		Size:      size,
		Quantity:  quantity,
	}

	body, _ := json.Marshal(req)
	resp, err := c.client.Post(
		c.baseURL+"/internal/reserve",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return fmt.Errorf("failed to reserve stock: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to reserve stock: %s", string(bodyBytes))
	}

	return nil
}

// ReleaseStock releases reserved stock
func (c *ProductServiceClient) ReleaseStock(productID, color, size string, quantity int) error {
	req := ReserveStockRequest{
		ProductID: productID,
		Color:     color,
		Size:      size,
		Quantity:  quantity,
	}

	body, _ := json.Marshal(req)
	resp, err := c.client.Post(
		c.baseURL+"/internal/release",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return fmt.Errorf("failed to release stock: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to release stock: %s", string(bodyBytes))
	}

	return nil
}

// ConfirmPurchase confirms purchase and deducts stock
func (c *ProductServiceClient) ConfirmPurchase(productID, color, size string, quantity int) error {
	req := ReserveStockRequest{
		ProductID: productID,
		Color:     color,
		Size:      size,
		Quantity:  quantity,
	}

	body, _ := json.Marshal(req)
	resp, err := c.client.Post(
		c.baseURL+"/internal/confirm",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return fmt.Errorf("failed to confirm purchase: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to confirm purchase: %s", string(bodyBytes))
	}

	return nil
}

func (c *ProductServiceClient) ClearUserCart(userID string) error {
	req, err := http.NewRequest(http.MethodDelete, c.baseURL+"/internal/cart/clear/"+userID, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to clear user cart: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to clear user cart: %s", string(bodyBytes))
	}

	return nil
}
