import { productsClient } from '../config/httpClient.js';
import Product from '../../domain/entities/Product.js';
import Category from '../../domain/entities/Category.js';
import IProductRepository from '../../domain/repositories/IProductRepository.js';

// Product API Repository Implementation
export class ProductApiRepository extends IProductRepository {
    async getProducts(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.category) {
                var categoryminuscula = filters.category.toLowerCase();
                params.append('category', categoryminuscula);
            }

            if (filters.minPrice) params.append('min_price', filters.minPrice);
            if (filters.maxPrice) params.append('max_price', filters.maxPrice);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await productsClient.get(`/api/v1/search?${params.toString()}`);

            return {
                products: response.data.products.map(p => new Product(p)),
                pagination: response.data.pagination || {},
            };
        } catch (error) {
            throw new Error(`Failed to fetch products: ${error.message}`);
        }
    }

    async getProductById(id) {
        try {
            const response = await productsClient.get(`/api/v1/products/${id}`);
            return new Product(response.data);
        } catch (error) {
            throw new Error(`Failed to fetch product: ${error.message}`);
        }
    }

    async createProduct(productData) {
        try {
            const response = await productsClient.post('/api/v1/admin/products', productData);
            return new Product(response.data);
        } catch (error) {
            throw new Error(`Failed to create product: ${error.message}`);
        }
    }

    async updateProduct(id, productData) {
        try {
            const response = await productsClient.put(`/api/v1/admin/products/${id}`, productData);
            return new Product(response.data);
        } catch (error) {
            throw new Error(`Failed to update product: ${error.message}`);
        }
    }

    async deleteProduct(id) {
        try {
            await productsClient.delete(`/api/v1/admin/products/${id}`);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete product: ${error.message}`);
        }
    }

    async searchProducts(query, filters = {}) {
        try {
            const params = new URLSearchParams({ q: query });

            if (filters.category) params.append('category', filters.category);
            if (filters.color) params.append('color', filters.color);
            if (filters.size) params.append('size', filters.size);
            if (filters.minPrice) params.append('min_price', filters.minPrice);
            if (filters.maxPrice) params.append('max_price', filters.maxPrice);

            const response = await productsClient.get(`/api/v1/search?${params.toString()}`);
            return response.data.map(p => new Product(p));
        } catch (error) {
            throw new Error(`Failed to search products: ${error.message}`);
        }
    }

    // Category operations
    async getCategories() {
        try {
            const response = await productsClient.get('/api/v1/categories');
            return response.data.categories.map(c => new Category(c));
        } catch (error) {
            throw new Error(`Failed to fetch categories: ${error.message}`);
        }
    }

    async createCategory(categoryData) {
        try {
            const response = await productsClient.post('/api/v1/admin/categories', categoryData);
            return new Category(response.data);
        } catch (error) {
            throw new Error(`Failed to create category: ${error.message}`);
        }
    }

    async updateCategory(id, categoryData) {
        try {
            const response = await productsClient.put(`/api/v1/admin/categories/${id}`, categoryData);
            return new Category(response.data);
        } catch (error) {
            throw new Error(`Failed to update category: ${error.message}`);
        }
    }

    async deleteCategory(name) {
        try {
            await productsClient.delete(`/api/v1/admin/categories/${name}`);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete category: ${error.message}`);
        }
    }

    async setFeaturedCategory(id, featured) {
        try {
            await productsClient.put(`/api/v1/admin/categories/${id}/feature`, { featured });
            return true;
        } catch (error) {
            throw new Error(`Failed to update featured status: ${error.message}`);
        }
    }

    async getFeaturedCategories() {
        try {
            const response = await productsClient.get('/api/v1/categories/featured');
            return response.data.categories.map(c => new Category(c));
        } catch (error) {
            throw new Error(`Failed to fetch featured categories: ${error.message}`);
        }
    }

    // Banner operations
    async getActiveBanner() {
        try {
            const response = await productsClient.get('/api/v1/banners/active');
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null; // No active banner
            }
            throw new Error(`Failed to fetch active banner: ${error.message}`);
        }
    }

    async getAdminBanners() {
        try {
            const response = await productsClient.get('/api/v1/admin/banners');
            return response.data.banners || [];
        } catch (error) {
            throw new Error(`Failed to fetch banners: ${error.message}`);
        }
    }

    async createBanner(bannerData) {
        try {
            const response = await productsClient.post('/api/v1/admin/banners', bannerData);
            return response.data.banner;
        } catch (error) {
            throw new Error(`Failed to create banner: ${error.message}`);
        }
    }

    async updateBanner(id, bannerData) {
        try {
            const response = await productsClient.put(`/api/v1/admin/banners/${id}`, bannerData);
            return response.data.banner;
        } catch (error) {
            throw new Error(`Failed to update banner: ${error.message}`);
        }
    }

    async setActiveBanner(id) {
        try {
            await productsClient.put(`/api/v1/admin/banners/${id}/activate`);
            return true;
        } catch (error) {
            throw new Error(`Failed to activate banner: ${error.message}`);
        }
    }

    async deleteBanner(id) {
        try {
            await productsClient.delete(`/api/v1/admin/banners/${id}`);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete banner: ${error.message}`);
        }
    }
}

export default new ProductApiRepository();
