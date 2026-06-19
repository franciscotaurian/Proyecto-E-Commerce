import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import OrderApiRepository from '../../../../infrastructure/api/OrderApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import { formatCurrency, formatDate } from '../../../../shared/utils/formatCurrency.js';

export const OrderDetail = () => {
    const { orderId: pathOrderId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // MercadoPago redirects can append success/pending/failure as the path ID
    const isInvalidPathId = ['success', 'pending', 'failure'].includes(pathOrderId);
    const orderId = isInvalidPathId ? searchParams.get('external_reference') : (pathOrderId || searchParams.get('external_reference'));

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            setError(null);
            const orderData = await OrderApiRepository.getOrderById(orderId);
            setOrder(orderData);
        } catch (err) {
            console.error('Error loading order:', err);
            setError('No se pudo cargar la orden. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const getPaymentStatusColor = (status) => {
        const statusMap = {
            'Paid': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Failed': 'bg-red-100 text-red-800',
            'Cancelled': 'bg-gray-100 text-gray-800',
        };
        return statusMap[status] || 'bg-gray-100 text-gray-800';
    };

    const getShippingStatusColor = (status) => {
        const statusMap = {
            'Pending': 'bg-gray-100 text-gray-800',
            'Processing': 'bg-blue-100 text-blue-800',
            'Shipped': 'bg-blue-100 text-blue-800',
            'Delivered': 'bg-green-100 text-green-800',
        };
        return statusMap[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusText = (status) => {
        const statusMap = {
            'Paid': 'Pagado',
            'Pending': 'Pendiente de Pago',
            'Failed': 'Pago Fallido',
            'Cancelled': 'Cancelado',
        };
        return statusMap[status] || status;
    };

    const getShippingStatusText = (status) => {
        const statusMap = {
            'Pending': 'Pendiente',
            'Processing': 'Procesando',
            'Shipped': 'Enviado',
            'Delivered': 'Entregado',
        };
        return statusMap[status] || status;
    };

    const handleContactSupport = () => {
        const supportPhone = import.meta.env.VITE_SUPPORT_PHONE;
        window.open(`https://wa.me/${supportPhone}`, '_blank');
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
            <div className="container mx-auto px-4 py-12">
                <button
                    onClick={() => navigate('/my-orders')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a Mis Compras
                </button>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadOrder}
                        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Back Button */}
            <button
                onClick={() => navigate('/my-orders')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a Mis Compras
            </button>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Orden #{order.orderId}</h1>
                <p className="text-gray-500">Realizada el {formatDate(order.createdAt)}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Estado de la Orden</h2>
                        <div className="flex flex-wrap gap-3">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Estado de Pago</p>
                                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(order.status)}`}>
                                    {getPaymentStatusText(order.status)}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Estado de Envío</p>
                                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getShippingStatusColor(order.shippingStatus)}`}>
                                    {getShippingStatusText(order.shippingStatus)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Button if Pending */}
                        {order.status === 'Pending' && order.paymentUrl && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <a
                                    href={order.paymentUrl}
                                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Completar Pago
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Products Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Productos</h2>
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                                    <img
                                        src={item.productImage || 'https://via.placeholder.com/100x100?text=No+Image'}
                                        alt={item.productName}
                                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                                        }}
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">{item.productName}</h3>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            {item.color && <p>Color: {item.color}</p>}
                                            {item.size && <p>Talle: {item.size}</p>}
                                            <p>Cantidad: {item.quantity}</p>
                                            <p className="font-medium text-gray-900">
                                                Precio unitario: {formatCurrency(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold">{formatCurrency(item.getSubtotal())}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Dirección de Envío</h2>
                        <div className="text-gray-700">
                            <p className="font-medium">{order.shippingAddress.street} {order.shippingAddress.number}</p>
                            {order.shippingAddress.floor && (
                                <p>Piso: {order.shippingAddress.floor}</p>
                            )}
                            {order.shippingAddress.apartment && (
                                <p>Dpto: {order.shippingAddress.apartment}</p>
                            )}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                            <p>{order.shippingAddress.country}</p>
                            {order.shippingAddress.zipCode && (
                                <p>CP: {order.shippingAddress.zipCode}</p>
                            )}
                        </div>
                    </div>

                    {/* Shipping Method */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Método de Envío</h2>
                        <p className="text-gray-700">
                            {order.shippingMethod === 'Whatsapp' ? '📱 WhatsApp - Coordinación directa con el vendedor' : '📦 Envío a domicilio vía Send'}
                        </p>
                    </div>
                </div>

                {/* Sidebar - Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
                        <h2 className="text-xl font-semibold mb-4">Resumen del Pedido</h2>

                        <div className="space-y-3 mb-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {item.productName} (x{item.quantity})
                                    </span>
                                    <span className="font-medium">{formatCurrency(item.getSubtotal())}</span>
                                </div>
                            ))}
                        </div>

                         <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                            {order.shippingCost > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Envío</span>
                                    <span>{formatCurrency(order.shippingCost)}</span>
                                </div>
                            )}
                            {order.shippingCost === 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Envío</span>
                                    <span className="font-medium">¡Gratis!</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold">Total</span>
                                <span className="text-2xl font-bold">{formatCurrency(order.totalAmount)}</span>
                            </div>
                        </div>

                        {/* Contact Support */}
                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-sm text-gray-600 mb-3">¿Necesitas ayuda con tu orden?</p>
                            <button
                                onClick={handleContactSupport}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Contactar Soporte
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
