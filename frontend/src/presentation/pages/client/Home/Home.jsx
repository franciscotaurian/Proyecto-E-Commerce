import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiChevronLeft, FiChevronRight, FiChevronDown, FiGrid } from 'react-icons/fi';
import ProductApiRepository from '../../../../infrastructure/api/ProductApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { PLACEHOLDER_IMAGE } from '../../../../shared/utils/constants.js';

const ITEMS_PER_PAGE = 12;

export const Home = () => {
    const [categories, setCategories] = useState([]);
    const [featuredCategories, setFeaturedCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [heroBanner, setHeroBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load all data once
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [categoriesData, productsData, bannerData, featuredData] = await Promise.all([
                ProductApiRepository.getCategories(),
                ProductApiRepository.getProducts({ limit: 200 }),
                ProductApiRepository.getActiveBanner(),
                ProductApiRepository.getFeaturedCategories(),
            ]);
            setCategories(categoriesData);
            setAllProducts(productsData.products || []);
            setHeroBanner(bannerData);
            setFeaturedCategories(featuredData);
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
        setCategoryDropdownOpen(false);
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

            {/* ── Hero Banner ────────────────────────────────────── */}
            {heroBanner && (
                <section className="relative w-full h-[80vh] min-h-[500px] max-h-[800px] flex items-center mb-12">
                    {/* Background Image */}
                    <div className="absolute inset-0 w-full h-full">
                        <img 
                            src={heroBanner.image_url} 
                            alt={heroBanner.title} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 container mx-auto px-6 lg:px-16 text-white max-w-7xl">
                        <div className="max-w-2xl">
                            {heroBanner.subtitle && (
                                <p className="text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-4 text-gray-200">
                                    {heroBanner.subtitle}
                                </p>
                            )}
                            {heroBanner.title && (
                                <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
                                    {heroBanner.title}
                                </h1>
                            )}
                            {heroBanner.description && (
                                <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-lg leading-relaxed">
                                    {heroBanner.description}
                                </p>
                            )}
                            {heroBanner.button_text && (
                                <button 
                                    onClick={() => heroBanner.button_link ? navigate(heroBanner.button_link) : null}
                                    className="bg-white text-black hover:bg-gray-100 font-bold uppercase tracking-wider py-4 px-10 rounded-sm transition-all flex items-center gap-3 group"
                                >
                                    {heroBanner.button_text}
                                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Features Info Bar ──────────────────────────────────────── */}
            <div className="border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-gray-100">
                        <div className="flex items-center justify-center gap-4 px-4">
                            <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 21h.01M16 21h.01M4 17h16M4 17V7m0 10l-1-1m1 1a2 2 0 104 0m-4 0a2 2 0 114 0m12 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0V9l-3-3h-4v11m7-11a2 2 0 00-2-2H9a2 2 0 00-2 2v1m0 0H5" /></svg>
                            <div>
                                <h4 className="font-bold text-sm tracking-wide">ENVÍO GRATIS</h4>
                                <p className="text-xs text-gray-500">En compras + $50.000</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4 px-4">
                            <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                            <div>
                                <h4 className="font-bold text-sm tracking-wide">CALIDAD PREMIUM</h4>
                                <p className="text-xs text-gray-500">Materiales de primera</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4 px-4">
                            <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            <div>
                                <h4 className="font-bold text-sm tracking-wide">CAMBIOS FÁCILES</h4>
                                <p className="text-xs text-gray-500">Sin vueltas</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4 px-4">
                            <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <div>
                                <h4 className="font-bold text-sm tracking-wide">PAGO SEGURO</h4>
                                <p className="text-xs text-gray-500">Protegemos tus datos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Featured Categories ────────────────────────────────────── */}
            {featuredCategories.length > 0 && (
                <section className="py-16 bg-white">
                    <div className="max-w-6xl mx-auto px-4">
                        <p className="text-xs font-bold tracking-[0.2em] text-gray-500 mb-2">EXPLORÁ</p>
                        <h2 className="text-3xl font-bold mb-10 tracking-tight">CATEGORÍAS DESTACADAS</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {featuredCategories.map(category => (
                                <div
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className={`relative group cursor-pointer overflow-hidden rounded-xl h-80 hover-scale transition-all ${selectedCategory === category.name ? 'ring-4 ring-black ring-offset-2' : ''}`}
                                >
                                    <img
                                        src={category.image || PLACEHOLDER_IMAGE}
                                        alt={category.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-10 transition-opacity">
                                        <h3 className="text-white text-3xl font-bold uppercase tracking-wide mb-2">{category.name}</h3>
                                        {category.description && (
                                            <p className="text-gray-200 text-sm tracking-wider uppercase mb-6 max-w-[200px]">
                                                {category.description}
                                            </p>
                                        )}
                                        <button className="bg-white text-black text-sm font-bold uppercase px-6 py-3 w-max rounded-sm hover:bg-gray-100 transition-colors">
                                            VER COLECCIÓN
                                        </button>
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

                    {/* Search bar + category dropdown + active filter indicator */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-8">

                        {/* Category Dropdown */}
                        <div className="relative flex-shrink-0" ref={dropdownRef}>
                            <button
                                onClick={() => setCategoryDropdownOpen(prev => !prev)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all shadow-sm ${
                                    categoryDropdownOpen || selectedCategory
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                                aria-haspopup="listbox"
                                aria-expanded={categoryDropdownOpen}
                            >
                                <FiGrid size={16} />
                                <span>Categorías</span>
                                <FiChevronDown
                                    size={15}
                                    className={`transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Dropdown panel */}
                            {categoryDropdownOpen && (
                                <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px] animate-fade-in">
                                    {/* All products option */}
                                    <button
                                        onClick={() => { clearFilters(); setCategoryDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                                            !selectedCategory
                                                ? 'bg-gray-100 text-gray-900 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                                        Todos los productos
                                    </button>

                                    {/* Divider */}
                                    {categories.length > 0 && (
                                        <div className="border-t border-gray-100 my-1" />
                                    )}

                                    {/* Category list */}
                                    {categories.map(category => (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategoryClick(category.name)}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                                                selectedCategory === category.name
                                                    ? 'bg-black text-white font-semibold'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {category.image ? (
                                                <img
                                                    src={category.image}
                                                    alt=""
                                                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"></span>
                                            )}
                                            {category.name}
                                        </button>
                                    ))}

                                    {categories.length === 0 && (
                                        <p className="px-4 py-3 text-xs text-gray-400">No hay categorías disponibles</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Search input */}
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
