import { Address } from './User.js';

// Order Item Entity
export class OrderItem {
    constructor(data = {}) {
        this.productId = data.product_id || data.productId || '';
        this.productName = data.product_name || data.productName || '';
        this.productImage = data.image_url || data.product_image || data.productImage || '';
        this.color = data.color || '';
        this.size = data.size || '';
        this.quantity = data.quantity || 1;
        this.price = data.price || 0;
    }

    // Get subtotal
    getSubtotal() {
        return this.price * this.quantity;
    }
}

// Order Entity
export class Order {
    constructor(data = {}) {
        this.id = data.id || data._id || '';
        this.orderId = data.order_id || data.orderId || '';
        this.userId = data.user_id || data.userId || '';
        this.items = (data.items || []).map(item => new OrderItem(item));
        this.totalAmount = data.total_amount || data.totalAmount || 0;
        this.status = data.status || 'Pending';
        this.shippingMethod = data.shipping_method || data.shippingMethod || '';
        this.shippingStatus = data.shipping_status || data.shippingStatus || 'Pending';
        this.shippingAddress = new Address(data.shipping_address || data.shippingAddress || {});
        this.envioPackId = data.enviopack_id || data.envioPackId || '';
        this.paymentUrl = data.payment_url || data.paymentUrl || '';
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    // Calculate total from items
    calculateTotal() {
        return this.items.reduce((total, item) => total + item.getSubtotal(), 0);
    }

    // Check if order is paid
    isPaid() {
        return this.status === 'Paid';
    }

    // Check if order is shipped
    isShipped() {
        return this.shippingStatus === 'Shipped' || this.shippingStatus === 'Delivered';
    }

    // Check if order is pending shipment
    isPendingShipment() {
        return this.isPaid() && this.shippingStatus === 'Pending';
    }

    // Check if shipping is via WhatsApp
    isWhatsAppShipping() {
        return this.shippingMethod === 'Whatsapp';
    }

    // Check if shipping is via Send
    isSendShipping() {
        return this.shippingMethod === 'Send';
    }

    // Validate order
    validate() {
        const errors = [];

        if (!this.userId) {
            errors.push('User ID is required');
        }

        if (!this.items || this.items.length === 0) {
            errors.push('At least one item is required');
        }

        if (!this.shippingMethod) {
            errors.push('Shipping method is required');
        }

        if (this.totalAmount <= 0) {
            errors.push('Total amount must be greater than 0');
        }

        const addressValidation = this.shippingAddress.validate();
        if (!addressValidation.isValid) {
            errors.push(...addressValidation.errors.map(e => `Shipping address: ${e}`));
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default Order;
