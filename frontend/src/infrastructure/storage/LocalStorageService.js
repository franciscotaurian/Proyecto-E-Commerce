import config from '../config/environment.js';

// LocalStorage Service for persisting authentication data
class LocalStorageService {
    // Token management
    getToken() {
        return localStorage.getItem(config.storage.tokenKey);
    }

    setToken(token) {
        localStorage.setItem(config.storage.tokenKey, token);
    }

    removeToken() {
        localStorage.removeItem(config.storage.tokenKey);
    }

    // User data management
    getUser() {
        const userStr = localStorage.getItem(config.storage.userKey);
        return userStr ? JSON.parse(userStr) : null;
    }

    setUser(user) {
        localStorage.setItem(config.storage.userKey, JSON.stringify(user));
    }

    removeUser() {
        localStorage.removeItem(config.storage.userKey);
    }

    // Clear all auth data
    clearAuth() {
        this.removeToken();
        this.removeUser();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    }
}

// Export singleton instance
const storageService = new LocalStorageService();

export const getToken = () => storageService.getToken();
export const setToken = (token) => storageService.setToken(token);
export const removeToken = () => storageService.removeToken();
export const getUser = () => storageService.getUser();
export const setUser = (user) => storageService.setUser(user);
export const removeUser = () => storageService.removeUser();
export const clearAuth = () => storageService.clearAuth();
export const isAuthenticated = () => storageService.isAuthenticated();

export default storageService;
