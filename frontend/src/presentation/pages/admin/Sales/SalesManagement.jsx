import React, { useState, useEffect, useCallback } from 'react';
import {
    FiPackage, FiSearch, FiCalendar, FiFilter, FiX, FiTruck,
    FiCheckCircle, FiClock, FiMapPin, FiUser, FiShoppingBag,
    FiChevronDown, FiSave, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';
import orderApi from '../../../../infrastructure/api/OrderApiRepository.js';

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

const shippingMethodLabel = (method) =>
    method === 'Send' ? '📦 Envío a domicilio' : '💬 WhatsApp / Retiro';

const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Order Detail Modal ─────────────────────────────────────────────────────────
const OrderDetailModal = ({ order, onClose, onTrackIdSaved }) => {
    const [trackId, setTrackId] = useState(order.shippedTrackId || order.shipped_track_id || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Prefer raw data if Order entity doesn't expose shipped_track_id
    const rawTrackId = order.shippedTrackId || order.shipped_track_id || '';

    useEffect(() => { setTrackId(rawTrackId); }, [rawTrackId]);

    const handleSaveTrack = async () => {
        if (!trackId.trim()) { setError('Ingresá el Track ID antes de guardar.'); return; }
        setError('');
        try {
            setSaving(true);
            // Use MongoDB _id (order.id) to match the route /:id
            await orderApi.updateShippingTrackId(order.id, trackId.trim());
            setSaved(true);
            onTrackIdSaved();
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const addr = order.shippingAddress;
    const addressStr = addr
        ? [addr.street, addr.number, addr.floor && `Piso ${addr.floor}`, addr.apartment && `Dto ${addr.apartment}`, addr.city, addr.province, addr.country]
              .filter(Boolean).join(', ')
        : '—';

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Detalle de Orden</h2>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono"># {order.orderId || order.order_id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Status row */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <FiPackage size={14} className="text-indigo-500" />
                            <span className="font-medium">Estado pago:</span>
                            <span className="font-semibold text-green-600">{order.status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <FiTruck size={14} className="text-indigo-500" />
                            <span className="font-medium">Envío:</span>
                            {shippingBadge(order.shippingStatus || order.shipping_status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <FiCalendar size={14} className="text-indigo-500" />
                            <span>{fmtDate(order.createdAt || order.created_at)}</span>
                        </div>
                    </div>

                    {/* Shipping method + address */}
                    <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                            <FiMapPin size={14} />
                            {shippingMethodLabel(order.shippingMethod || order.shipping_method)}
                        </div>
                        <p className="text-sm text-gray-600">{addressStr}</p>
                    </div>

                    {/* Items */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FiShoppingBag size={14} className="text-indigo-500" /> Productos
                        </h3>
                        <div className="space-y-2">
                            {(order.items || []).map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    {(item.productImage || item.image_url) && (
                                        <img
                                            src={item.productImage || item.image_url}
                                            alt={item.productName || item.product_name}
                                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">
                                            {item.productName || item.product_name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {[item.color, item.size].filter(Boolean).join(' · ')} · x{item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-gray-800 text-sm">{fmt(item.price * item.quantity)}</p>
                                        <p className="text-xs text-gray-400">{fmt(item.price)} c/u</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                            <p className="text-base font-bold text-gray-800">
                                Total: <span className="text-indigo-600">{fmt(order.totalAmount || order.total_amount || 0)}</span>
                            </p>
                        </div>
                    </div>

                    {/* Track ID */}
                    <div className="border border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50/40">
                        <h3 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                            <FiTruck size={14} /> Track ID de envío
                        </h3>
                        {rawTrackId && (
                            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                <span className="text-gray-400 text-xs">Actual:</span>
                                <span className="font-mono font-semibold text-indigo-700">{rawTrackId}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={trackId}
                                onChange={e => setTrackId(e.target.value)}
                                placeholder="Ingresá el Track ID..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
                            />
                            <button
                                onClick={handleSaveTrack}
                                disabled={saving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors flex-shrink-0 ${
                                    saved ? 'bg-green-500' : saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {saved ? <FiCheckCircle size={15} /> : <FiSave size={15} />}
                                {saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                <FiAlertCircle size={12} /> {error}
                            </p>
                        )}
                        <p className="mt-2 text-xs text-gray-400">
                            Al guardar, el estado de envío se actualizará a <strong>Enviado</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Order Row Card ─────────────────────────────────────────────────────────────
const OrderCard = ({ order, onClick }) => {
    const itemCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
    const shippingStatus = order.shippingStatus || order.shipping_status || 'Pending';

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-200 group"
        >
            {/* Left icon */}
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                <FiShoppingBag className="text-indigo-500" size={20} />
            </div>

            {/* Order info */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-700 truncate">
                        #{(order.orderId || order.order_id || '').slice(-10)}
                    </span>
                    {shippingBadge(shippingStatus)}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <FiCalendar size={11} /> {fmtDate(order.createdAt || order.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                        <FiPackage size={11} /> {itemCount} producto{itemCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                        <FiUser size={11} /> {order.userId || order.user_id || '—'}
                    </span>
                </div>
            </div>

            {/* Right: total + arrow */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                    <p className="font-bold text-gray-800">{fmt(order.totalAmount || order.total_amount || 0)}</p>
                    <p className="text-xs text-gray-400">{shippingMethodLabel(order.shippingMethod || order.shipping_method)}</p>
                </div>
                <FiChevronDown className="text-gray-300 group-hover:text-indigo-400 rotate-[-90deg] transition-colors" size={18} />
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const SalesManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [shippingFilter, setShippingFilter] = useState('Todos');

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const filters = {};
            if (dateFrom) filters.from = new Date(dateFrom).toISOString();
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                filters.to = end.toISOString();
            }
            const data = await orderApi.getAllPaidOrders(filters);
            setOrders(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Client-side shipping status filter
    const filtered = orders.filter(o => {
        if (shippingFilter === 'Todos') return true;
        return (o.shippingStatus || o.shipping_status) === shippingFilter;
    });

    const handleTrackSaved = () => {
        fetchOrders();
        // Refresh selected order from list after reload
    };

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setShippingFilter('Todos');
    };

    const hasFilters = dateFrom || dateTo || shippingFilter !== 'Todos';

    // Stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Pending').length,
        shipped: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Shipped').length,
        delivered: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Delivered').length,
        revenue: orders.reduce((s, o) => s + (o.totalAmount || o.total_amount || 0), 0),
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <FiShoppingBag className="text-white" size={20} />
                        </span>
                        Gestión de Ventas
                    </h1>
                    <p className="text-gray-500 mt-1 ml-1">Órdenes pagadas y confirmadas</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors self-start"
                >
                    <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total órdenes', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Pendientes envío', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Enviados', value: stats.shipped, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Entregados', value: stats.delivered, color: 'text-green-600', bg: 'bg-green-50' },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-xl p-4 border border-white shadow-sm`}>
                        <p className="text-xs text-gray-500 font-medium">{label}</p>
                        <p className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Revenue banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 mb-6 flex items-center justify-between shadow-md">
                <div>
                    <p className="text-indigo-100 text-sm font-medium">Facturación total (período)</p>
                    <p className="text-white text-2xl font-extrabold mt-0.5">{fmt(stats.revenue)}</p>
                </div>
                <FiPackage className="text-white/30" size={48} />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Date from */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Desde</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    {/* Date to */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Hasta</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    {/* Shipping status */}
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Estado de envío</label>
                        <div className="relative">
                            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <select
                                value={shippingFilter}
                                onChange={e => setShippingFilter(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all appearance-none"
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
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FiX size={14} /> Limpiar
                        </button>
                    )}
                    {/* Result count */}
                    <div className="text-sm text-gray-400 whitespace-nowrap py-2">
                        {filtered.length} orden{filtered.length !== 1 ? 'es' : ''}
                    </div>
                </div>
            </div>

            {/* Order List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                    <span className="text-sm">Cargando órdenes...</span>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <FiAlertCircle className="text-red-400 mx-auto mb-2" size={32} />
                    <p className="text-red-700 font-medium">Error al cargar las órdenes</p>
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                    <button onClick={fetchOrders} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                        Reintentar
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <FiSearch className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-500">No hay órdenes para mostrar</p>
                    <p className="text-sm text-gray-400 mt-1">
                        {hasFilters ? 'Probá con otros filtros' : 'Aún no hay ventas confirmadas'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(order => (
                        <OrderCard
                            key={order.id || order.orderId || order.order_id}
                            order={order}
                            onClick={() => setSelectedOrder(order)}
                        />
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onTrackIdSaved={handleTrackSaved}
                />
            )}
        </div>
    );
};

export default SalesManagement;
