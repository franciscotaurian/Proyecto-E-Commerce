package domain

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Banner represents a homepage hero banner
type Banner struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	ImageURL    string             `bson:"image_url" json:"image_url"`
	Title       string             `bson:"title" json:"title"`
	Subtitle    string             `bson:"subtitle" json:"subtitle"`
	Description string             `bson:"description" json:"description"`
	ButtonText  string             `bson:"button_text" json:"button_text"`
	ButtonLink  string             `bson:"button_link" json:"button_link"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

// Validate validates banner data
func (b *Banner) Validate() error {
	if b.ImageURL == "" {
		return errors.New("banner image is required")
	}
	if b.Title == "" {
		return errors.New("banner title is required")
	}
	return nil
}
