// Constants used throughout the application

// Shipping Methods
export const SHIPPING_METHODS = {
    WHATSAPP: 'Whatsapp',
    SEND: 'Send',
};

// Order Status
export const ORDER_STATUS = {
    PENDING: 'Pending',
    PAID: 'Paid',
    SHIPPED: 'Shipped',
    CANCELLED: 'Cancelled',
};

// Shipping Status
export const SHIPPING_STATUS = {
    PENDING: 'Pending',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    ADMIN_LIMIT: 20,
};

// Validation rules
export const VALIDATION = {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PRODUCT_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
};

// Price ranges for filters
export const PRICE_RANGES = [
    { label: 'Menos de $10,000', min: 0, max: 10000 },
    { label: '$10,000 - $25,000', min: 10000, max: 25000 },
    { label: '$25,000 - $50,000', min: 25000, max: 50000 },
    { label: 'Más de $50,000', min: 50000, max: 999999 },
];

// Common sizes
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Image placeholder
export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x400?text=No+Image';

export default {
    SHIPPING_METHODS,
    ORDER_STATUS,
    SHIPPING_STATUS,
    PAGINATION,
    VALIDATION,
    PRICE_RANGES,
    SIZES,
    PLACEHOLDER_IMAGE,
};
