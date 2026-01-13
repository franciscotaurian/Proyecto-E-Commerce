import React, { createContext, useState, useEffect, useCallback } from 'react';
import AuthApiRepository from '../../infrastructure/api/AuthApiRepository.js';
import UserApiRepository from '../../infrastructure/api/UserApiRepository.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user from localStorage on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const authenticated = await AuthApiRepository.isAuthenticated();
                if (authenticated) {
                    const currentUser = await AuthApiRepository.getCurrentUser();
                    setUser(currentUser);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const loggedInUser = await AuthApiRepository.login(email, password);
            setUser(loggedInUser);
            setIsAuthenticated(true);
            return loggedInUser;
        } catch (error) {
            throw error;
        }
    }, []);

    const register = useCallback(async (userData) => {
        try {
            const registeredUser = await AuthApiRepository.register(userData);
            setUser(registeredUser);
            setIsAuthenticated(true);
            return registeredUser;
        } catch (error) {
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await AuthApiRepository.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    const updateUserProfile = useCallback(async (userData) => {
        try {
            const updatedUser = await UserApiRepository.updateProfile(userData);
            setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            throw error;
        }
    }, []);

    const isAdmin = useCallback(() => {
        return AuthApiRepository.isAdmin();
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        updateUserProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
