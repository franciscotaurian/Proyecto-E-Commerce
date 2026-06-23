package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"

	"users-service/internal/domain"
	"users-service/internal/repository"

	amqp "github.com/rabbitmq/amqp091-go"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
)

// AuthUseCase handles authentication business logic
type AuthUseCase struct {
	userRepo        repository.UserRepository
	jwtSecret       string
	rabbitmqChannel *amqp.Channel
}

// NewAuthUseCase creates a new authentication use case
func NewAuthUseCase(userRepo repository.UserRepository, jwtSecret string, rabbitmqChannel *amqp.Channel) *AuthUseCase {
	return &AuthUseCase{
		userRepo:        userRepo,
		jwtSecret:       jwtSecret,
		rabbitmqChannel: rabbitmqChannel,
	}
}

// Register creates a new user account
func (uc *AuthUseCase) Register(ctx context.Context, user *domain.User) (*domain.User, error) {
	// Validate user data
	if err := user.Validate(); err != nil {
		return nil, err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user.Password = string(hashedPassword)

	// Generate verification token
	token, err := GenerateVerificationToken()
	if err != nil {
		return nil, err
	}
	user.VerificationToken = token
	user.IsVerified = false // Explicitly set to false for new users

	// Create user
	err = uc.userRepo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	// Send verification email via RabbitMQ
	if uc.rabbitmqChannel != nil {
		go uc.sendVerificationEmail(user)
		// Publish user.created event for cart initialization
		go uc.publishUserCreatedEvent(user)
	}

	return user, nil
}

// Login authenticates a user and returns user data
func (uc *AuthUseCase) Login(ctx context.Context, email, password string) (*domain.User, error) {
	// Find user by email
	user, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if err == repository.ErrUserNotFound {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// Compare passwords
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}

// GetProfile retrieves user profile by ID
func (uc *AuthUseCase) GetProfile(ctx context.Context, userID string) (*domain.User, error) {
	return uc.userRepo.FindByID(ctx, userID)
}

func (uc *AuthUseCase) GetUserInformation(ctx context.Context, userID string) (*domain.UserInformation, error) {

	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &domain.UserInformation{
		FirstName: user.FirstName,
		LastName:  user.LastName,
		DNI:       user.DNI,
		Email:     user.Email,
		Phone:     user.Phone,
	}, nil
}

// UpdateProfile updates user profile information
func (uc *AuthUseCase) UpdateProfile(ctx context.Context, userID string, req *domain.UpdateUserRequest) (*domain.UserResponse, error) {

	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, repository.ErrUserNotFound
	}

	updatedUser := &domain.UpdateUserInformation{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		DNI:       req.DNI,
		Phone:     req.Phone,
		Address: domain.Address{
			Street:    req.Street,
			Number:    req.Number,
			Floor:     req.Floor,
			Apartment: req.Apartment,
			City:      req.City,
			Province:  req.Province,
			Country:   req.Country,
			ZipCode:   req.ZipCode,
		},
	}

	if err := updatedUser.Validate(); err != nil {
		return nil, err
	}

	// Check if DNI already exists (only if changing DNI)
	if updatedUser.DNI != user.DNI {
		existing, err := uc.userRepo.FindByDNI(ctx, updatedUser.DNI)
		if err != nil && err != repository.ErrUserNotFound {
			return nil, err
		}
		if existing != nil && existing.ID.Hex() != userID {
			return nil, repository.ErrDuplicateDNI
		}
	}

	user, err = uc.userRepo.Update(ctx, userID, updatedUser)
	if err != nil {
		return nil, err
	}

	response := user.ToResponse()
	return &response, nil

}

func (uc *AuthUseCase) IsVerifiedUser(ctx context.Context, userID string) (bool, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return false, repository.ErrUserNotFound
	}
	return user.IsVerified, nil
}

// ResendVerificationEmail resends the verification email to a user that is not yet verified
func (uc *AuthUseCase) ResendVerificationEmail(ctx context.Context, email string) error {
	user, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return repository.ErrUserNotFound
	}

	if user.IsVerified {
		return errors.New("email already verified")
	}

	// Regenerate token if the current one is empty
	if user.VerificationToken == "" {
		token, err := GenerateVerificationToken()
		if err != nil {
			return fmt.Errorf("failed to generate verification token: %w", err)
		}
		user.VerificationToken = token

		err = uc.userRepo.UpdateVerificationToken(ctx, user.ID.Hex(), token)
		if err != nil {
			return fmt.Errorf("failed to update verification token: %w", err)
		}
	}

	if uc.rabbitmqChannel != nil {
		go uc.sendVerificationEmail(user)
	}

	return nil
}

