import CartItem from './CartItem.js';

// Cart Entity
export class Cart {
    constructor(data = {}) {
        this.id = data.id || data._id || '';
        this.userId = data.user_id || data.userId || '';
        this.items = (data.items || []).map(item => new CartItem(item));
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    // Get total price of all items in cart
    getTotal() {
        return this.items.reduce((total, item) => total + item.getSubtotal(), 0);
    }

    // Get total number of items in cart
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Find item by product ID and variant
    findItem(productId, color, size) {
        return this.items.find(
            item => item.productId === productId && item.color === color && item.size === size
        );
    }

    // Add item to cart (or update quantity if exists)
    addItem(itemData) {
        const newItem = new CartItem(itemData);
        const validation = newItem.validate();

        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const existingItem = this.findItem(newItem.productId, newItem.color, newItem.size);

        if (existingItem) {
            existingItem.quantity += newItem.quantity;
        } else {
            this.items.push(newItem);
        }

        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Update item quantity
    updateItemQuantity(productId, color, size, quantity) {
        const item = this.findItem(productId, color, size);

        if (!item) {
            throw new Error('Item not found in cart');
        }

        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }

        item.quantity = quantity;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Remove item from cart
    removeItem(productId, color, size) {
        const index = this.items.findIndex(
            item => item.productId === productId && item.color === color && item.size === size
        );

        if (index === -1) {
            throw new Error('Item not found in cart');
        }

        this.items.splice(index, 1);
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Clear all items from cart
    clear() {
        this.items = [];
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Check if cart is empty
    isEmpty() {
        return this.items.length === 0;
    }

    // Validate cart
    validate() {
        const errors = [];

        if (!this.userId) {
            errors.push('User ID is required');
        }

        // Validate all items
        this.items.forEach((item, index) => {
            const itemValidation = item.validate();
            if (!itemValidation.isValid) {
                errors.push(`Item ${index + 1}: ${itemValidation.errors.join(', ')}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default Cart;
