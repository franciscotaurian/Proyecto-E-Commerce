import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import productApi from '../../../../infrastructure/api/ProductApiRepository.js';

export const ProductCreate = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        weight: ''
    });

    const [images, setImages] = useState([]);
    const [variants, setVariants] = useState([]);
    const [currentVariant, setCurrentVariant] = useState({ color: '', size: '', quantity: '' });

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await productApi.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleVariantChange = (e) => {
        const { name, value } = e.target;
        setCurrentVariant({ ...currentVariant, [name]: value });
    };

    const handleAddVariant = () => {
        if (currentVariant.color && currentVariant.size && currentVariant.quantity) {
            setVariants([...variants, { ...currentVariant, quantity: Number(currentVariant.quantity) }]);
            setCurrentVariant({ color: '', size: '', quantity: '' });
        }
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/png');

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, {
                    file: file,
                    preview: URL.createObjectURL(file),
                    base64: reader.result
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const productPayload = {
            ...formData,
            price: Number(formData.price),
            weight: Number(formData.weight),
            images: images.map(img => img.base64),
            variants: variants
        };

        try {
            setIsSubmitting(true);
            await productApi.createProduct(productPayload);
            alert('¡Producto creado exitosamente!');
            
            // Opcional: Redirigir a la vista de productos o resetear el formulario
            // navigate('/admin/products');
            
            setFormData({ name: '', description: '', category: '', price: '', weight: '' });
            setImages([]);
            setVariants([]);
        } catch (error) {
            console.error('Error al crear producto:', error);
            alert('Hubo un error al crear el producto. Revisa la consola para más detalles.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800">Crear Nuevo Producto</h1>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 text-white px-6 py-2 rounded-lg shadow-md transition-colors font-medium ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    <FiSave /> {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Detalles Principales */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Información Básica */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Información Básica</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Remera Oversize Cotton"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Describe el producto..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                                        disabled={loadingCategories}
                                    >
                                        <option value="">Seleccione una categoría</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleInputChange}
                                        placeholder="0.25"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variantes */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Variantes (Stock)</h2>

                        {/* Formulario para agregar variante */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Color</label>
                                <input
                                    type="text"
                                    name="color"
                                    value={currentVariant.color}
                                    onChange={handleVariantChange}
                                    placeholder="Ej: Negro"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Talle</label>
                                <input
                                    type="text"
                                    name="size"
                                    value={currentVariant.size}
                                    onChange={handleVariantChange}
                                    placeholder="Ej: XL"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="w-full md:w-32">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Cantidad</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={currentVariant.quantity}
                                    onChange={handleVariantChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={handleAddVariant}
                                disabled={!currentVariant.color || !currentVariant.size || !currentVariant.quantity}
                                className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiPlus /> Agregar
                            </button>
                        </div>

                        {/* Lista Vertical de Variantes */}
                        {variants.length > 0 ? (
                            <div className="space-y-3">
                                {variants.map((v, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex gap-6 text-sm">
                                            <div><span className="text-gray-500">Color:</span> <span className="font-semibold">{v.color}</span></div>
                                            <div><span className="text-gray-500">Talle:</span> <span className="font-semibold">{v.size}</span></div>
                                            <div><span className="text-gray-500">Stock:</span> <span className="font-semibold text-indigo-600">{v.quantity} unid.</span></div>
                                        </div>
                                        <button
                                            onClick={() => removeVariant(idx)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                            title="Eliminar variante"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                No se han agregado variantes aún.
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Imágenes */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Imágenes del Producto</h2>

                        {/* Cuadro para cargar imagen */}
                        <div className="relative group cursor-pointer">
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg, image/png"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 flex flex-col items-center justify-center py-10 transition-colors">
                                <FiUploadCloud className="text-indigo-500 text-4xl mb-3" />
                                <span className="text-indigo-700 font-medium">Click para cargar imágenes</span>
                                <span className="text-xs text-indigo-400 mt-1">Soporta JPG y PNG</span>
                            </div>
                        </div>

                        {/* Array Horizontal de Fotos */}
                        {images.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Galería ({images.length})</h3>
                                <div className="flex flex-wrap gap-4">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                                            <img
                                                src={img.preview}
                                                alt={`preview-${idx}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                            >
                                                <FiX size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCreate;
