import React from 'react';
import { useCart } from '../../../hooks/useCart.js';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import Button from '../../../components/common/Button.jsx';
import Spinner from '../../../components/common/Spinner.jsx';

export const Cart = () => {
    const { cart, loading, removeFromCart, clearCart, getTotal, getItemCount } = useCart();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (cart.isEmpty()) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
                <Button onClick={() => navigate('/')}>Continuar Comprando</Button>
            </div>
        );
    }

    const handleCheckout = () => {
        navigate('/checkout');
    };

    const handleRemove = async (productId) => {
        try {
            await removeFromCart(productId);
        } catch (error) {
            alert('Error al eliminar el producto');
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Carrito de Compras</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="space-y-4">
                        {cart.items.map((item) => (
                            <div key={item.getUniqueKey()} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                                <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="w-24 h-24 object-cover rounded"
                                />
                                <div className="flex-grow">
                                    <h3 className="font-bold">{item.productName}</h3>
                                    <p className="text-sm text-gray-600">
                                        Talle: {item.size} | Color: {item.color}
                                    </p>
                                    <p className="text-sm mt-1">Cantidad: {item.quantity}</p>
                                    <p className="font-bold mt-2">{formatCurrency(item.getSubtotal())}</p>
                                </div>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRemove(item.productId)}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky top-24">
                        <h2 className="text-xl font-bold mb-4">Resumen</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Productos ({getItemCount()})</span>
                                <span>{formatCurrency(getTotal())}</span>
                            </div>
                            <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(getTotal())}</span>
                            </div>
                        </div>
                        <Button
                            className="w-full mt-6"
                            onClick={handleCheckout}
                        >
                            Proceder al Pago
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => navigate('/')}
                        >
                            Continuar Comprando
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
