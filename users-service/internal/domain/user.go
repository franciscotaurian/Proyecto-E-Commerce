package domain

import (
	"errors"
	"regexp"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

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

// User represents a user entity
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	FirstName string             `bson:"first_name" json:"first_name"`
	LastName  string             `bson:"last_name" json:"last_name"`
	DNI       string             `bson:"dni" json:"dni"`
	Email     string             `bson:"email" json:"email"`
	Phone     string             `bson:"phone" json:"phone"`
	Address   Address            `bson:"address" json:"address"`
	Password  string             `bson:"password" json:"-"` // Never expose password in JSON
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type UserInformation struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	DNI       string `json:"dni"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

// Validate validates user data
func (u *User) Validate() error {
	if u.FirstName == "" {
		return errors.New("first name is required")
	}
	if u.LastName == "" {
		return errors.New("last name is required")
	}
	if u.DNI == "" {
		return errors.New("DNI is required")
	}
	if u.Email == "" {
		return errors.New("email is required")
	}
	if !isValidEmail(u.Email) {
		return errors.New("invalid email format")
	}
	if u.Phone == "" {
		return errors.New("phone is required")
	}
	if u.Password == "" {
		return errors.New("password is required")
	}
	if len(u.Password) < 6 {
		return errors.New("password must be at least 6 characters")
	}
	return nil
}

// isValidEmail validates email format
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// UserResponse represents a safe user response (without password)
type UserResponse struct {
	ID        string    `json:"id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	DNI       string    `json:"dni"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Address   Address   `json:"address"`
	CreatedAt time.Time `json:"created_at"`
}

// ToResponse converts User to UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID.Hex(),
		FirstName: u.FirstName,
		LastName:  u.LastName,
		DNI:       u.DNI,
		Email:     u.Email,
		Phone:     u.Phone,
		Address:   u.Address,
		CreatedAt: u.CreatedAt,
	}
}
