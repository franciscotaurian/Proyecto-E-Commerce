// Environment configuration
// Reads from Vite environment variables with fallbacks

const config = {
    api: {
        products: import.meta.env.VITE_PRODUCTS_API_URL || '/api/products',
        users: import.meta.env.VITE_USERS_API_URL || '/api/users',
        payments: import.meta.env.VITE_PAYMENTS_API_URL || '/api/payments',
    },
    app: {
        name: 'E-Commerce',
        version: '1.0.0',
    },
    storage: {
        tokenKey: 'ecommerce_token',
        userKey: 'ecommerce_user',
    },
};

export default config;
