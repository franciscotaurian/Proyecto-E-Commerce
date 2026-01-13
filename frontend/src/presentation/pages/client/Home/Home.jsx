import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductApiRepository from '../../../../infrastructure/api/ProductApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { PLACEHOLDER_IMAGE } from '../../../../shared/utils/constants.js';

export const Home = () => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, [selectedCategory]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [categoriesData, productsData] = await Promise.all([
                ProductApiRepository.getCategories(),
                ProductApiRepository.getProducts({ category: selectedCategory }),
            ]);
            setCategories(categoriesData);
            setProducts(productsData.products || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Category Carousel */}
            {categories.length > 0 && (
                <section className="bg-gray-100 py-12">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold mb-8 text-center">CATEGORÍAS DESTACADAS</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    onClick={() => setSelectedCategory(selectedCategory === category.name ? '' : category.name)}
                                    className="relative group cursor-pointer overflow-hidden rounded-lg hover-scale"
                                >
                                    <img
                                        src={category.image || PLACEHOLDER_IMAGE}
                                        alt={category.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                        <h3 className="text-white text-xl font-bold uppercase">{category.name}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Products Grid */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    {selectedCategory && (
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold">{selectedCategory}</h2>
                            <button
                                onClick={() => setSelectedCategory('')}
                                className="text-sm underline hover:no-underline"
                            >
                                Ver Todos
                            </button>
                        </div>
                    )}

                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => navigate(`/products/${product.id}`)}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative overflow-hidden rounded-lg mb-3 hover-lift">
                                        <img
                                            src={product.images[0] || PLACEHOLDER_IMAGE}
                                            alt={product.name}
                                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {!product.isInStock() && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                <span className="text-white font-bold">SIN STOCK</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-medium mb-1">{product.name}</h3>
                                    <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No hay productos disponibles</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
