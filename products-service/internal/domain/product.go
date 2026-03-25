package domain

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	// CriticalStockLevel is the threshold for critical stock alerts
	CriticalStockLevel = 5
)

// StockVariant represents a product variant with color and size
type StockVariant struct {
	Color    string `bson:"color" json:"color"`
	Size     string `bson:"size" json:"size"`
	Quantity int    `bson:"quantity" json:"quantity"`
	Reserved int    `bson:"reserved" json:"reserved"`
}

// Available returns the available stock (Quantity - Reserved)
func (sv *StockVariant) Available() int {
	available := sv.Quantity - sv.Reserved
	if available < 0 {
		return 0
	}
	return available
}

// IsCritical checks if stock is at critical level
func (sv *StockVariant) IsCritical() bool {
	return sv.Available() <= CriticalStockLevel
}

// Product represents a product entity
type Product struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Category    string             `bson:"category" json:"category"`
	Price       float64            `bson:"price" json:"price"`
	Images      []string           `bson:"images" json:"images"`
	Variants    []StockVariant     `bson:"variants" json:"variants"`
	Weight      float64            `bson:"weight" json:"weight"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type Category struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name      string             `bson:"name" json:"name"`
	Image     string             `bson:"image" json:"image"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// Validate validates product data
func (p *Product) Validate() error {
	if p.Name == "" {
		return errors.New("product name is required")
	}
	if p.Category == "" {
		return errors.New("category is required")
	}
	if p.Price <= 0 {
		return errors.New("price must be greater than 0")
	}
	if len(p.Variants) == 0 {
		return errors.New("at least one variant is required")
	}
	return nil
}

// FindVariant finds a variant by color and size
func (p *Product) FindVariant(color, size string) *StockVariant {
	for i := range p.Variants {
		if p.Variants[i].Color == color && p.Variants[i].Size == size {
			return &p.Variants[i]
		}
	}
	return nil
}

// GetTotalStock returns total available stock across all variants
func (p *Product) GetTotalStock() int {
	total := 0
	for _, variant := range p.Variants {
		total += variant.Available()
	}
	return total
}

// HasCriticalStock checks if any variant has critical stock
func (p *Product) HasCriticalStock() bool {
	for _, variant := range p.Variants {
		if variant.IsCritical() {
			return true
		}
	}
	return false
}
