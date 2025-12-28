package usecase

import (
	"context"
	"errors"

	"users-service/internal/domain"
	"users-service/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
)

// AuthUseCase handles authentication business logic
type AuthUseCase struct {
	userRepo  repository.UserRepository
	jwtSecret string
}

// NewAuthUseCase creates a new authentication use case
func NewAuthUseCase(userRepo repository.UserRepository, jwtSecret string) *AuthUseCase {
	return &AuthUseCase{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
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

	// Create user
	err = uc.userRepo.Create(ctx, user)
	if err != nil {
		return nil, err
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
func (uc *AuthUseCase) UpdateProfile(ctx context.Context, user *domain.User) error {
	return uc.userRepo.Update(ctx, user)
}
