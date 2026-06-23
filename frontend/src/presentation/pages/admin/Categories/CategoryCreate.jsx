import React, { useState, useEffect } from 'react';
import { FiUploadCloud, FiEdit2, FiTrash2, FiSave, FiX, FiStar } from 'react-icons/fi';
import productApi from '../../../../infrastructure/api/ProductApiRepository.js';

export const CategoryCreate = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [images, setImages] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await productApi.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isTypeValid = file.type === 'image/jpeg' || file.type === 'image/png';
            const isSizeValid = file.size <= 5 * 1024 * 1024; // 5MB
            if (!isSizeValid) {
                alert(`El archivo ${file.name} supera los 5MB permitidos.`);
            }
            if (!isTypeValid) {
                alert(`El archivo ${file.name} no es JPG o PNG.`);
            }
            return isTypeValid && isSizeValid;
        });

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, {
                    file: file,
                    preview: URL.createObjectURL(file),
                    base64: reader.result,
                    isUrl: false
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

        if (!formData.name) {
            alert('El nombre es requerido');
            return;
        }

        if (images.length === 0) {
            alert('La imagen es requerida. Las categorías deben tener imagen para poder ser destacadas.');
            return;
        }

        // Si la imagen ya es una URL de R2 (edición sin nueva imagen), la enviamos tal cual.
        // Si es una nueva imagen, enviamos el base64 para que el backend la suba a R2.
        let imageValue = '';
        if (images.length > 0) {
            const firstImg = images[0];
            imageValue = firstImg.isUrl ? firstImg.preview : (firstImg.base64 || firstImg.preview);
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            image: imageValue,
        };

        try {
            setIsSubmitting(true);
            if (editingId) {
                await productApi.updateCategory(editingId, payload);
                alert('¡Categoría actualizada exitosamente!');
            } else {
                await productApi.createCategory(payload);
                alert('¡Categoría creada exitosamente!');
            }

            resetForm();
            fetchCategories();
        } catch (error) {
            console.error('Error al guardar categoría:', error);
            alert(`Hubo un error al guardar la categoría: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            description: category.description || '',
        });
        if (category.image) {
            // Marcar como URL existente (link de R2) para no tratarla como base64 al enviar
            setImages([{ preview: category.image, base64: null, isUrl: true }]);
        } else {
            setImages([]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (category) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
            try {
                await productApi.deleteCategory(category.name);
                alert('Categoría eliminada');
                fetchCategories();
                if (editingId === category.id) resetForm();
            } catch (error) {
                console.error('Error al eliminar categoría:', error);
                alert(`Hubo un error al eliminar la categoría: ${error.message}`);
            }
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', description: '' });
        setImages([]);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800">
                    {editingId ? 'Modificar Categoría' : 'Crear Nueva Categoría'}
                </h1>
                <div className="flex gap-4">
                    {editingId && (
                        <button
                            onClick={resetForm}
                            className="text-gray-600 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 text-white px-6 py-2 rounded-lg shadow-md transition-colors font-medium ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        <FiSave /> {isSubmitting ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Formulario */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Datos de la Categoría</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Ej: Remeras, Pantalones..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción{' '}
                                <span className="text-xs text-gray-400 font-normal">
                                    (texto que aparece debajo del nombre en la home)
                                </span>
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Ej: Básicos que nunca fallan"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Imagen (JPG o PNG, máx 5MB) <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
                                <FiStar size={12} className="text-amber-500" />
                                La imagen es obligatoria para poder seleccionar la categoría como destacada en la home.
                            </p>
                            <div className="relative group cursor-pointer mb-4">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg, image/png"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 flex flex-col items-center justify-center py-8 transition-colors">
                                    <FiUploadCloud className="text-indigo-500 text-4xl mb-3" />
                                    <span className="text-indigo-700 font-medium">Click para cargar imágenes</span>
                                    <span className="text-xs text-indigo-400 mt-1">Soporta JPG y PNG hasta 5MB</span>
                                </div>
                            </div>

                            {/* Array Horizontal de Fotos */}
                            {images.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-4">
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
                            )}
                        </div>
                    </div>
                </div>

                {/* Lista de Categorías */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Categorías Existentes</h2>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Cargando categorías...</div>
                    ) : categories.length > 0 ? (
                        <div className="space-y-4">
                            {categories.map(category => (
                                <div key={category.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0">
                                            {category.image ? (
                                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin foto</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg text-gray-800">{category.name}</h3>
                                                {category.is_featured && (
                                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                                                        <FiStar size={10} /> Destacada
                                                    </span>
                                                )}
                                            </div>
                                            {category.description && (
                                                <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-md transition-colors"
                                            title="Editar"
                                        >
                                            <FiEdit2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                            title="Eliminar"
                                        >
                                            <FiTrash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            No hay categorías creadas aún.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryCreate;
