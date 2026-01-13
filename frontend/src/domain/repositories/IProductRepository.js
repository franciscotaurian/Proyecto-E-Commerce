// Repository interfaces define contracts for data access
// These will be implemented by the infrastructure layer

// Product Repository Interface
export class IProductRepository {
    async getProducts(filters = {}) {
        throw new Error('Method not implemented');
    }

    async getProductById(id) {
        throw new Error('Method not implemented');
    }

    async createProduct(productData) {
        throw new Error('Method not implemented');
    }

    async updateProduct(id, productData) {
        throw new Error('Method not implemented');
    }

    async deleteProduct(id) {
        throw new Error('Method not implemented');
    }

    async searchProducts(query, filters = {}) {
        throw new Error('Method not implemented');
    }

    async getCategories() {
        throw new Error('Method not implemented');
    }

    async createCategory(categoryData) {
        throw new Error('Method not implemented');
    }

    async updateCategory(id, categoryData) {
        throw new Error('Method not implemented');
    }

    async deleteCategory(id) {
        throw new Error('Method not implemented');
    }
}

export default IProductRepository;
