import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductApiRepository from '../../../../infrastructure/api/ProductApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { PLACEHOLDER_IMAGE } from '../../../../shared/utils/constants.js';
import { CartContext } from '../../../context/CartContext.jsx';

export const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);

    // Product data and loading states
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Carousel and selection states
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    // Load product data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                const productData = await ProductApiRepository.getProductById(id);
                setProduct(productData);

                // Auto-select first available variant
                if (productData.variants && productData.variants.length > 0) {
                    const firstAvailable = productData.variants.find(v => v.available > 0);
                    if (firstAvailable) {
                        setSelectedColor(firstAvailable.color);
                        setSelectedSize(firstAvailable.size);
                    }
                }
            } catch (err) {
                console.error('Error loading product:', err);
                setError('No se pudo cargar el producto. Por favor, intenta nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Carousel navigation
    const nextImage = () => {
        if (product && product.images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
        }
    };

    const prevImage = () => {
        if (product && product.images.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
        }
    };

    // Get selected variant
    const getSelectedVariant = () => {
        if (!product || !selectedColor || !selectedSize) return null;
        return product.findVariant(selectedColor, selectedSize);
    };

    // Handle add to cart
    const handleAddToCart = async () => {
        const variant = getSelectedVariant();
        if (!variant || variant.available < quantity) return;

        try {
            setAddingToCart(true);
            await addToCart({
                product_id: product.id,
                color: selectedColor,
                size: selectedSize,
                quantity: quantity,
            });

            // Show success feedback
            alert('Producto agregado al carrito!');
        } catch (err) {
            console.error('Error adding to cart:', err);
            alert('Error al agregar al carrito. Por favor, intenta nuevamente.');
        } finally {
            setAddingToCart(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
                    <p className="text-gray-600 mb-6">{error || 'El producto que buscas no existe.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    const images = product.images.length > 0 ? product.images : [PLACEHOLDER_IMAGE];
    const selectedVariant = getSelectedVariant();
    const availableColors = product.getColors();
    const availableSizes = product.getSizes();
    const isAddToCartDisabled = !selectedVariant || selectedVariant.available < quantity || addingToCart;

    return (
        <div className="min-h-screen bg-white py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Breadcrumb */}
                <nav className="text-sm text-gray-500 mb-8 flex items-center space-x-2">
                    <span className="hover:text-black cursor-pointer" onClick={() => navigate('/')}>Inicio</span>
                    <span>&gt;</span>
                    <span className="hover:text-black cursor-pointer">Todos los productos</span>
                    <span>&gt;</span>
                    <span className="hover:text-black cursor-pointer">{product.category || 'Categoría'}</span>
                    <span>&gt;</span>
                    <span className="text-black font-medium">{product.name}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Images Section */}
                    <div className="w-full lg:w-3/5 flex flex-col-reverse md:flex-row gap-4">
                        {/* Thumbnails (Vertical on MD+) */}
                        {images.length > 1 && (
                            <div className="flex flex-row md:flex-col gap-3 w-full md:w-20 flex-shrink-0 overflow-x-auto md:overflow-visible">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-20 md:w-full aspect-[3/4] flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                                            index === currentImageIndex ? 'border-black' : 'border-transparent hover:border-gray-300'
                                        }`}
                                    >
                                        <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Main Image */}
                        <div className="relative flex-1 aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 group">
                            <img
                                src={images[currentImageIndex]}
                                alt={`${product.name}`}
                                className="w-full h-full object-cover"
                            />
                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}
                            {/* Expand icon (decorative) */}
                            <button className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-700 hover:text-black transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Product Info Section */}
                    <div className="w-full lg:w-2/5 flex flex-col">
                        {/* Nuevo Badge */}
                        <div className="mb-3">
                            <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider rounded">Nuevo</span>
                        </div>

                        {/* Title & Price */}
                        <h1 className="text-4xl font-bold mb-3">{product.name}</h1>
                        <p className="text-3xl font-bold mb-4">{formatCurrency(product.price)}</p>

                        {/* Stock Status */}
                        {product.isInStock() ? (
                            <div className="flex items-center gap-2 text-green-600 font-medium mb-8 pb-8 border-b border-gray-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                En stock
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600 font-medium mb-8 pb-8 border-b border-gray-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Sin stock
                            </div>
                        )}

                        {/* Description */}
                        <div className="mb-8">
                            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Descripción</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
                        </div>

                        {/* Color Selection */}
                        {availableColors.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                                    Color: <span className="font-normal text-gray-500 capitalize">{selectedColor}</span>
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    {availableColors.map((color) => {
                                        const hasStock = product.variants.some(v => v.color === color && v.available > 0);
                                        // Simple color mapper for common colors
                                        const colorMap = {
                                            'negro': '#111111',
                                            'blanco': '#FFFFFF',
                                            'azul': '#1E3A8A', // Navy-ish
                                            'gris': '#9CA3AF',
                                            'rojo': '#EF4444',
                                            'verde': '#10B981',
                                            'amarillo': '#F59E0B',
                                            'marron': '#78350F',
                                            'marrón': '#78350F'
                                        };
                                        const bgColor = colorMap[color.toLowerCase()] || '#E5E7EB';
                                        return (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    const firstSize = product.variants.find(v => v.color === color && v.available > 0);
                                                    if (firstSize) setSelectedSize(firstSize.size);
                                                }}
                                                disabled={!hasStock}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    selectedColor === color ? 'ring-2 ring-black ring-offset-2' : ''
                                                } ${!hasStock && 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                <div 
                                                    className="w-full h-full rounded-full border border-gray-200 shadow-sm"
                                                    style={{ backgroundColor: bgColor }}
                                                    title={color}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        {availableSizes.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                                    Talla: <span className="font-normal text-gray-500">{selectedSize}</span>
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {availableSizes.map((size) => {
                                        const variant = product.findVariant(selectedColor, size);
                                        const hasStock = variant && variant.available > 0;
                                        return (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                disabled={!hasStock}
                                                className={`min-w-[4rem] h-12 rounded border font-medium text-sm transition-all ${
                                                    selectedSize === size
                                                        ? 'border-black bg-black text-white'
                                                        : hasStock
                                                            ? 'border-gray-200 text-gray-700 hover:border-black'
                                                            : 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stock available banner */}
                        {selectedVariant && (
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center gap-3 mb-8">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <p className="text-sm text-gray-600">
                                    Disponibles: <span className="font-bold text-gray-900">{selectedVariant.available} unidades</span>
                                </p>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Cantidad</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden h-12 w-32">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                        disabled={quantity <= 1}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/></svg>
                                    </button>
                                    <span className="flex-1 text-center font-semibold text-sm">{quantity}</span>
                                    <button
                                        onClick={() => {
                                            if (selectedVariant && quantity < selectedVariant.available) {
                                                setQuantity(quantity + 1);
                                            }
                                        }}
                                        className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                        disabled={!selectedVariant || quantity >= selectedVariant.available}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddToCartDisabled}
                                className={`flex-1 h-14 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                    isAddToCartDisabled
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-black text-white hover:bg-gray-900 hover-lift'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                {addingToCart ? 'Agregando...' : 'Agregar al Carrito'}
                            </button>
                            <button className="w-14 h-14 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-black hover:text-black transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </button>
                        </div>

                    </div>
                </div>

                {/* Bottom Info Bar */}
                <div className="mt-16 bg-gray-50 rounded-2xl p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-4 justify-center md:border-r border-gray-200">
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 21h.01M16 21h.01M4 17h16M4 17V7m0 10l-1-1m1 1a2 2 0 104 0m-4 0a2 2 0 114 0m12 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0V9l-3-3h-4v11m7-11a2 2 0 00-2-2H9a2 2 0 00-2 2v1m0 0H5" /></svg>
                            <div>
                                <p className="font-semibold text-gray-900">Envío gratis en compras</p>
                                <p className="text-gray-500">superiores a $50.000</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 justify-center md:border-r border-gray-200">
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            <div>
                                <p className="font-semibold text-gray-900">Garantía de devolución</p>
                                <p className="text-gray-500">de 30 días</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 justify-center">
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <div>
                                <p className="font-semibold text-gray-900">Compra segura</p>
                                <p className="text-gray-500">Tus datos protegidos</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetail;
