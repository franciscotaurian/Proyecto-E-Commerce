import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductApiRepository from '../../../../infrastructure/api/ProductApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { PLACEHOLDER_IMAGE } from '../../../../shared/utils/constants.js';

const ITEMS_PER_PAGE = 12;

export const Home = () => {
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    // Load all data once
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [categoriesData, productsData] = await Promise.all([
                ProductApiRepository.getCategories(),
                ProductApiRepository.getProducts({ limit: 200 }),
            ]);
            setCategories(categoriesData);
            setAllProducts(productsData.products || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory]);

    // Client-side filter
    const filtered = allProducts.filter(p => {
        const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = !selectedCategory || p.category?.toLowerCase() === selectedCategory.toLowerCase();
        return matchSearch && matchCat;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleCategoryClick = (catName) => {
        setSelectedCategory(prev => prev === catName ? '' : catName);
        setSearchQuery('');
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setSearchQuery('');
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

            {/* ── Featured Categories ────────────────────────────────────── */}
            {categories.length > 0 && (
                <section className="bg-gray-100 py-12">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-3xl font-bold mb-8 text-center tracking-tight">CATEGORÍAS DESTACADAS</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {categories.map(category => (
                                <div
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className={`relative group cursor-pointer overflow-hidden rounded-xl hover-scale shadow-sm transition-all ${selectedCategory === category.name ? 'ring-4 ring-black ring-offset-2' : ''}`}
                                >
                                    <img
                                        src={category.image || PLACEHOLDER_IMAGE}
                                        alt={category.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${selectedCategory === category.name ? 'bg-black/60' : 'bg-black/40 group-hover:bg-black/50'}`}>
                                        <h3 className="text-white text-xl font-bold uppercase tracking-wide">{category.name}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Products Section ───────────────────────────────────────── */}
            <section className="py-12">
                <div className="max-w-6xl mx-auto px-4">

                    {/* Search bar + active filter indicator */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-8">
                        <div className="relative flex-1 w-full">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar productos por nombre..."
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none text-sm transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FiX size={17} />
                                </button>
                            )}
                        </div>

                        {/* Active filters */}
                        {(selectedCategory || searchQuery) && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {selectedCategory && (
                                    <span className="inline-flex items-center gap-1 bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                                        {selectedCategory}
                                        <button onClick={() => setSelectedCategory('')} className="ml-1 hover:opacity-70">
                                            <FiX size={12} />
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        )}

                        {/* Product count */}
                        <p className="text-sm text-gray-400 flex-shrink-0">
                            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Section heading */}
                    <h2 className="text-2xl font-bold mb-6 tracking-tight">
                        {selectedCategory ? selectedCategory : 'Todos los Productos'}
                    </h2>

                    {/* Grid */}
                    {paginated.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {paginated.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => navigate(`/products/${product.id}`)}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative overflow-hidden rounded-xl mb-3 shadow-sm hover-lift bg-gray-100">
                                        <img
                                            src={product.images?.[0] || PLACEHOLDER_IMAGE}
                                            alt={product.name}
                                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {!product.isInStock() && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white font-bold tracking-wider text-sm">SIN STOCK</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-800 mb-1 leading-tight group-hover:underline underline-offset-2 transition-all">
                                        {product.name}
                                    </h3>
                                    {product.category && (
                                        <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                                    )}
                                    <p className="text-base font-bold text-gray-900">{formatCurrency(product.price)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            <FiSearch size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-gray-500">No se encontraron productos</p>
                            <p className="text-sm mt-1">Intentá con otro término o categoría</p>
                            {(selectedCategory || searchQuery) && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 text-sm underline text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    Ver todos los productos
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Pagination ───────────────────────────────────────── */}
                    {filtered.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                Página {currentPage} de {totalPages}
                                <span className="ml-2 text-gray-400">
                                    ({(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length})
                                </span>
                            </p>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FiChevronLeft size={18} />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((item, i) =>
                                        item === '...' ? (
                                            <span key={`sep-${i}`} className="px-2 text-gray-400 text-sm select-none">…</span>
                                        ) : (
                                            <button
                                                key={item}
                                                onClick={() => setCurrentPage(item)}
                                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${item === currentPage ? 'bg-black text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    )}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FiChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
