// Authentication Repository Interface
export class IAuthRepository {
    async login(email, password) {
        throw new Error('Method not implemented');
    }

    async register(userData) {
        throw new Error('Method not implemented');
    }

    async logout() {
        throw new Error('Method not implemented');
    }

    async sendResetPasswordEmail(email) {
        throw new Error('Method not implemented');
    }

    async resetPassword(token, newPassword) {
        throw new Error('Method not implemented');
    }

    async verifyEmail(token) {
        throw new Error('Method not implemented');
    }

    async getCurrentUser() {
        throw new Error('Method not implemented');
    }

    async getToken() {
        throw new Error('Method not implemented');
    }

    async isAuthenticated() {
        throw new Error('Method not implemented');
    }
}

export default IAuthRepository;
