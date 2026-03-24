import React, { createContext, useState, useEffect, useCallback } from 'react';
import CartApiRepository from '../../infrastructure/api/CartApiRepository.js';
import Cart from '../../domain/entities/Cart.js';
import AuthApiRepository from '../../infrastructure/api/AuthApiRepository.js';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(new Cart());
    const [loading, setLoading] = useState(false);

    // Load cart when user is authenticated
    const loadCart = useCallback(async () => {
        const isAuth = await AuthApiRepository.isAuthenticated();
        if (!isAuth) {
            setCart(new Cart());
            return;
        }

        try {
            setLoading(true);
            const userCart = await CartApiRepository.getCart();
            setCart(userCart);
        } catch (error) {
            console.error('Failed to load cart:', error);
            setCart(new Cart());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const addToCart = useCallback(async (itemData) => {
        try {
            setLoading(true);
            const updatedCart = await CartApiRepository.addToCart(itemData);
            setCart(updatedCart);
            return updatedCart;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateCartItem = useCallback(async (productId, itemData) => {
        try {
            setLoading(true);
            const updatedCart = await CartApiRepository.updateCartItem(productId, itemData);
            setCart(updatedCart);
            return updatedCart;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const removeFromCart = useCallback(async (productId, productSize, productColor) => {
        try {
            setLoading(true);
            const updatedCart = await CartApiRepository.removeFromCart(productId, productSize, productColor);
            setCart(updatedCart);
            return updatedCart;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearCart = useCallback(async () => {
        try {
            setLoading(true);
            const updatedCart = await CartApiRepository.clearCart();
            setCart(updatedCart);
            return updatedCart;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const getTotal = useCallback(() => {
        return cart.getTotal();
    }, [cart]);

    const getItemCount = useCallback(() => {
        return cart.getItemCount();
    }, [cart]);

    const value = {
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getTotal,
        getItemCount,
        refreshCart: loadCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
