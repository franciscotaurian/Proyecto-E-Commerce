import { productsClient } from '../config/httpClient.js';
import Cart from '../../domain/entities/Cart.js';
import ICartRepository from '../../domain/repositories/ICartRepository.js';

// Cart API Repository Implementation
export class CartApiRepository extends ICartRepository {
    async getCart() {
        try {
            const response = await productsClient.get('/api/v1/cart');
            return new Cart(response.data.cart);
        } catch (error) {
            throw new Error(`Failed to fetch cart: ${error.message}`);
        }
    }

    async addToCart(itemData) {
        try {
            const response = await productsClient.post('/api/v1/cart/items', {
                product_id: itemData.product_id,
                color: itemData.color,
                size: itemData.size,
                quantity: itemData.quantity,
            });
            return new Cart(response.data.cart);
        } catch (error) {
            throw new Error(`Failed to add item to cart: ${error.message}`);
        }
    }

    async updateCartItem(productId, itemData) {
        try {
            const response = await productsClient.put(`/api/v1/cart/items/${productId}`, {
                color: itemData.color,
                size: itemData.size,
                quantity: itemData.quantity,
            });
            return new Cart(response.data.cart);
        } catch (error) {
            throw new Error(`Failed to update cart item: ${error.message}`);
        }
    }

    async removeFromCart(productId, productSize, productColor) {
        try {
            const response = await productsClient.delete(`/api/v1/cart/items/${productId}/${productSize}/${productColor}`);
            return new Cart(response.data.cart);
        } catch (error) {
            throw new Error(`Failed to remove item from cart: ${error.message}`);
        }
    }

    async clearCart() {
        try {
            const response = await productsClient.delete('/api/v1/cart');
            return new Cart(response.data.cart);
        } catch (error) {
            throw new Error(`Failed to clear cart: ${error.message}`);
        }
    }
}

export default new CartApiRepository();
