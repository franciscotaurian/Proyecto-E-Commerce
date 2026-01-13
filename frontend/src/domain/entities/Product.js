// Product Entity
export class Product {
    constructor(data = {}) {
        this.id = data.id || data._id || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.category = data.category || '';
        this.price = data.price || 0;
        this.images = data.images || [];
        this.variants = (data.variants || []).map(v => ({
            color: v.color,
            size: v.size,
            quantity: v.quantity,
            reserved: v.reserved || 0,
            available: v.available || (v.quantity - (v.reserved || 0))
        }));
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    // Get total available stock across all variants
    getTotalStock() {
        return this.variants.reduce((total, variant) => total + variant.available, 0);
    }

    // Find a specific variant by color and size
    findVariant(color, size) {
        return this.variants.find(v => v.color === color && v.size === size);
    }

    // Get all unique colors
    getColors() {
        return [...new Set(this.variants.map(v => v.color))];
    }

    // Get all unique sizes
    getSizes() {
        return [...new Set(this.variants.map(v => v.size))];
    }

    // Check if product is in stock
    isInStock() {
        return this.getTotalStock() > 0;
    }

    // Validate product data
    validate() {
        const errors = [];

        if (!this.name || this.name.trim() === '') {
            errors.push('Product name is required');
        }

        if (!this.category || this.category.trim() === '') {
            errors.push('Category is required');
        }

        if (this.price <= 0) {
            errors.push('Price must be greater than 0');
        }

        if (!this.variants || this.variants.length === 0) {
            errors.push('At least one variant is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default Product;
