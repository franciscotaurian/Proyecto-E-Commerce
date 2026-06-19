import React, { useState, useEffect, useCallback } from 'react';
import {
    FiPackage, FiSearch, FiCalendar, FiFilter, FiX, FiTruck,
    FiCheckCircle, FiClock, FiUser, FiShoppingBag,
    FiChevronRight, FiSave, FiRefreshCw, FiAlertCircle,
    FiTrendingUp, FiFileText, FiShield, FiRotateCcw
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
    const [trackId, setTrackId] = useState(
        order.shippedTrackId || order.shipped_track_id
        || order.shipping_info?.shipped_track_id || ''
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [isModifyingTrackId, setIsModifyingTrackId] = useState(false);

    const shippingMethod = order.shippingMethod || order.shipping_method;
    const isWhatsApp = shippingMethod === 'Whatsapp';
    const currentStatus = order.shippingStatus || order.shipping_status;
    const rawTrackId = order.shippedTrackId || order.shipped_track_id
        || order.shipping_info?.shipped_track_id || '';

    useEffect(() => { setTrackId(rawTrackId); }, [rawTrackId]);

    const handleSaveTrack = async () => {
        if (!trackId.trim()) { setError('Ingresá el Track ID antes de guardar.'); return; }
        setError('');
        try {
            setSaving(true);
            await orderApi.updateShippingTrackId(order.id, trackId.trim());
            setSaved(true);
            setIsModifyingTrackId(false);
            onTrackIdSaved();
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkAsDelivered = async () => {
        setError('');
        try {
            setSaving(true);
            await orderApi.updateShippingStatus(order.id, 'Delivered');
            setSaved(true);
            onTrackIdSaved();
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const addr = order.shippingAddress || order.shipping_info?.shipping_address || {};
    const addressStr = addr
        ? [addr.street, addr.number, addr.floor && `Piso ${addr.floor}`, addr.apartment && `Dto ${addr.apartment}`, addr.city, addr.province, addr.country].filter(Boolean).join(', ')
        : '—';

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in relative">
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
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <FiPackage size={14} className="text-black" />
                            <span className="font-medium">Estado pago:</span>
                            <span className="font-semibold text-green-600">{order.status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <FiTruck size={14} className="text-black" />
                            <span className="font-medium">Envío:</span>
                            {shippingBadge(currentStatus)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <FiCalendar size={14} className="text-black" />
                            <span>{fmtDate(order.createdAt || order.created_at)}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                            {shippingMethodLabel(shippingMethod)}
                        </div>
                        <p className="text-sm text-gray-600">{addressStr}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FiShoppingBag size={14} className="text-gray-500" /> Productos
                        </h3>
                        <div className="space-y-2">
                            {(order.items || []).map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
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
                                Total: <span className="text-black">{fmt(order.totalAmount || order.total_amount || 0)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FiTruck size={14} /> Gestión de Envío
                        </h3>
                        
                        {!isWhatsApp && (
                            <div className="mb-4">
                                {rawTrackId && !isModifyingTrackId ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
                                            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Track ID:</span>
                                            <span className="font-mono font-bold text-black">{rawTrackId}</span>
                                        </div>
                                        <button
                                            onClick={() => setIsModifyingTrackId(true)}
                                            className="px-3 py-2 text-sm font-semibold text-black border border-gray-300 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            Modificar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={trackId}
                                            onChange={e => setTrackId(e.target.value)}
                                            placeholder="Ingresá el Track ID..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all font-mono"
                                        />
                                        <button
                                            onClick={handleSaveTrack}
                                            disabled={saving}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors flex-shrink-0 ${
                                                saved ? 'bg-green-500' : saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                                            }`}
                                        >
                                            {saved ? <FiCheckCircle size={15} /> : <FiSave size={15} />}
                                            {saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                        {isModifyingTrackId && (
                                            <button
                                                onClick={() => {
                                                    setIsModifyingTrackId(false);
                                                    setTrackId(rawTrackId);
                                                    setError('');
                                                }}
                                                className="px-3 py-2 text-sm font-semibold text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStatus !== 'Delivered' && (
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={handleMarkAsDelivered}
                                    disabled={saving}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${
                                        saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    <FiCheckCircle size={15} />
                                    Marcar como Entregado
                                </button>
                                <span className="text-xs text-gray-400">
                                    Actualiza el estado de la orden a Entregado.
                                </span>
                            </div>
                        )}

                        {error && (
                            <p className="mt-3 text-xs text-red-600 flex items-center gap-1">
                                <FiAlertCircle size={12} /> {error}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Order Row Card ─────────────────────────────────────────────────────────────
const OrderCard = ({ order, onClick, isFetching }) => {
    const itemCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
    const shippingStatus = order.shippingStatus || order.shipping_status || 'Pending';

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-black hover:shadow-md transition-all duration-200 group"
        >
            {/* Left icon */}
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                <FiShoppingBag className="text-black" size={20} />
            </div>

            {/* Order info */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-bold text-black truncate">
                        #{(order.orderId || order.order_id || '').slice(-10)}
                    </span>
                    {shippingBadge(shippingStatus)}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                        <FiCalendar size={12} /> {fmtDate(order.createdAt || order.created_at)}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                        {itemCount} producto{itemCount !== 1 ? 's' : ''}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                        <FiUser size={12} /> {order.userId || order.user_id || '—'}
                    </span>
                </div>
            </div>

            {/* Right: total + arrow */}
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                    <p className="font-bold text-black text-sm">{fmt(order.totalAmount || order.total_amount || 0)}</p>
                    <p className="text-xs text-gray-500 flex items-center justify-end gap-1 font-medium mt-0.5">
                        {order.shippingMethod === 'Whatsapp' || order.shipping_method === 'Whatsapp' ? <FiPackage size={10} /> : <FiPackage size={10} />}
                        {shippingMethodLabel(order.shippingMethod || order.shipping_method).replace('📦 ', '').replace('💬 ', '')}
                    </p>
                </div>
                {isFetching ? (
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-black rounded-full animate-spin ml-1" />
                ) : (
                    <FiChevronRight className="text-gray-400 group-hover:text-black transition-colors" size={20} />
                )}
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
    const [fetchingDetailsId, setFetchingDetailsId] = useState(null);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [shippingFilter, setShippingFilter] = useState('Todos');
    const [searchId, setSearchId] = useState('');

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

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchId.trim()) {
            fetchOrders();
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            const order = await orderApi.getAdminOrderById(searchId.trim());
            setOrders(order ? [order] : []);
        } catch (err) {
            setError('No se encontró ninguna orden con ese ID o hubo un error.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (orderToView) => {
        const id = orderToView.id || orderToView.orderId || orderToView.order_id;
        if (!id) return;
        
        setFetchingDetailsId(id);
        try {
            const fullOrder = await orderApi.getAdminOrderById(id);
            setSelectedOrder(fullOrder);
        } catch (err) {
            setError('Error al obtener los detalles de la orden: ' + err.message);
        } finally {
            setFetchingDetailsId(null);
        }
    };

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filtered = orders.filter(o => {
        if (shippingFilter === 'Todos') return true;
        return (o.shippingStatus || o.shipping_status) === shippingFilter;
    });

    const handleTrackSaved = () => {
        fetchOrders();
    };

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setShippingFilter('Todos');
        if (searchId) {
            setSearchId('');
            setTimeout(() => fetchOrders(), 0);
        }
    };

    const hasFilters = dateFrom || dateTo || shippingFilter !== 'Todos' || searchId;

    const stats = {
        total: orders.length,
        pending: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Pending').length,
        shipped: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Shipped').length,
        delivered: orders.filter(o => (o.shippingStatus || o.shipping_status) === 'Delivered').length,
        revenue: orders.reduce((s, o) => s + (o.totalAmount || o.total_amount || 0), 0),
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
                            <FiTrendingUp className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-black">Gestión de Ventas</h1>
                            <p className="text-gray-500 text-sm font-medium">Órdenes pagadas y confirmadas</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-black hover:bg-gray-50 text-sm font-bold shadow-sm transition-colors self-start"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <FiFileText className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Total órdenes</p>
                            <p className="text-2xl font-black text-black leading-tight">{stats.total}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Todas las órdenes</p>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <FiClock className="text-amber-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Pendientes de envío</p>
                            <p className="text-2xl font-black text-black leading-tight">{stats.pending}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Por despachar</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <FiTruck className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Enviados</p>
                            <p className="text-2xl font-black text-black leading-tight">{stats.shipped}</p>
                            <p className="text-[10px] text-gray-400 font-medium">En camino</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                            <FiCheckCircle className="text-green-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Entregados</p>
                            <p className="text-2xl font-black text-black leading-tight">{stats.delivered}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Completados</p>
                        </div>
                    </div>
                </div>

                {/* Revenue banner */}
                <div className="bg-[#111111] rounded-xl p-8 mb-6 flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-300 text-sm font-bold uppercase tracking-wide mb-1">Facturación total (período)</p>
                        <p className="text-white text-4xl font-black tracking-tight">{fmt(stats.revenue)}</p>
                        <p className="text-gray-400 text-xs font-medium mt-2">Ingresos generados en el período seleccionado</p>
                    </div>
                    {/* Abstract Line Chart SVG Background */}
                    <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-30 pointer-events-none">
                        <svg viewBox="0 0 400 100" className="w-full h-full preserve-aspect-ratio-none">
                            <path d="M0,80 Q50,90 100,50 T200,40 T300,70 T400,20" fill="none" stroke="white" strokeWidth="3" />
                            <circle cx="400" cy="20" r="4" fill="white" />
                        </svg>
                    </div>
                    <FiPackage className="text-white opacity-10 absolute right-8 top-1/2 -translate-y-1/2" size={80} />
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-3 mb-5">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchId}
                                onChange={e => setSearchId(e.target.value)}
                                placeholder="Buscar por ID de orden..."
                                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all font-mono bg-gray-50 focus:bg-white"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <FiSearch size={16} /> Buscar
                        </button>
                        {searchId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchId('');
                                    setTimeout(() => fetchOrders(), 0);
                                }}
                                className="px-4 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FiX size={18} />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap gap-4 items-end pt-5 border-t border-gray-100">
                        {/* Date from */}
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Desde</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all bg-white"
                                />
                            </div>
                        </div>
                        {/* Date to */}
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Hasta</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all bg-white"
                                />
                            </div>
                        </div>
                        {/* Shipping status */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Estado de envío</label>
                            <div className="relative">
                                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <select
                                    value={shippingFilter}
                                    onChange={e => setShippingFilter(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white transition-all appearance-none"
                                >
                                    {SHIPPING_STATUSES.map(s => (
                                        <option key={s} value={s}>
                                            {s === 'Todos' ? 'Todos los estados' : s === 'Pending' ? 'Pendiente' : s === 'Shipped' ? 'Enviado' : s === 'Delivered' ? 'Entregado' : 'Cancelado'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 ml-auto">
                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors"
                                >
                                    Limpiar
                                </button>
                            )}
                            {/* Result count */}
                            <div className="text-sm font-semibold text-gray-400 whitespace-nowrap">
                                {filtered.length} orden{filtered.length !== 1 ? 'es' : ''}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3" />
                        <span className="text-sm font-bold">Cargando órdenes...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <FiAlertCircle className="text-red-500 mx-auto mb-2" size={32} />
                        <p className="text-red-700 font-bold">Error al cargar las órdenes</p>
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                        <button onClick={fetchOrders} className="mt-4 px-6 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
                            Reintentar
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <FiSearch className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="font-bold text-gray-800 text-lg">No hay órdenes para mostrar</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {hasFilters ? 'Probá con otros filtros' : 'Aún no hay ventas confirmadas'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 mb-8">
                        {filtered.map(order => {
                            const orderId = order.id || order.orderId || order.order_id;
                            return (
                                <OrderCard
                                    key={orderId}
                                    order={order}
                                    onClick={() => handleViewDetails(order)}
                                    isFetching={fetchingDetailsId === orderId}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Bottom Info Bar */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        <div className="flex items-center gap-4 p-6">
                            <FiTruck className="text-gray-800" size={24} />
                            <div>
                                <h4 className="font-bold text-sm tracking-wide text-black">Envío gratis</h4>
                                <p className="text-xs text-gray-500 mt-0.5">En compras superiores a $50.000</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-6">
                            <FiShield className="text-gray-800" size={24} />
                            <div>
                                <h4 className="font-bold text-sm tracking-wide text-black">Pago seguro</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Tus datos siempre protegidos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-6">
                            <FiRotateCcw className="text-gray-800" size={24} />
                            <div>
                                <h4 className="font-bold text-sm tracking-wide text-black">Devolución garantizada</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Hasta 30 días después de la compra</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Modal */}
                {selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        onTrackIdSaved={handleTrackSaved}
                    />
                )}
            </div>
        </div>
    );
};

export default SalesManagement;
