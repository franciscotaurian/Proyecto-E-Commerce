// Cart Repository Interface
export class ICartRepository {
    async getCart() {
        throw new Error('Method not implemented');
    }

    async addToCart(itemData) {
        throw new Error('Method not implemented');
    }

    async updateCartItem(productId, itemData) {
        throw new Error('Method not implemented');
    }

    async removeFromCart(productId) {
        throw new Error('Method not implemented');
    }

    async clearCart() {
        throw new Error('Method not implemented');
    }
}

export default ICartRepository;
