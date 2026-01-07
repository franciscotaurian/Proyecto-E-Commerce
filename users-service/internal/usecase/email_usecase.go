package usecase

import (
	"context"
	"errors"

	"users-service/internal/repository"
)

var (
	ErrInvalidToken = errors.New("invalid or expired verification token")
)

// EmailUseCase handles email verification business logic
type EmailUseCase struct {
	userRepo repository.UserRepository
}

// NewEmailUseCase creates a new email verification use case
func NewEmailUseCase(userRepo repository.UserRepository) *EmailUseCase {
	return &EmailUseCase{
		userRepo: userRepo,
	}
}

// VerifyEmail validates the token and marks the user as verified
func (uc *EmailUseCase) VerifyEmail(ctx context.Context, token string) error {
	// Find user by verification token
	user, err := uc.userRepo.FindByVerificationToken(ctx, token)
	if err != nil {
		return ErrInvalidToken
	}

	// Check if already verified
	if user.IsVerified {
		return nil // Already verified, no error
	}

	// Update verification status and clear token
	err = uc.userRepo.UpdateVerificationStatus(ctx, user.ID.Hex(), true)
	if err != nil {
		return err
	}

	return nil
}
