import { usersClient } from '../config/httpClient.js';
import User from '../../domain/entities/User.js';
import IAuthRepository from '../../domain/repositories/IAuthRepository.js';
import { setToken, setUser, clearAuth, getToken, getUser, isAuthenticated } from '../storage/LocalStorageService.js';
import { jwtDecode } from 'jwt-decode';

// Authentication API Repository Implementation
export class AuthApiRepository extends IAuthRepository {
    async login(email, password) {
        try {
            const response = await usersClient.post('/api/v1/login', {
                email,
                password,
            });

            const { token, user } = response.data;

            // Store token and user data
            setToken(token);
            setUser(user);

            return new User(user);
        } catch (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    async register(userData) {
        try {
            const response = await usersClient.post('/api/v1/register', {
                first_name: userData.firstName,
                last_name: userData.lastName,
                dni: userData.dni,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                address: {
                    street: userData.address.street,
                    number: userData.address.number,
                    floor: userData.address.floor,
                    apartment: userData.address.apartment,
                    city: userData.address.city,
                    province: userData.address.province,
                    country: userData.address.country,
                    zip_code: userData.address.zipCode,
                },
            });

            const { token, user } = response.data;

            // Store token and user data
            setToken(token);
            setUser(user);

            return new User(user);
        } catch (error) {
            throw new Error(`Registration failed: ${error.message}`);
        }
    }

    async logout() {
        clearAuth();
        return true;
    }

    async sendResetPasswordEmail(email) {
        try {
            await usersClient.post('/api/v1/auth/reset-password-email', { email });
            return true;
        } catch (error) {
            throw new Error(`Failed to send reset password email: ${error.message}`);
        }
    }

    async resetPassword(token, newPassword) {
        try {
            await usersClient.post('/api/v1/auth/reset-password', {
                token,
                new_password: newPassword,
            });
            return true;
        } catch (error) {
            throw new Error(`Failed to reset password: ${error.message}`);
        }
    }

    async verifyEmail(token) {
        try {
            await usersClient.get(`/api/v1/auth/verify/${token}`);
            return true;
        } catch (error) {
            throw new Error(`Failed to verify email: ${error.message}`);
        }
    }

    async getCurrentUser() {
        const user = getUser();
        return user ? new User(user) : null;
    }

    async getToken() {
        return getToken();
    }

    async isAuthenticated() {
        return isAuthenticated();
    }

    // Check if user is admin
    isAdmin() {
        const token = getToken();
        if (!token) return false;

        try {
            const decoded = jwtDecode(token);
            return decoded.is_admin === true;
        } catch (error) {
            return false;
        }
    }

    // Get user ID from token
    getUserId() {
        const token = getToken();
        if (!token) return null;

        try {
            const decoded = jwtDecode(token);
            return decoded.user_id || decoded.sub;
        } catch (error) {
            return null;
        }
    }
}

export default new AuthApiRepository();
