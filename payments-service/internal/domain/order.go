package domain

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// OrderStatus represents the status of an order
type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "Pending"
	OrderStatusPaid      OrderStatus = "Paid"
	OrderStatusShipped   OrderStatus = "Shipped"
	OrderStatusCancelled OrderStatus = "Cancelled"
)

// OrderItem represents a product in an order
type OrderItem struct {
	ProductID   string  `bson:"product_id" json:"product_id"`
	ProductName string  `bson:"product_name" json:"product_name"`
	ImageURL    string  `bson:"image_url" json:"image_url"`
	Color       string  `bson:"color" json:"color"`
	Size        string  `bson:"size" json:"size"`
	Quantity    int     `bson:"quantity" json:"quantity"`
	Price       float64 `bson:"price" json:"price"`
	Weight      float64 `bson:"weight" json:"weight"`
}

type Address struct {
	Street    string `bson:"street" json:"street"`
	Number    string `bson:"number" json:"number"`
	Floor     string `bson:"floor" json:"floor"`
	Apartment string `bson:"apartment" json:"apartment"`
	City      string `bson:"city" json:"city"`
	Province  string `bson:"province" json:"province"`
	Country   string `bson:"country" json:"country"`
	ZipCode   string `bson:"zip_code" json:"zip_code"`
}

// Order represents an order entity
type Order struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	OrderID             string             `bson:"order_id" json:"order_id"`
	UserID              string             `bson:"user_id" json:"user_id"`
	Items               []OrderItem        `bson:"items" json:"items"`
	Weight              float64            `bson:"package" json:"package"`
	TotalAmount         float64            `bson:"total_amount" json:"total_amount"`
	Status              OrderStatus        `bson:"status" json:"status"`
	ShippingInfo        Shipping           `bson:"shipping_info" json:"shipping_info"`
	PaymentURL          string             `bson:"payment_url,omitempty" json:"payment_url,omitempty"`
	ProcessedPaymentIDs []string           `bson:"processed_payment_ids,omitempty" json:"processed_payment_ids,omitempty"`
	CreatedAt           time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt           time.Time          `bson:"updated_at" json:"updated_at"`
}

// Validate validates order data
func (o *Order) Validate() error {
	if o.UserID == "" {
		return errors.New("user ID is required")
	}
	if len(o.Items) == 0 {
		return errors.New("at least one item is required")
	}
	return nil
}

// CalculateTotal calculates the total amount from items
func (o *Order) CalculateTotal() {
	total := 0.0
	for _, item := range o.Items {
		total += item.Price * float64(item.Quantity)
	}
	o.TotalAmount = total
}

type UserInfo struct {
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	DNI       string  `json:"dni"`
	Email     string  `json:"email"`
	Phone     string  `json:"phone"`
	Address   Address `json:"address"`
}
