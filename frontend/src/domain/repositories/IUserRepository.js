// User Repository Interface
export class IUserRepository {
    async getProfile() {
        throw new Error('Method not implemented');
    }

    async updateProfile(userData) {
        throw new Error('Method not implemented');
    }

    async getUserInformation(userId) {
        throw new Error('Method not implemented');
    }
}

export default IUserRepository;
