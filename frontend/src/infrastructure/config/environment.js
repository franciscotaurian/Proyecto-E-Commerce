// Environment configuration
// Reads from Vite environment variables with fallbacks

const config = {
    api: {
        products: import.meta.env.VITE_PRODUCTS_API_URL || 'http://localhost:8082',
        users: import.meta.env.VITE_USERS_API_URL || 'http://localhost:8081',
        payments: import.meta.env.VITE_PAYMENTS_API_URL || 'http://localhost:8083',
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
