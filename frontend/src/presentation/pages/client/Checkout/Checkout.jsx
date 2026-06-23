import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { useCart } from '../../../hooks/useCart.js';
import OrderApiRepository from '../../../../infrastructure/api/OrderApiRepository.js';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { SHIPPING_METHODS, SHIPPING_COSTS, CORDOBA_ZIP_CODE } from '../../../../shared/utils/constants.js';

export const Checkout = () => {
    const { user } = useAuth();
    const { cart, clearCart, getTotal } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userNotVerified, setUserNotVerified] = useState(false);
    const [resendState, setResendState] = useState('idle'); // 'idle' | 'loading' | 'sent' | 'error'

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

    // Sync form with user data when it loads
    React.useEffect(() => {
        if (user && user.address) {
            setShippingAddress({
                street: user.address.street || '',
                number: user.address.number || '',
                floor: user.address.floor || '',
                apartment: user.address.apartment || '',
                city: user.address.city || '',
                province: user.address.province || '',
                country: user.address.country || 'Argentina',
                zipCode: user.address.zipCode || '',
            });
        }
    }, [user]);

    // Determine shipping method based on ZIP code (CP 5000 = Córdoba capital)
    const isCordoba = shippingAddress.zipCode.trim() === CORDOBA_ZIP_CODE;
    const shippingMethod = isCordoba ? SHIPPING_METHODS.WHATSAPP : SHIPPING_METHODS.SEND;

    // Validate Argentina
    const isArgentina = shippingAddress.country.toLowerCase().includes('argentina');

    // Calculate shipping cost (mirrors backend SelectShippingCost logic)
    const subtotal = getTotal();
    const isFreeShipping = subtotal >= SHIPPING_COSTS.FREE_SHIPPING_LIMIT;
    const shippingCost = isFreeShipping
        ? 0
        : isCordoba
            ? SHIPPING_COSTS.IN_CORDOBA
            : SHIPPING_COSTS.OUT_OF_CORDOBA;
    const totalWithShipping = subtotal + shippingCost;

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setShippingAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleResendVerification = async () => {
        setResendState('loading');
        try {
            await OrderApiRepository.resendVerificationEmail(user?.email);
            setResendState('sent');
        } catch (err) {
            setResendState('error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setUserNotVerified(false);
        setResendState('idle');

        if (!isArgentina) {
            setError('Por el momento solo realizamos envíos dentro de Argentina.');
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
                window.location.href = order.paymentUrl;
            } else {
                navigate(`/payment-confirmation/${order.orderId}`);
            }
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('user is not verified')) {
                setUserNotVerified(true);
            } else {
                setError(msg || 'Error al crear la orden');
            }
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

            {/* Generic error */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Unverified user error with resend flow */}
            {userNotVerified && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 p-5 rounded-lg mb-6">
                    <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-base">
                                Error al procesar la orden: el usuario no tiene el email verificado.
                            </p>
                            <p className="text-sm mt-1 text-amber-700">
                                Debes verificar tu email para poder completar la compra.
                            </p>
                        </div>
                    </div>

                    {resendState !== 'sent' && (
                        <button
                            id="resend-verification-btn"
                            onClick={handleResendVerification}
                            disabled={resendState === 'loading'}
                            className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            {resendState === 'loading'
                                ? 'Enviando...'
                                : '📧 Reenviar código de verificación de email'}
                        </button>
                    )}

                    {resendState === 'sent' && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-green-800 bg-green-50 border border-green-300 p-3 rounded-lg">
                            <span className="text-lg">✅</span>
                            <p>
                                <strong>¡Email enviado!</strong> Ingresa a tu casilla de correo electrónico
                                para verificar tu email y vuelve a intentar procesar el pago.
                            </p>
                        </div>
                    )}

                    {resendState === 'error' && (
                        <p className="mt-2 text-sm text-red-600">
                            No se pudo reenviar el email. Por favor, intentá nuevamente.
                        </p>
                    )}
                </div>
            )}

            {!isArgentina && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-6">
                    <strong>Aviso:</strong> Actualmente solo realizamos envíos dentro de Argentina.
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
                                {isCordoba
                                    ? '📱 WhatsApp - Coordinación directa con el vendedor'
                                    : '📦 Envío a domicilio vía Send'}
                            </p>
                            {shippingAddress.zipCode && (
                                <p className="text-xs text-gray-500 mt-1">
                                    CP: {shippingAddress.zipCode}
                                    {isCordoba
                                        ? ' (Córdoba Capital)'
                                        : ' (Envío nacional)'}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-6"
                            disabled={loading || !isArgentina}
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

                        <div className="border-t border-gray-300 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Envío {isCordoba ? '(Córdoba Capital)' : '(Nacional)'}</span>
                                {isFreeShipping ? (
                                    <span className="text-green-600 font-medium">¡Gratis!</span>
                                ) : (
                                    <span>{formatCurrency(shippingCost)}</span>
                                )}
                            </div>
                            {isFreeShipping && (
                                <p className="text-xs text-green-600">
                                    🎉 ¡Envío gratis por compras superiores a {formatCurrency(SHIPPING_COSTS.FREE_SHIPPING_LIMIT)}!
                                </p>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span>{formatCurrency(totalWithShipping)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