// sendVerificationEmail sends a verification email via RabbitMQ
func (uc *AuthUseCase) sendVerificationEmail(user *domain.User) {
	// Get base URL from environment or use default
	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	// Build verification link
	verificationLink := fmt.Sprintf("%s/api/v1/auth/verify/%s", baseURL, user.VerificationToken)

	// Build email notification
	emailNotification := map[string]interface{}{
		"to":            user.Email,
		"subject":       "Verifica tu email - E-Commerce Platform",
		"template_name": "verification_email.html",
		"template_data": map[string]interface{}{
			"user_name":         user.FirstName,
			"verification_link": verificationLink,
		},
	}

	// Marshal to JSON
	body, err := json.Marshal(emailNotification)
	if err != nil {
		log.Printf("Failed to marshal verification email: %v", err)
		return
	}

	// Publish to RabbitMQ
	err = uc.rabbitmqChannel.Publish(
		"notifications_exchange", // exchange
		"notification.email",     // routing key
		false,                    // mandatory
		false,                    // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)

	if err != nil {
		log.Printf("Failed to publish verification email: %v", err)
	} else {
		log.Printf("Verification email sent to %s", user.Email)
	}
}

// publishUserCreatedEvent publishes a user.created event to RabbitMQ
func (uc *AuthUseCase) publishUserCreatedEvent(user *domain.User) {
	// Declare exchange for user events
	err := uc.rabbitmqChannel.ExchangeDeclare(
		"user_events_exchange", // name
		"topic",                // type
		true,                   // durable
		false,                  // auto-deleted
		false,                  // internal
		false,                  // no-wait
		nil,                    // arguments
	)
	if err != nil {
		log.Printf("Failed to declare user events exchange: %v", err)
		return
	}

	// Build user created event
	event := map[string]interface{}{
		"user_id":    user.ID.Hex(),
		"email":      user.Email,
		"created_at": user.CreatedAt,
	}

	// Marshal to JSON
	body, err := json.Marshal(event)
	if err != nil {
		log.Printf("Failed to marshal user.created event: %v", err)
		return
	}

	// Publish to RabbitMQ
	err = uc.rabbitmqChannel.Publish(
		"user_events_exchange", // exchange
		"user.created",         // routing key
		false,                  // mandatory
		false,                  // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)

	if err != nil {
		log.Printf("Failed to publish user.created event: %v", err)
	} else {
		log.Printf("user.created event published for user: %s", user.ID.Hex())
	}
}

func (uc *AuthUseCase) SendResetPasswordEmail(ctx context.Context, email string) error {
	// Get base URL from environment or use default

	user, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return err
	}

	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	secret := os.Getenv("JWT_SECRET")

	// Generate reset password token
	token, err := GeneratePasswordToken(user.ID.Hex(), secret)
	if err != nil {
		return err
	}

	err = uc.userRepo.UpdateResetPasswordToken(ctx, user.ID.Hex(), token)
	if err != nil {
		return err
	}

	// Build reset password link
	resetPasswordLink := fmt.Sprintf("%s/api/v1/auth/reset-password/%s", baseURL, token)

	// Build email notification
	emailNotification := map[string]interface{}{
		"to":            user.Email,
		"subject":       "Restablece tu contraseña - E-Commerce Platform",
		"template_name": "reset_password_email.html",
		"template_data": map[string]interface{}{
			"user_name":           user.FirstName,
			"reset_password_link": resetPasswordLink,
		},
	}

	// Marshal to JSON
	body, err := json.Marshal(emailNotification)
	if err != nil {
		log.Printf("Failed to marshal reset password email: %v", err)
		return err
	}

	// Publish to RabbitMQ
	err = uc.rabbitmqChannel.Publish(
		"notifications_exchange", // exchange
		"notification.email",     // routing key
		false,                    // mandatory
		false,                    // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)

	if err != nil {
		log.Printf("Failed to publish reset password email: %v", err)
	} else {
		log.Printf("Reset password email sent to %s", user.Email)
	}

	return nil
}

func (uc *AuthUseCase) ResetPassword(ctx context.Context, token string, password string) error {
	// Get base URL from environment or use default

	user, err := uc.userRepo.FindByResetPasswordToken(ctx, token)
	if err != nil {
		return err
	}

	err = VerifyPasswordToken(token, os.Getenv("JWT_SECRET"))
	if err != nil {
		return err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update user
	err = uc.userRepo.UpdatePassword(ctx, user.ID.Hex(), string(hashedPassword))
	if err != nil {
		return err
	}

	return nil
}
