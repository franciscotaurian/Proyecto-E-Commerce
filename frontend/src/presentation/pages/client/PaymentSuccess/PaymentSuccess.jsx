import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import OrderApiRepository from '../../../../infrastructure/api/OrderApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';

export const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [whatsappLoading, setWhatsappLoading] = useState(false);

    // MercadoPago redirects with these query params
    const orderId = searchParams.get('external_reference');
    const paymentStatus = searchParams.get('status');

    useEffect(() => {
        if (orderId) {
            loadOrder();
        } else {
            setLoading(false);
            setError('No se encontró referencia de orden en la URL.');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const orderData = await OrderApiRepository.getOrderById(orderId);
            setOrder(orderData);
        } catch (err) {
            console.error('Error loading order:', err);
            setError('No se pudo cargar la información de la orden.');
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppNotify = async () => {
        try {
            setWhatsappLoading(true);
            const whatsappUrl = await OrderApiRepository.sendWhatsAppNotification(orderId);
            if (whatsappUrl) {
                window.open(whatsappUrl, '_blank');
            }
        } catch (err) {
            console.error('Error sending WhatsApp notification:', err);
            alert('Error al generar el enlace de WhatsApp. Intenta de nuevo.');
        } finally {
            setWhatsappLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="text-6xl mb-6">⚠️</div>
                <h1 className="text-2xl font-bold mb-4">{error}</h1>
                <button
                    onClick={() => navigate('/my-orders')}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Ir a Mis Compras
                </button>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const userName = user?.getFullName?.() || user?.firstName || 'Cliente';

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            {/* Success Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-3">
                    ¡Felicidades {userName}!
                </h1>
                <p className="text-xl text-gray-600">
                    Tu orden <span className="font-semibold text-black">#{order.orderId}</span> fue procesada con éxito
                </p>
            </div>

            {/* Order Detail Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h2 className="font-bold text-xl mb-4">Detalle de la Orden</h2>

                {/* Products */}
                <div className="space-y-4 mb-6">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                            <img
                                src={item.productImage || 'https://via.placeholder.com/80x80?text=Img'}
                                alt={item.productName}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/80x80?text=Img';
                                }}
                            />
                            <div className="flex-1">
                                <h3 className="font-semibold">{item.productName}</h3>
                                <div className="text-sm text-gray-600 mt-1">
                                    {item.color && <span>Color: {item.color}</span>}
                                    {item.color && item.size && <span className="mx-2">|</span>}
                                    {item.size && <span>Talle: {item.size}</span>}
                                </div>
                                <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">{formatCurrency(item.getSubtotal())}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(item.price)} c/u</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-3">📍 Dirección de Envío</h3>
                <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-medium">{order.shippingAddress.street} {order.shippingAddress.number}</p>
                    {order.shippingAddress.floor && <p>Piso: {order.shippingAddress.floor}</p>}
                    {order.shippingAddress.apartment && <p>Dpto: {order.shippingAddress.apartment}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                    {order.shippingAddress.zipCode && <p>CP: {order.shippingAddress.zipCode}</p>}
                    <p>{order.shippingAddress.country}</p>
                </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-2">📦 Método de Envío</h3>
                <p className="text-sm text-gray-700">
                    {order.shippingMethod === 'Whatsapp' ? '📱 WhatsApp - Retiro en persona' : '📦 Envío Send'}
                </p>
            </div>

            {/* WhatsApp Action */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
                <h3 className="font-bold mb-2 text-green-800">Notificar al Vendedor por WhatsApp</h3>
                <p className="text-sm text-green-700 mb-4">
                    Enviá un mensaje al vendedor con el detalle de tu compra para coordinar el envío
                </p>
                <button
                    onClick={handleWhatsAppNotify}
                    disabled={whatsappLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    {whatsappLoading ? 'Generando enlace...' : 'Enviar por WhatsApp'}
                </button>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={() => navigate(`/orders/${orderId}`)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    Ver Detalle Completo
                </button>
                <button
                    onClick={() => navigate('/my-orders')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    Ir a Mis Compras
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                    Seguir Comprando
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccess;
