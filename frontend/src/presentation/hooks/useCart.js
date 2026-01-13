import { useContext } from 'react';
import CartContext from '../context/CartContext.jsx';

// Hook to use cart context
export const useCart = () => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }

    return context;
};

export default useCart;
