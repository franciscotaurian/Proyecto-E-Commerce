import { usersClient } from '../config/httpClient.js';
import User from '../../domain/entities/User.js';
import IUserRepository from '../../domain/repositories/IUserRepository.js';

// User API Repository Implementation
export class UserApiRepository extends IUserRepository {
    async getProfile() {
        try {
            const response = await usersClient.get('/api/v1/profile');
            return new User(response.data);
        } catch (error) {
            throw new Error(`Failed to fetch profile: ${error.message}`);
        }
    }

    async updateProfile(userData) {
        try {
            const response = await usersClient.put('/api/v1/profile', {
                user_id: userData.id,
                first_name: userData.firstName,
                last_name: userData.lastName,
                dni: userData.dni,
                phone: userData.phone,
                street: userData.address?.street,
                number: userData.address?.number,
                floor: userData.address?.floor,
                apartment: userData.address?.apartment,
                city: userData.address?.city,
                province: userData.address?.province,
                country: userData.address?.country,
                zip_code: userData.address?.zipCode,
            });
            return new User(response.data);
        } catch (error) {
            throw new Error(`Failed to update profile: ${error.message}`);
        }
    }

    async getUserInformation(userId) {
        try {
            const response = await usersClient.get(`/internal/user_information/${userId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch user information: ${error.message}`);
        }
    }
}

export default new UserApiRepository();
