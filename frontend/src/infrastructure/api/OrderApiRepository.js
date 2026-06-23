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
                    image_url: item.imageUrl,
                    color: item.color,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                })),
                shipping_info: {
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
                },
            });

            const raw = response.data;
            const rawOrder = raw.order || raw;
            // payment_url lives at the root of the response, not inside the nested order object
            return new Order({ ...rawOrder, payment_url: raw.payment_url || rawOrder.payment_url });


        } catch (error) {
            // Preserve backend error message if available
            const backendMessage = error.response?.data?.error;
            throw new Error(backendMessage || error.message);
        }
    }

    async getUserOrders() {
        try {
            const response = await paymentsClient.get('/api/v1/orders');

            if (response.data.orders === null) {
                return [];
            }

            return response.data.orders.map(o => new Order(o));
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
            const response = await paymentsClient.get(`/api/v1/orders/whatsapp/${orderId}`);
            return response.data.whatsapp_url;
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

            const query = params.toString();
            const response = await paymentsClient.get(`/api/v1/admin/orders${query ? `?${query}` : ''}`);
            const orders = response.data.orders || [];
            return orders.map(o => new Order(o));
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

    async getAllPaidOrders(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.from) params.append('from', filters.from);
            if (filters.to) params.append('to', filters.to);

            const query = params.toString();
            const response = await paymentsClient.get(`/api/v1/admin/orders${query ? `?${query}` : ''}`);
            const orders = response.data.orders || [];
            return orders.map(o => new Order(o));
        } catch (error) {
            throw new Error(`Failed to fetch paid orders: ${error.message}`);
        }
    }

    async updateShippingTrackId(orderId, trackId) {
        try {
            await paymentsClient.put(`/api/v1/admin/orders/${orderId}/shipped`, { track_id: trackId });
            return true;
        } catch (error) {
            throw new Error(`Failed to update track ID: ${error.message}`);
        }
    }

    async updateShippingStatus(orderId, shippingStatus) {
        try {
            await paymentsClient.put(`/api/v1/admin/orders/${orderId}/status`, { shipping_status: shippingStatus });
            return true;
        } catch (error) {
            throw new Error(`Failed to update shipping status: ${error.message}`);
        }
    }

    async resendVerificationEmail(email) {
        try {
            const { usersClient } = await import('../config/httpClient.js');
            await usersClient.post('/api/v1/auth/resend-verification', { email });
        } catch (error) {
            throw new Error(error.message || 'Error al reenviar el email de verificación');
        }
    }
}

export default new OrderApiRepository();
