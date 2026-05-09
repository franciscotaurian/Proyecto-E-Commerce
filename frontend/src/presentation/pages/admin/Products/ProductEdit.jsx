import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiSave, FiX, FiUploadCloud, FiPlus, FiChevronLeft, FiChevronRight, FiAlertTriangle } from 'react-icons/fi';
import productApi from '../../../../infrastructure/api/ProductApiRepository.js';

const ITEMS_PER_PAGE = 8;

// ── Delete Confirmation Modal ──────────────────────────────────────────────────
const DeleteModal = ({ product, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <FiAlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Eliminar Producto</h2>
                    <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-semibold text-sm mb-1">⚠️ Advertencia</p>
                <p className="text-red-700 text-sm">
                    El producto <strong>"{product?.name}"</strong> será eliminado permanentemente junto con{' '}
                    <strong>todas sus variantes de stock</strong>.
                </p>
            </div>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={onCancel}
                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirm}
                    className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
                >
                    <FiTrash2 size={16} /> Eliminar
                </button>
            </div>
        </div>
    </div>
);

// ── Edit Form (inline) ─────────────────────────────────────────────────────────
const EditForm = ({ product, categories, onClose, onSaved }) => {
    const [formData, setFormData] = useState({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        weight: product.weight || '',
    });
    const [images, setImages] = useState(
        (product.images || []).map(url => ({ preview: url, base64: null, isUrl: true }))
    );
    const [variants, setVariants] = useState(product.variants || []);
    const [currentVariant, setCurrentVariant] = useState({ color: '', size: '', quantity: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInput = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleVariantInput = e => setCurrentVariant(p => ({ ...p, [e.target.name]: e.target.value }));

    const addVariant = () => {
        if (currentVariant.color && currentVariant.size && currentVariant.quantity) {
            setVariants(v => [...v, { ...currentVariant, quantity: Number(currentVariant.quantity) }]);
            setCurrentVariant({ color: '', size: '', quantity: '' });
        }
    };

    const handleImageUpload = e => {
        Array.from(e.target.files).forEach(file => {
            if (file.type !== 'image/jpeg' && file.type !== 'image/png') return;
            const reader = new FileReader();
            reader.onloadend = () =>
                setImages(p => [...p, { file, preview: URL.createObjectURL(file), base64: reader.result, isUrl: false }]);
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                price: Number(formData.price),
                weight: Number(formData.weight),
                images: images.map(img => (img.isUrl ? img.preview : img.base64)),
                variants,
            };
            await productApi.updateProduct(product.id, payload);
            alert('¡Producto actualizado exitosamente!');
            onSaved();
        } catch (err) {
            console.error(err);
            alert('Error al actualizar el producto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 mt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-indigo-800">Editando: {product.name}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <FiX size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Basic Info + Variants */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Basic Info */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Información Básica</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input name="name" value={formData.name} onChange={handleInput}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea name="description" value={formData.description} onChange={handleInput} rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select name="category" value={formData.category} onChange={handleInput}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                        <option value="">Seleccione...</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleInput} step="0.01"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                                    <input type="number" name="weight" value={formData.weight} onChange={handleInput} step="0.01"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Variantes (Stock)</h3>
                        <div className="flex flex-col md:flex-row gap-3 mb-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Color</label>
                                <input name="color" value={currentVariant.color} onChange={handleVariantInput} placeholder="Ej: Negro"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Talle</label>
                                <input name="size" value={currentVariant.size} onChange={handleVariantInput} placeholder="Ej: XL"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            </div>
                            <div className="w-28">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Cantidad</label>
                                <input type="number" name="quantity" value={currentVariant.quantity} onChange={handleVariantInput} min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                            </div>
                            <button onClick={addVariant}
                                disabled={!currentVariant.color || !currentVariant.size || !currentVariant.quantity}
                                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                                <FiPlus /> Agregar
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {variants.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">Sin variantes</p>
                            ) : variants.map((v, i) => (
                                <div key={i} className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                    <div className="flex gap-5">
                                        <span><span className="text-gray-500">Color:</span> <span className="font-semibold">{v.color}</span></span>
                                        <span><span className="text-gray-500">Talle:</span> <span className="font-semibold">{v.size}</span></span>
                                        <span><span className="text-gray-500">Stock:</span> <span className="font-semibold text-indigo-600">{v.quantity}</span></span>
                                    </div>
                                    <button onClick={() => setVariants(vs => vs.filter((_, idx) => idx !== i))}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                                        <FiTrash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Images */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 self-start">
                    <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Imágenes</h3>
                    <div className="relative cursor-pointer">
                        <input type="file" multiple accept="image/jpeg,image/png" onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 flex flex-col items-center justify-center py-6 transition-colors">
                            <FiUploadCloud className="text-indigo-500 text-3xl mb-2" />
                            <span className="text-indigo-700 font-medium text-sm">Click para cargar imágenes</span>
                            <span className="text-xs text-indigo-400 mt-1">JPG / PNG</span>
                        </div>
                    </div>
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-4">
                            {images.map((img, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => setImages(imgs => imgs.filter((_, idx) => idx !== i))}
                                        className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FiX size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-indigo-200">
                <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                    Cancelar
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium shadow transition-colors ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    <FiSave size={16} /> {isSubmitting ? 'Actualizando...' : 'Actualizar Producto'}
                </button>
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const ProductEdit = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [prodData, catData] = await Promise.all([
                productApi.getProducts({ limit: 200 }),
                productApi.getCategories(),
            ]);
            setAllProducts(prodData.products || []);
            setCategories(catData || []);
        } catch (err) {
            console.error('Error cargando datos:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory]);

    // Filtered products
    const filtered = allProducts.filter(p => {
        const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = !selectedCategory || p.category?.toLowerCase() === selectedCategory.toLowerCase();
        return matchSearch && matchCat;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setIsDeleting(true);
            await productApi.deleteProduct(deleteTarget.id);
            setAllProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
            if (editingProduct?.id === deleteTarget.id) setEditingProduct(null);
            setDeleteTarget(null);
        } catch (err) {
            console.error(err);
            alert('Error al eliminar el producto.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditSaved = () => {
        setEditingProduct(null);
        fetchAll();
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800">Lista de Productos</h1>
                <p className="text-gray-500 mt-1">Buscá, editá o eliminá productos del catálogo.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre de producto..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    {/* Category filter */}
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="md:w-56 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all"
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    {/* Result count */}
                    <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                        {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Edit Form (inline) */}
            {editingProduct && (
                <EditForm
                    product={editingProduct}
                    categories={categories}
                    onClose={() => setEditingProduct(null)}
                    onSaved={handleEditSaved}
                />
            )}

            {/* Product Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                            <span>Cargando productos...</span>
                        </div>
                    </div>
                ) : paginated.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <FiSearch size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No se encontraron productos</p>
                        <p className="text-sm mt-1">Intenta con otro término o categoría</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 w-16">Imagen</th>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Categoría</th>
                                    <th className="px-4 py-3">Precio</th>
                                    <th className="px-4 py-3">Stock</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginated.map(product => (
                                    <tr key={product.id}
                                        className={`hover:bg-gray-50 transition-colors ${editingProduct?.id === product.id ? 'bg-indigo-50/50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin img</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-gray-800">{product.name}</span>
                                            {product.description && (
                                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{product.description}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {product.category || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-700">
                                            ${Number(product.price).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            {typeof product.getTotalStock === 'function' ? (
                                                <span className={`font-semibold ${product.getTotalStock() > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {product.getTotalStock()} unid.
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingProduct(editingProduct?.id === product.id ? null : product)}
                                                    title="Editar"
                                                    className={`p-2 rounded-lg transition-colors ${editingProduct?.id === product.id ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800'}`}>
                                                    <FiEdit2 size={17} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(product)}
                                                    title="Eliminar"
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors">
                                                    <FiTrash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && filtered.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-5 px-1">
                    <p className="text-sm text-gray-500">
                        Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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
                                    <span key={`sep-${i}`} className="px-3 py-2 text-gray-400 text-sm">…</span>
                                ) : (
                                    <button key={item} onClick={() => setCurrentPage(item)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${item === currentPage ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                        {item}
                                    </button>
                                )
                            )}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <FiChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <DeleteModal
                    product={deleteTarget}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}

            {/* Spinner overlay for delete */}
            {isDeleting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-4">
                        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                        <span className="text-gray-700 font-medium">Eliminando producto...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductEdit;
