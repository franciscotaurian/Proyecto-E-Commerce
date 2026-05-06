package usecase

import (
	"context"
	"errors"
	"products-service/internal/domain"
	"products-service/internal/repository"
)

type CategoryUseCase struct {
	categoryRepo repository.CategoryRepository
	productsRepo repository.ProductRepository
}

func NewCategoryUseCase(categoryRepo repository.CategoryRepository, productsRepo repository.ProductRepository) *CategoryUseCase {
	return &CategoryUseCase{
		categoryRepo: categoryRepo,
		productsRepo: productsRepo,
	}
}

func (uc *CategoryUseCase) CreateCategory(ctx context.Context, category *domain.Category) error {

	if category.Name == "" {
		return errors.New("category name is required")
	}

	if category.Image == "" {
		return errors.New("category image is required")
	}

	return uc.categoryRepo.CreateCategory(ctx, category)
}

func (uc *CategoryUseCase) ListCategories(ctx context.Context) ([]domain.Category, error) {
	return uc.categoryRepo.FindAllCategories(ctx)
}

func (uc *CategoryUseCase) FindCategoryByName(ctx context.Context, name string) (*domain.Category, error) {
	return uc.categoryRepo.FindCategoryByName(ctx, name)
}

func (uc *CategoryUseCase) UpdateCategory(ctx context.Context, id string, category *domain.Category) error {

	if category.Name == "" {
		return errors.New("category name is required")
	}

	if category.Image == "" {
		return errors.New("category image is required")
	}

	return uc.categoryRepo.UpdateCategory(ctx, id, category)
}

func (uc *CategoryUseCase) DeleteCategory(ctx context.Context, id string) error {
	if id == "" {
		return errors.New("category id is required")
	}
	
	products, err := uc.productsRepo.FindByCategoryId(ctx, id)
	if err != nil {
		return err
	}
	if len(products) > 0 {
		return errors.New("category has products")
	}

	return uc.categoryRepo.DeleteCategory(ctx, id)
}
