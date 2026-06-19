import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import OrderApiRepository from '../../../../infrastructure/api/OrderApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import Button from '../../../components/common/Button.jsx';
import { formatCurrency, formatDateTime } from '../../../../shared/utils/formatCurrency.js';

export const PaymentConfirmation = () => {
    const { orderId: pathOrderId } = useParams();
    const [searchParams] = useSearchParams();
    // MercadoPago sends the order ID as ?external_reference when redirecting directly to frontend
    const orderId = pathOrderId || searchParams.get('external_reference');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notified, setNotified] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            const orderData = await OrderApiRepository.getOrderById(orderId);
            setOrder(orderData);
        } catch (error) {
            console.error('Error loading order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppNotify = async () => {
        try {
            await OrderApiRepository.sendWhatsAppNotification(orderId);
            setNotified(true);
            alert('Vendedor notificado exitosamente');
        } catch (error) {
            alert('Error al notificar al vendedor');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold">Orden no encontrada</h1>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <div className="text-center mb-8">
                <div className="text-6xl mb-4">✓</div>
                <h1 className="text-3xl font-bold mb-2">¡Pago Confirmado!</h1>
                <p className="text-gray-600">Orden #{order.orderId}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h2 className="font-bold text-xl mb-4">Resumen de la Orden</h2>

                <div className="space-y-3 mb-6">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
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
                        <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-2">Dirección de Envío</h3>
                <p className="text-sm">{order.shippingAddress.toString()}</p>
            </div>

            {order.isWhatsAppShipping() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <h3 className="font-bold mb-2">Envío por WhatsApp</h3>
                    <p className="text-sm mb-4">
                        Haz clic en el botón para notificar al vendedor sobre tu compra
                    </p>
                    <Button
                        onClick={handleWhatsAppNotify}
                        disabled={notified}
                        className="w-full"
                    >
                        {notified ? 'Vendedor Notificado ✓' : 'Notificar al Vendedor'}
                    </Button>
                </div>
            )}

            {order.isSendShipping() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <h3 className="font-bold mb-2">Envío por Send</h3>
                    <p className="text-sm">
                        Tu pago fue confirmado. Recibirás un correo electrónico con la información de tu envío.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PaymentConfirmation;
