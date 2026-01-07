package domain

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CartItem represents a product in the shopping cart
type CartItem struct {
	ProductID   string  `bson:"product_id" json:"product_id"`
	ProductName string  `bson:"product_name" json:"product_name"`
	Color       string  `bson:"color" json:"color"`
	Size        string  `bson:"size" json:"size"`
	Quantity    int     `bson:"quantity" json:"quantity"`
	Price       float64 `bson:"price" json:"price"`
	Image       string  `bson:"image" json:"image"`
}

// Cart represents a shopping cart for a user
type Cart struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    string             `bson:"user_id" json:"user_id"`
	Items     []CartItem         `bson:"items" json:"items"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// Validate validates cart data
func (c *Cart) Validate() error {
	if c.UserID == "" {
		return errors.New("user id is required")
	}
	return nil
}

// ValidateItem validates a cart item
func (item *CartItem) Validate() error {
	if item.ProductID == "" {
		return errors.New("product id is required")
	}
	if item.Quantity <= 0 {
		return errors.New("quantity must be greater than 0")
	}
	if item.Price < 0 {
		return errors.New("price cannot be negative")
	}
	if item.Color == "" {
		return errors.New("color is required")
	}
	if item.Size == "" {
		return errors.New("size is required")
	}
	return nil
}

// GetTotal calculates the total price of the cart
func (c *Cart) GetTotal() float64 {
	total := 0.0
	for _, item := range c.Items {
		total += item.Price * float64(item.Quantity)
	}
	return total
}

// GetItemCount returns total number of items in the cart
func (c *Cart) GetItemCount() int {
	count := 0
	for _, item := range c.Items {
		count += item.Quantity
	}
	return count
}

// FindItem finds an item in the cart by product ID, color, and size
func (c *Cart) FindItem(productID, color, size string) *CartItem {
	for i := range c.Items {
		if c.Items[i].ProductID == productID &&
			c.Items[i].Color == color &&
			c.Items[i].Size == size {
			return &c.Items[i]
		}
	}
	return nil
}

// AddItem adds an item to the cart or updates quantity if it already exists
func (c *Cart) AddItem(item CartItem) error {
	if err := item.Validate(); err != nil {
		return err
	}

	// Check if item already exists
	existingItem := c.FindItem(item.ProductID, item.Color, item.Size)
	if existingItem != nil {
		// Update quantity
		existingItem.Quantity += item.Quantity
		// Update price to latest
		existingItem.Price = item.Price
		existingItem.ProductName = item.ProductName
		existingItem.Image = item.Image
	} else {
		// Add new item
		c.Items = append(c.Items, item)
	}

	c.UpdatedAt = time.Now()
	return nil
}

// UpdateItem updates an existing item in the cart
func (c *Cart) UpdateItem(productID, color, size string, quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be greater than 0")
	}

	item := c.FindItem(productID, color, size)
	if item == nil {
		return errors.New("item not found in cart")
	}

	item.Quantity = quantity
	c.UpdatedAt = time.Now()
	return nil
}

// RemoveItem removes an item from the cart
func (c *Cart) RemoveItem(productID, color, size string) error {
	for i, item := range c.Items {
		if item.ProductID == productID &&
			item.Color == color &&
			item.Size == size {
			// Remove item by slicing
			c.Items = append(c.Items[:i], c.Items[i+1:]...)
			c.UpdatedAt = time.Now()
			return nil
		}
	}
	return errors.New("item not found in cart")
}

// Clear removes all items from the cart
func (c *Cart) Clear() {
	c.Items = []CartItem{}
	c.UpdatedAt = time.Now()
}

// IsEmpty checks if the cart is empty
func (c *Cart) IsEmpty() bool {
	return len(c.Items) == 0
}
