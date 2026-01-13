// Order Repository Interface
export class IOrderRepository {
    async createOrder(orderData) {
        throw new Error('Method not implemented');
    }

    async getUserOrders() {
        throw new Error('Method not implemented');
    }

    async getOrderById(orderId) {
        throw new Error('Method not implemented');
    }

    async cancelOrder(orderId) {
        throw new Error('Method not implemented');
    }

    async sendWhatsAppNotification(orderId) {
        throw new Error('Method not implemented');
    }

    // Admin methods
    async getAllOrders(filters = {}) {
        throw new Error('Method not implemented');
    }

    async getOrdersByShippingStatus(status) {
        throw new Error('Method not implemented');
    }

    async getAdminOrderById(orderId) {
        throw new Error('Method not implemented');
    }
}

export default IOrderRepository;
