import React from 'react';
import { AuthProvider } from './AuthContext.jsx';
import { CartProvider } from './CartContext.jsx';

// Combined provider that wraps all context providers
export const AppProvider = ({ children }) => {
    return (
        <AuthProvider>
            <CartProvider>
                {children} {/* children is the component that will be rendered */}
            </CartProvider>
        </AuthProvider>
    );
};

export default AppProvider;
