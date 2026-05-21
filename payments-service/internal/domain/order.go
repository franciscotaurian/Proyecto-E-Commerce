package domain

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// OrderStatus represents the status of an order
type OrderStatus string

const (
	StatusPending   OrderStatus = "Pending"
	StatusPaid      OrderStatus = "Paid"
	StatusShipped   OrderStatus = "Shipped"
	StatusCancelled OrderStatus = "Cancelled"
)

const (
	ShippingStatusPending   string = "Pending"
	ShippingStatusShipped   string = "Shipped"
	ShippingStatusDelivered string = "Delivered"
	ShippingStatusCancelled string = "Cancelled"
)

const (
	ShippingMethodSend     string = "Send"
	ShippingMethodWhatsapp string = "Whatsapp"
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
	ShippingMethod      string             `bson:"shipping_method" json:"shipping_method"`
	ShippingStatus      string             `bson:"shipping_status" json:"shipping_status"`
	ShippingAddress     Address            `bson:"shipping_address" json:"shipping_address"`
	ShippedTrackID      string             `bson:"shipped_track_id,omitempty" json:"shipped_track_id,omitempty"`
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
	if o.ShippingMethod == "" {
		return errors.New("Shipping method required")
	}
	if o.ShippingAddress.Street == "" {
		return errors.New("shipping address is required")
	}
	if o.ShippingAddress.Number == "" {
		return errors.New("shipping address number is required")
	}
	if o.ShippingAddress.Floor == "" {
		return errors.New("shipping address floor is required")
	}
	if o.ShippingAddress.Apartment == "" {
		return errors.New("shipping address apartment is required")
	}
	if o.ShippingAddress.City == "" {
		return errors.New("shipping address city is required")
	}
	if o.ShippingAddress.Province == "" {
		return errors.New("shipping address province is required")
	}
	if o.ShippingAddress.Country == "" {
		return errors.New("shipping address country is required")
	}
	if o.ShippingAddress.ZipCode == "" {
		return errors.New("shipping address zip code is required")
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
