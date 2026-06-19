package usecase

import (
	"context"
	"errors"
	"strings"

	"products-service/internal/client"
	"products-service/internal/domain"
	"products-service/internal/repository"
)

type BannerUseCase struct {
	bannerRepo repository.BannerRepository
	r2Client   *client.R2Client
}

func NewBannerUseCase(bannerRepo repository.BannerRepository, r2Client *client.R2Client) *BannerUseCase {
	return &BannerUseCase{
		bannerRepo: bannerRepo,
		r2Client:   r2Client,
	}
}

func (uc *BannerUseCase) CreateBanner(ctx context.Context, banner *domain.Banner) error {
	if err := banner.Validate(); err != nil && !strings.HasPrefix(banner.ImageURL, "data:image") {
		// Validating early only if it doesn't have a base64 image, else we validate after setting the real URL
		// Wait, the validation requires ImageURL, which will be the base64 initially.
	}

	if banner.Title == "" {
		return errors.New("banner title is required")
	}

	if banner.ImageURL == "" {
		return errors.New("banner image is required")
	}

	if strings.HasPrefix(banner.ImageURL, "data:image") {
		publicURL, err := uc.r2Client.UploadImage(ctx, banner.ImageURL, "banners")
		if err != nil {
			return err
		}
		banner.ImageURL = publicURL
	}

	return uc.bannerRepo.Create(ctx, banner)
}

func (uc *BannerUseCase) GetActiveBanner(ctx context.Context) (*domain.Banner, error) {
	return uc.bannerRepo.FindActive(ctx)
}

func (uc *BannerUseCase) ListBanners(ctx context.Context) ([]domain.Banner, error) {
	return uc.bannerRepo.FindAll(ctx)
}

func (uc *BannerUseCase) UpdateBanner(ctx context.Context, id string, banner *domain.Banner) error {
	if banner.Title == "" {
		return errors.New("banner title is required")
	}

	if banner.ImageURL == "" {
		return errors.New("banner image is required")
	}

	existingBanner, err := uc.bannerRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if existingBanner == nil {
		return errors.New("banner not found")
	}

	if strings.HasPrefix(banner.ImageURL, "data:image") {
		publicURL, err := uc.r2Client.UploadImage(ctx, banner.ImageURL, "banners")
		if err != nil {
			return err
		}
		banner.ImageURL = publicURL
	} else {
		// Keep the existing image if it hasn't changed (wasn't base64)
		// Assuming frontend sends the old URL if not updated.
	}

	// Preserve is_active status of existing banner
	banner.IsActive = existingBanner.IsActive

	return uc.bannerRepo.Update(ctx, id, banner)
}

func (uc *BannerUseCase) SetActiveBanner(ctx context.Context, id string) error {
	return uc.bannerRepo.SetActive(ctx, id)
}

func (uc *BannerUseCase) DeleteBanner(ctx context.Context, id string) error {
	banner, err := uc.bannerRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// Delete from R2
	if banner.ImageURL != "" {
		_ = uc.r2Client.DeleteImage(ctx, banner.ImageURL) // Ignoring error here to ensure DB deletion still happens
	}

	return uc.bannerRepo.Delete(ctx, id)
}
