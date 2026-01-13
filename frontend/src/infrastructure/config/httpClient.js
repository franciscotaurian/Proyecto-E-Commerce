import axios from 'axios';
import config from './environment.js';
import { getToken, clearAuth } from '../storage/LocalStorageService.js';

// Create axios instances for each microservice
const createHttpClient = (baseURL) => {
    const client = axios.create({
        baseURL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor to add JWT token
    client.interceptors.request.use(
        (config) => {
            const token = getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor to handle errors globally
    client.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response) {
                // Handle 401 Unauthorized - clear auth and redirect to login
                if (error.response.status === 401) {
                    clearAuth();
                    window.location.href = '/login';
                }

                // Handle other HTTP errors
                const errorMessage = error.response.data?.error ||
                    error.response.data?.message ||
                    'An error occurred';

                return Promise.reject(new Error(errorMessage));
            } else if (error.request) {
                // Network error
                return Promise.reject(new Error('Network error. Please check your connection.'));
            } else {
                return Promise.reject(error);
            }
        }
    );

    return client;
};

// HTTP clients for each microservice
export const productsClient = createHttpClient(config.api.products);
export const usersClient = createHttpClient(config.api.users);
export const paymentsClient = createHttpClient(config.api.payments);

export default {
    productsClient,
    usersClient,
    paymentsClient,
};
