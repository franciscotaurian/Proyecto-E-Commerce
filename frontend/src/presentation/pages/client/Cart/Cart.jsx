import React, { useState, useEffect } from 'react';
import { useCart } from '../../../hooks/useCart.js';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { PLACEHOLDER_IMAGE } from '../../../../shared/utils/constants.js';
import Spinner from '../../../components/common/Spinner.jsx';
import ProductApiRepository from '../../../../infrastructure/api/ProductApiRepository.js';

export const Cart = () => {
    const { cart, loading, updateCartItem, removeFromCart, clearCart, getTotal, getItemCount, refreshCart } = useCart();
    const navigate = useNavigate();
    const [updatingItems, setUpdatingItems] = useState(new Set());
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [loadingRecommended, setLoadingRecommended] = useState(false);

    // Load cart data when component mounts
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    // Load recommended products
    useEffect(() => {
        const loadRecommendedProducts = async () => {
            try {
                setLoadingRecommended(true);
                const { products } = await ProductApiRepository.getProducts({ limit: 4 });
                setRecommendedProducts(products);
            } catch (error) {
                console.error('Error loading recommended products:', error);
            } finally {
                setLoadingRecommended(false);
            }
        };
        loadRecommendedProducts();
    }, []);

    // Handle quantity update
    const handleQuantityChange = async (item, newQuantity) => {
        if (newQuantity < 1) return;

        const itemKey = item.getUniqueKey();
        setUpdatingItems(prev => new Set([...prev, itemKey]));

        try {
            await updateCartItem(item.productId, {
                color: item.color,
                size: item.size,
                quantity: newQuantity,
            });
        } catch (error) {
            console.error('Error updating quantity:', error);
            alert('Error al actualizar la cantidad');
        } finally {
            setUpdatingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemKey);
                return newSet;
            });
        }
    };

    // Handle item removal
    const handleRemove = async (productId, productSize, productColor) => {
        if (!confirm('¿Estás seguro de eliminar este producto del carrito?')) return;

        try {
            await removeFromCart(productId, productSize, productColor);
        } catch (error) {
            console.error('Error removing item:', error);
            alert('Error al eliminar el producto');
        }
    };

    // Handle clear cart
    const handleClearCart = async () => {
        if (!confirm('¿Estás seguro de vaciar todo el carrito?')) return;

        try {
            await clearCart();
        } catch (error) {
            console.error('Error clearing cart:', error);
            alert('Error al vaciar el carrito');
        }
    };

    // Navigate to product detail
    const goToProduct = (productId) => {
        navigate(`/products/${productId}`);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    // Empty cart state
    if (cart.isEmpty()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md px-4">
                    <div className="mb-6">
                        <svg
                            className="mx-auto h-24 w-24 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
                    <p className="text-gray-600 mb-8">
                        Agrega productos para comenzar tu compra
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                        Explorar Productos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Carrito de Compras</h1>
                        <p className="text-gray-600">
                            {getItemCount()} {getItemCount() === 1 ? 'producto' : 'productos'}
                        </p>
                    </div>
                    {!cart.isEmpty() && (
                        <button
                            onClick={handleClearCart}
                            className="text-sm text-red-600 hover:text-red-700 font-medium underline"
                        >
                            Vaciar carrito
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.items.map((item) => {
                            const itemKey = item.getUniqueKey();
                            const isUpdating = updatingItems.has(itemKey);

                            return (
                                <div
                                    key={itemKey}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex gap-4">
                                        {/* Product Image */}
                                        <button
                                            onClick={() => goToProduct(item.productId)}
                                            className="flex-shrink-0 group"
                                        >
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={item.image || PLACEHOLDER_IMAGE}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        </button>

                                        {/* Product Info */}
                                        <div className="flex-grow min-w-0">
                                            {/* Product Name */}
                                            <button
                                                onClick={() => goToProduct(item.productId)}
                                                className="text-left hover:underline"
                                            >
                                                <h3 className="font-semibold text-lg mb-1 truncate">
                                                    {item.productName}
                                                </h3>
                                            </button>

                                            {/* Variant Info */}
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                                                <span>
                                                    <span className="font-medium">Color:</span> {item.color}
                                                </span>
                                                <span>
                                                    <span className="font-medium">Talla:</span> {item.size}
                                                </span>
                                            </div>

                                            {/* Price */}
                                            <p className="text-lg font-bold mb-3">
                                                {formatCurrency(item.price)}
                                                <span className="text-sm font-normal text-gray-600 ml-2">
                                                    c/u
                                                </span>
                                            </p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-4">
                                                {/* Quantity Selector */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                                        disabled={item.quantity <= 1 || isUpdating}
                                                        className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-12 text-center font-medium">
                                                        {isUpdating ? (
                                                            <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                                                        ) : (
                                                            item.quantity
                                                        )}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                                        disabled={isUpdating}
                                                        className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => handleRemove(item.productId, item.size, item.color)}
                                                    disabled={isUpdating}
                                                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subtotal (Desktop) */}
                                        <div className="hidden sm:block text-right">
                                            <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                                            <p className="text-xl font-bold">
                                                {formatCurrency(item.getSubtotal())}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Subtotal (Mobile) */}
                                    <div className="sm:hidden mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Subtotal</span>
                                        <span className="text-lg font-bold">
                                            {formatCurrency(item.getSubtotal())}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Resumen del pedido</h2>

                            {/* Summary Details */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Productos ({getItemCount()})
                                    </span>
                                    <span className="font-medium">
                                        {formatCurrency(getTotal())}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Envío</span>
                                    <span className="font-medium text-green-600">
                                        {getTotal() >= 50000 ? 'Gratis' : 'A calcular'}
                                    </span>
                                </div>
                                {getTotal() < 50000 && (
                                    <p className="text-xs text-gray-500">
                                        Envío gratis en compras superiores a {formatCurrency(50000)}
                                    </p>
                                )}
                            </div>

                            {/* Total */}
                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-bold">
                                        {formatCurrency(getTotal())}
                                    </span>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors mb-3"
                            >
                                Proceder al Pago
                            </button>

                            {/* Continue Shopping Button */}
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-black transition-colors"
                            >
                                Continuar Comprando
                            </button>

                            {/* Security Badge */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                    <span>Compra segura y protegida</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommended Products Section */}
                {!cart.isEmpty() && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">Productos Recomendados</h2>

                        {loadingRecommended ? (
                            <div className="flex justify-center py-12">
                                <Spinner />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {recommendedProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => navigate(`/products/${product.id}`)}
                                        className="group cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                                            <img
                                                src={product.images[0] || PLACEHOLDER_IMAGE}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {!product.isInStock() && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <span className="text-white font-bold text-sm">SIN STOCK</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-2 truncate group-hover:underline">
                                                {product.name}
                                            </h3>
                                            <p className="text-lg font-bold">
                                                {formatCurrency(product.price)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
