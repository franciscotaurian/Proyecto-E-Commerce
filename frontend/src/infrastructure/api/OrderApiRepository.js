import { paymentsClient } from '../config/httpClient.js';
import Order from '../../domain/entities/Order.js';
import IOrderRepository from '../../domain/repositories/IOrderRepository.js';

// Order API Repository Implementation
export class OrderApiRepository extends IOrderRepository {
    async createOrder(orderData) {
        try {
            const response = await paymentsClient.post('/api/v1/checkout', {
                items: orderData.items.map(item => ({
                    product_id: item.productId,
                    product_name: item.productName,
                    color: item.color,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                })),
                shipping_method: orderData.shippingMethod,
                shipping_address: {
                    street: orderData.shippingAddress.street,
                    number: orderData.shippingAddress.number,
                    floor: orderData.shippingAddress.floor,
                    apartment: orderData.shippingAddress.apartment,
                    city: orderData.shippingAddress.city,
                    province: orderData.shippingAddress.province,
                    country: orderData.shippingAddress.country,
                    zip_code: orderData.shippingAddress.zipCode,
                },
            });

            return new Order(response.data);
        } catch (error) {
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }

    async getUserOrders() {
        try {
            const response = await paymentsClient.get('/api/v1/orders');
            return response.data.map(o => new Order(o));
        } catch (error) {
            throw new Error(`Failed to fetch orders: ${error.message}`);
        }
    }

    async getOrderById(orderId) {
        try {
            const response = await paymentsClient.get(`/api/v1/orders/${orderId}`);
            return new Order(response.data);
        } catch (error) {
            throw new Error(`Failed to fetch order: ${error.message}`);
        }
    }

    async cancelOrder(orderId) {
        try {
            await paymentsClient.post(`/api/v1/orders/cancel/${orderId}`);
            return true;
        } catch (error) {
            throw new Error(`Failed to cancel order: ${error.message}`);
        }
    }

    async sendWhatsAppNotification(orderId) {
        try {
            await paymentsClient.get(`/api/v1/orders/whatsapp/${orderId}`);
            return true;
        } catch (error) {
            throw new Error(`Failed to send WhatsApp notification: ${error.message}`);
        }
    }

    // Admin methods
    async getAllOrders(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.orderId) params.append('order_id', filters.orderId);
            if (filters.paidStatus) params.append('paid_status', filters.paidStatus);
            if (filters.shipStatus) params.append('ship_status', filters.shipStatus);

            const response = await paymentsClient.get(`/api/v1/admin/orders?${params.toString()}`);
            return response.data.map(o => new Order(o));
        } catch (error) {
            throw new Error(`Failed to fetch all orders: ${error.message}`);
        }
    }

    async getOrdersByShippingStatus(status) {
        try {
            const response = await paymentsClient.get(`/api/v1/admin/orders/status/${status}`);
            return response.data.map(o => new Order(o));
        } catch (error) {
            throw new Error(`Failed to fetch orders by shipping status: ${error.message}`);
        }
    }

    async getAdminOrderById(orderId) {
        try {
            const response = await paymentsClient.get(`/api/v1/admin/orders/${orderId}`);
            return new Order(response.data);
        } catch (error) {
            throw new Error(`Failed to fetch order details: ${error.message}`);
        }
    }
}

export default new OrderApiRepository();
