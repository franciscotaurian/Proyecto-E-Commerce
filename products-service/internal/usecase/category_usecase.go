package usecase

import (
	"context"
	"errors"
	"strings"

	"products-service/internal/client"
	"products-service/internal/domain"
	"products-service/internal/repository"
)

type CategoryUseCase struct {
	categoryRepo repository.CategoryRepository
	productsRepo repository.ProductRepository
	r2Client     *client.R2Client
}

func NewCategoryUseCase(categoryRepo repository.CategoryRepository, productsRepo repository.ProductRepository, r2Client *client.R2Client) *CategoryUseCase {
	return &CategoryUseCase{
		categoryRepo: categoryRepo,
		productsRepo: productsRepo,
		r2Client:     r2Client,
	}
}

func (uc *CategoryUseCase) CreateCategory(ctx context.Context, category *domain.Category) error {

	if category.Name == "" {
		return errors.New("category name is required")
	}

	if category.Image == "" {
		return errors.New("category image is required")
	}

	if strings.HasPrefix(category.Image, "data:image") {
		publicURL, err := uc.r2Client.UploadImage(ctx, category.Image, "categories")
		if err != nil {
			return err
		}
		category.Image = publicURL
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

	if strings.HasPrefix(category.Image, "data:image") {
		publicURL, err := uc.r2Client.UploadImage(ctx, category.Image, "categories")
		if err != nil {
			return err
		}
		category.Image = publicURL
	}

	// Busca la categoría por id y verifica que exista antes de actualizar

	existingCategory, err := uc.categoryRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if existingCategory == nil {
		return errors.New("category not found")
	}

	// actualización del nombre de categoria en los productos asociados
	// Buscar productos con el nombre antiguo
	products, err := uc.productsRepo.FindByCategoryName(ctx, existingCategory.Name)
	if err != nil {
		return err
	}

	for _, product := range products {
		// Actualizar producto con el nuevo nombre
		product.Category = category.Name
		err = uc.productsRepo.Update(ctx, &product)
		if err != nil {
			return err
		}
	}

	return uc.categoryRepo.UpdateCategory(ctx, id, category)
}

func (uc *CategoryUseCase) DeleteCategory(ctx context.Context, name string) error {
	if name == "" {
		return errors.New("category name is required")
	}

	products, err := uc.productsRepo.FindByCategoryName(ctx, name)
	if err != nil {
		return err
	}

	if len(products) > 0 {
		return errors.New("category has products")
	}

	return uc.categoryRepo.DeleteCategory(ctx, name)
}
