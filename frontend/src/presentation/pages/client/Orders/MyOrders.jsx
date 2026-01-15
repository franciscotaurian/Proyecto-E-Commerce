import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderApiRepository from '../../../../infrastructure/api/OrderApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import { formatCurrency, formatDate } from '../../../../shared/utils/formatCurrency.js';

export const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const ordersData = await OrderApiRepository.getUserOrders();
            // Sort by creation date (newest first)

            if (ordersData.length === 0) {
                setOrders([]);
                console.log('No se encontraron órdenes');
                setError('No se encontraron órdenes');
                return;
            }
            const sortedOrders = ordersData.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setOrders(sortedOrders);
        } catch (err) {
            console.error('Error loading orders:', err);
            setError('No se pudieron cargar las órdenes. Por favor, intenta de nuevo.');
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
            'Pending': 'Pendiente',
            'Failed': 'Fallido',
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

    const handleOrderClick = (orderId) => {
        navigate(`/orders/${orderId}`);
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
                <h1 className="text-3xl font-bold mb-8">Mis Compras</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadOrders}
                        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Mis Compras</h1>

            {orders.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-400 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                        No tienes compras aún
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Cuando realices una compra, aparecerá aquí
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Explorar Productos
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => handleOrderClick(order.id)}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">
                                        Orden #{order.orderId}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(order.createdAt)}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 mt-3 md:mt-0">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium text-center ${getPaymentStatusColor(
                                            order.status
                                        )}`}
                                    >
                                        {getPaymentStatusText(order.status)}
                                    </span>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium text-center ${getShippingStatusColor(
                                            order.shippingStatus
                                        )}`}
                                    >
                                        Envío: {getShippingStatusText(order.shippingStatus)}
                                    </span>
                                </div>
                            </div>

                            {/* Product Images Gallery */}
                            {order.items.length > 0 && (
                                <div className="mb-4 overflow-x-auto">
                                    <div className="flex gap-3 pb-2">
                                        {order.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex-shrink-0 relative"
                                            >
                                                <img
                                                    src={item.productImage || 'https://via.placeholder.com/80x80?text=No+Image'}
                                                    alt={item.productName}
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                                                    }}
                                                />
                                                {item.quantity > 1 && (
                                                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                                                        {item.quantity}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-4 mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Productos:
                                </h4>
                                <ul className="space-y-1">
                                    {order.items.map((item, index) => (
                                        <li key={index} className="text-sm text-gray-600">
                                            • {item.productName}
                                            {item.color && ` - ${item.color}`}
                                            {item.size && ` - Talle ${item.size}`}
                                            {' '}(x{item.quantity}) - {formatCurrency(item.price)}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500">Total</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(order.totalAmount)}
                                    </p>
                                </div>
                                <div className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                                    <span className="text-sm font-medium mr-2">Ver detalle</span>
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;
