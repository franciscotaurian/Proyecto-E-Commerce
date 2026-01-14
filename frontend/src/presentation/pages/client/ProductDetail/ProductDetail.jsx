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
        <div className="min-h-screen bg-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Image Carousel Section */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                            <img
                                src={images[currentImageIndex]}
                                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
                                        aria-label="Previous image"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
                                        aria-label="Next image"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            {/* Image Indicators */}
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                                ? 'bg-white w-8'
                                                : 'bg-white/50 hover:bg-white/75'
                                                }`}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Images */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                            ? 'border-black'
                                            : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Information Section */}
                    <div className="space-y-6">
                        {/* Product Name and Price */}
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                            <p className="text-2xl font-bold">{formatCurrency(product.price)}</p>
                        </div>

                        {/* Stock Status */}
                        {product.isInStock() ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">En stock</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">Sin stock</span>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Descripción</h2>
                            <p className="text-gray-700 leading-relaxed">{product.description}</p>
                        </div>

                        {/* Color Selection */}
                        {availableColors.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">
                                    Color: <span className="font-normal text-gray-700">{selectedColor}</span>
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {availableColors.map((color) => {
                                        const hasStock = product.variants.some(
                                            v => v.color === color && v.available > 0
                                        );
                                        return (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    // Auto-select first available size for this color
                                                    const firstSize = product.variants.find(
                                                        v => v.color === color && v.available > 0
                                                    );
                                                    if (firstSize) setSelectedSize(firstSize.size);
                                                }}
                                                disabled={!hasStock}
                                                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${selectedColor === color
                                                    ? 'border-black bg-black text-white'
                                                    : hasStock
                                                        ? 'border-gray-300 hover:border-black'
                                                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {color}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        {availableSizes.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">
                                    Talla: <span className="font-normal text-gray-700">{selectedSize}</span>
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {availableSizes.map((size) => {
                                        const variant = product.findVariant(selectedColor, size);
                                        const hasStock = variant && variant.available > 0;
                                        return (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                disabled={!hasStock}
                                                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${selectedSize === size
                                                    ? 'border-black bg-black text-white'
                                                    : hasStock
                                                        ? 'border-gray-300 hover:border-black'
                                                        : 'border-gray-200 text-gray-400 cursor-not-allowed line-through'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stock availability for selected variant */}
                        {selectedVariant && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">
                                    Disponibles: <span className="font-semibold text-gray-900">{selectedVariant.available} unidades</span>
                                </p>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div>
                            <h3 className="font-semibold mb-3">Cantidad</h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-black transition-colors flex items-center justify-center font-bold"
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                                <button
                                    onClick={() => {
                                        if (selectedVariant && quantity < selectedVariant.available) {
                                            setQuantity(quantity + 1);
                                        }
                                    }}
                                    className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-black transition-colors flex items-center justify-center font-bold"
                                    disabled={!selectedVariant || quantity >= selectedVariant.available}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isAddToCartDisabled}
                            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${isAddToCartDisabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800 hover-lift'
                                }`}
                        >
                            {addingToCart ? 'Agregando...' : 'Agregar al Carrito'}
                        </button>

                        {/* Additional Info */}
                        <div className="border-t pt-6 space-y-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                <span>Envío gratis en compras superiores a $50.000</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Garantía de devolución de 30 días</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
