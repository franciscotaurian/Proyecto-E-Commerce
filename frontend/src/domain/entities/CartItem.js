// Cart Item Entity
export class CartItem {
    constructor(data = {}) {
        this.productId = data.product_id || data.productId || '';
        this.productName = data.product_name || data.productName || '';
        this.color = data.color || '';
        this.size = data.size || '';
        this.quantity = data.quantity || 1;
        this.price = data.price || 0;
        this.image = data.image || '';
    }

    // Get subtotal for this item
    getSubtotal() {
        return this.price * this.quantity;
    }

    // Validate cart item
    validate() {
        const errors = [];

        if (!this.productId) {
            errors.push('Product ID is required');
        }

        if (!this.color) {
            errors.push('Color is required');
        }

        if (!this.size) {
            errors.push('Size is required');
        }

        if (this.quantity <= 0) {
            errors.push('Quantity must be greater than 0');
        }

        if (this.price < 0) {
            errors.push('Price cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Create a unique key for this cart item (product + variant)
    getUniqueKey() {
        return `${this.productId}-${this.color}-${this.size}`;
    }
}

export default CartItem;
