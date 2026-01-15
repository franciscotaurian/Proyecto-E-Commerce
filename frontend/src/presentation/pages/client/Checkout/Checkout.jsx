import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { useCart } from '../../../hooks/useCart.js';
import OrderApiRepository from '../../../../infrastructure/api/OrderApiRepository.js';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { SHIPPING_METHODS } from '../../../../shared/utils/constants.js';

export const Checkout = () => {
    const { user } = useAuth();
    const { cart, clearCart, getTotal } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [shippingAddress, setShippingAddress] = useState({
        street: user?.address?.street || '',
        number: user?.address?.number || '',
        floor: user?.address?.floor || '',
        apartment: user?.address?.apartment || '',
        city: user?.address?.city || '',
        province: user?.address?.province || '',
        country: user?.address?.country || 'Argentina',
        zipCode: user?.address?.zipCode || '',
    });

    const isCordoba = shippingAddress.city.toLowerCase().includes('cordoba') ||
        shippingAddress.city.toLowerCase().includes('córdoba');

    const shippingMethod = isCordoba ? SHIPPING_METHODS.WHATSAPP : SHIPPING_METHODS.SEND;

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setShippingAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isCordoba) {
            setError('Por el momento solo realizamos envíos a Córdoba. Estamos trabajando para expandir nuestro alcance pronto.');
            return;
        }

        try {
            setLoading(true);
            const order = await OrderApiRepository.createOrder({
                items: cart.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    imageUrl: item.image,
                    color: item.color,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                })),
                shippingMethod,
                shippingAddress,
            });

            // Redirect to MercadoPago
            if (order.paymentUrl) {
                alert('Orden creada exitosamente');
                window.location.href = order.paymentUrl;
            } else {
                navigate(`/payment-confirmation/${order.orderId}`);
            }
        } catch (err) {
            setError(err.message || 'Error al crear la orden');
        } finally {
            setLoading(false);
        }
    };

    if (cart.isEmpty()) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
                <Button onClick={() => navigate('/')}>Continuar Comprando</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {!isCordoba && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-6">
                    <strong>Aviso:</strong> Actualmente solo enviamos a Córdoba capital.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Info & Shipping */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Información de Envío</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded mb-4">
                            <h3 className="font-bold mb-2">Tus Datos</h3>
                            <p>{user?.getFullName()}</p>
                            <p>{user?.email}</p>
                            <p>{user?.phone}</p>
                        </div>

                        <Input
                            label="Calle"
                            name="street"
                            value={shippingAddress.street}
                            onChange={handleAddressChange}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Número"
                                name="number"
                                value={shippingAddress.number}
                                onChange={handleAddressChange}
                                required
                            />
                            <Input
                                label="Piso"
                                name="floor"
                                value={shippingAddress.floor}
                                onChange={handleAddressChange}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Departamento"
                                name="apartment"
                                value={shippingAddress.apartment}
                                onChange={handleAddressChange}
                                required
                            />
                            <Input
                                label="Ciudad"
                                name="city"
                                value={shippingAddress.city}
                                onChange={handleAddressChange}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Provincia"
                                name="province"
                                value={shippingAddress.province}
                                onChange={handleAddressChange}
                                required
                            />
                            <Input
                                label="Código Postal"
                                name="zipCode"
                                value={shippingAddress.zipCode}
                                onChange={handleAddressChange}
                                required
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded mt-4">
                            <h3 className="font-bold mb-2">Método de Envío</h3>
                            <p className="text-sm">
                                {isCordoba ? '📱 WhatsApp - Retiro en persona' : '📦 Envío Send'}
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-6"
                            disabled={loading || !isCordoba}
                        >
                            {loading ? 'Procesando...' : 'Ir a Pagar'}
                        </Button>
                    </form>
                </div>

                {/* Order Summary */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Resumen del Pedido</h2>
                    <div className="bg-gray-50 p-6 rounded">
                        <div className="space-y-3 mb-4">
                            {cart.items.map((item) => (
                                <div key={item.getUniqueKey()} className="flex justify-between text-sm">
                                    <span>
                                        {item.productName} ({item.size}/{item.color}) x{item.quantity}
                                    </span>
                                    <span>{formatCurrency(item.getSubtotal())}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-300 pt-4">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(getTotal())}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
