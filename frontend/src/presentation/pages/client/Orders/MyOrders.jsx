import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiPackage, FiSearch, FiCalendar, FiFilter, FiX, FiTruck,
    FiCheckCircle, FiClock, FiShoppingBag, FiChevronRight, FiAlertCircle,
    FiCreditCard, FiDollarSign
} from 'react-icons/fi';
import OrderApiRepository from '../../../../infrastructure/api/OrderApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';

// ── Helpers ────────────────────────────────────────────────────────────────────
const SHIPPING_STATUSES = ['Todos', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];

const shippingBadge = (status) => {
    const map = {
        Pending:   { bg: 'bg-amber-100',   text: 'text-amber-700',  label: 'Pendiente',   icon: <FiClock size={12} /> },
        Shipped:   { bg: 'bg-blue-100',    text: 'text-blue-700',   label: 'Enviado',     icon: <FiTruck size={12} /> },
        Delivered: { bg: 'bg-green-100',   text: 'text-green-700',  label: 'Entregado',   icon: <FiCheckCircle size={12} /> },
        Cancelled: { bg: 'bg-red-100',     text: 'text-red-700',    label: 'Cancelado',   icon: <FiX size={12} /> },
    };
    const s = map[status] || map.Pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            {s.icon} {s.label}
        </span>
    );
};

const paymentBadge = (status) => {
    const map = {
        Paid:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Pagado',   icon: <FiCheckCircle size={12} /> },
        Pending: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pago pend.', icon: <FiClock size={12} /> },
        Failed:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Pago fallido', icon: <FiAlertCircle size={12} /> },
    };
    const s = map[status] || map.Pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            {s.icon} {s.label}
        </span>
    );
};

const shippingMethodLabel = (method) =>
    method === 'Send' ? '📦 Envío a domicilio' : '💬 WhatsApp / Retiro';

const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Order Row Card ─────────────────────────────────────────────────────────────
const OrderCard = ({ order, onClick }) => {
    const itemCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
    const shippingStatus = order.shippingStatus || order.shipping_status || 'Pending';
    const paymentStatus = order.status || 'Pending';

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-black hover:shadow-md transition-all duration-200 group"
        >
            {/* Left icon */}
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                <FiShoppingBag className="text-gray-800" size={20} />
            </div>

            {/* Order info */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-700 truncate">
                        #{(order.orderId || order.order_id || '').slice(-10)}
                    </span>
                    {paymentBadge(paymentStatus)}
                    {paymentStatus === 'Paid' && shippingBadge(shippingStatus)}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <FiCalendar size={11} /> {fmtDate(order.createdAt || order.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                        <FiPackage size={11} /> {itemCount} producto{itemCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Right: total + arrow */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                    <p className="font-bold text-gray-800">{fmt(order.totalAmount || order.total_amount || 0)}</p>
                    <p className="text-xs text-gray-400">{shippingMethodLabel(order.shippingMethod || order.shipping_method)}</p>
                </div>
                <FiChevronRight className="text-gray-300 group-hover:text-black transition-colors" size={20} />
            </div>
        </div>
    );
};

export const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [shippingFilter, setShippingFilter] = useState('Todos');
    const [searchId, setSearchId] = useState('');

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const ordersData = await OrderApiRepository.getUserOrders();
            
            if (!ordersData || ordersData.length === 0) {
                setOrders([]);
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
    }, []);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Client-side filtering
    const filtered = orders.filter(o => {
        let matches = true;

        if (shippingFilter !== 'Todos') {
            const status = o.shippingStatus || o.shipping_status;
            if (status !== shippingFilter) matches = false;
        }

        if (searchId) {
            const idStr = String(o.orderId || o.order_id || '').toLowerCase();
            if (!idStr.includes(searchId.toLowerCase())) matches = false;
        }

        if (dateFrom) {
            if (new Date(o.createdAt || o.created_at) < new Date(dateFrom)) matches = false;
        }

        if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            if (new Date(o.createdAt || o.created_at) > end) matches = false;
        }

        return matches;
    });

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setShippingFilter('Todos');
        setSearchId('');
    };

    const hasFilters = dateFrom || dateTo || shippingFilter !== 'Todos' || searchId;

    // Stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Pending').length,
        shipped: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Shipped').length,
        delivered: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Delivered').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                            <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                                <FiShoppingBag className="text-white" size={20} />
                            </span>
                            Mis Compras
                        </h1>
                        <p className="text-gray-500 mt-1 ml-1">Historial de todas tus órdenes realizadas</p>
                    </div>
                </div>

                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <FiAlertCircle className="text-red-400 mx-auto mb-2" size={32} />
                        <p className="text-red-700 font-medium">Error al cargar las compras</p>
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                        <button onClick={loadOrders} className="mt-3 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors">
                            Reintentar
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                        <FiShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No tenés compras aún</h3>
                        <p className="text-gray-500 mb-6">Tus pedidos aparecerán en esta sección una vez que realices una compra.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
                        >
                            Ir a la tienda
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'Total compras', value: stats.total, color: 'text-gray-800', bg: 'bg-white' },
                                { label: 'En preparación', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'En camino', value: stats.shipped, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Entregadas', value: stats.delivered, color: 'text-green-600', bg: 'bg-green-50' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} className={`${bg} rounded-xl p-4 border border-gray-100 shadow-sm`}>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{label}</p>
                                    <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
                            {/* Search Bar */}
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={searchId}
                                        onChange={e => setSearchId(e.target.value)}
                                        placeholder="Buscar por ID de orden..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all font-mono"
                                    />
                                    {searchId && (
                                        <button
                                            onClick={() => setSearchId('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 items-end pt-4 border-t border-gray-100">
                                {/* Date from */}
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Desde</label>
                                    <div className="relative">
                                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={e => setDateFrom(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                {/* Date to */}
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Hasta</label>
                                    <div className="relative">
                                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={e => setDateTo(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                {/* Shipping status */}
                                <div className="flex-1 min-w-[160px]">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Estado</label>
                                    <div className="relative">
                                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <select
                                            value={shippingFilter}
                                            onChange={e => setShippingFilter(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white transition-all appearance-none"
                                        >
                                            {SHIPPING_STATUSES.map(s => (
                                                <option key={s} value={s}>
                                                    {s === 'Todos' ? 'Todos los estados' : s === 'Pending' ? 'Pendiente' : s === 'Shipped' ? 'Enviado' : s === 'Delivered' ? 'Entregado' : 'Cancelado'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {/* Clear */}
                                {hasFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-black border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <FiX size={14} /> Limpiar
                                    </button>
                                )}
                                {/* Result count */}
                                <div className="text-sm font-semibold text-gray-500 whitespace-nowrap py-2 ml-auto">
                                    {filtered.length} orden{filtered.length !== 1 ? 'es' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Order List */}
                        {filtered.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <FiSearch className="mx-auto mb-3 text-gray-300" size={40} />
                                <p className="font-bold text-gray-600">No se encontraron compras</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Probá ajustando los filtros de búsqueda
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map(order => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
