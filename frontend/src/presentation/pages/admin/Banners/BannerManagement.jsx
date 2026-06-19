import React, { useState, useEffect } from 'react';
import { FiUploadCloud, FiEdit2, FiTrash2, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';
import productApi from '../../../../infrastructure/api/ProductApiRepository.js';

export const BannerManagement = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [banners, setBanners] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        button_text: '',
        button_link: '',
    });
    const [images, setImages] = useState([]);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const data = await productApi.getAdminBanners();
            setBanners(data);
        } catch (error) {
            console.error('Error fetching banners:', error);
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
            const isTypeValid = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
            const isSizeValid = file.size <= 5 * 1024 * 1024; // 5MB
            if (!isSizeValid) {
                alert(`El archivo ${file.name} supera los 5MB permitidos.`);
            }
            if (!isTypeValid) {
                alert(`El archivo ${file.name} no es JPG, PNG o WEBP.`);
            }
            return isTypeValid && isSizeValid;
        });

        if (validFiles.length > 0) {
            const file = validFiles[0]; // Sólo una imagen para el banner
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages([{
                    file: file,
                    preview: URL.createObjectURL(file),
                    base64: reader.result,
                    isUrl: false
                }]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImages([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title) {
            alert('El título es requerido');
            return;
        }

        let imageValue = '';
        if (images.length > 0) {
            const firstImg = images[0];
            imageValue = firstImg.isUrl ? firstImg.preview : (firstImg.base64 || firstImg.preview);
        }

        if (!imageValue && !editingId) {
            alert('La imagen del banner es requerida');
            return;
        }

        const payload = {
            ...formData,
            image_url: imageValue
        };

        try {
            setIsSubmitting(true);
            if (editingId) {
                await productApi.updateBanner(editingId, payload);
                alert('¡Banner actualizado exitosamente!');
            } else {
                await productApi.createBanner(payload);
                alert('¡Banner creado exitosamente!');
            }

            resetForm();
            fetchBanners();
        } catch (error) {
            console.error('Error al guardar banner:', error);
            alert('Hubo un error al guardar el banner.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (banner) => {
        setEditingId(banner.id);
        setFormData({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            description: banner.description || '',
            button_text: banner.button_text || '',
            button_link: banner.button_link || '',
        });
        if (banner.image_url) {
            setImages([{ preview: banner.image_url, base64: null, isUrl: true }]);
        } else {
            setImages([]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (banner) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este banner?')) {
            try {
                await productApi.deleteBanner(banner.id);
                alert('Banner eliminado');
                fetchBanners();
                if (editingId === banner.id) resetForm();
            } catch (error) {
                console.error('Error al eliminar banner:', error);
                alert('Hubo un error al eliminar el banner.');
            }
        }
    };

    const handleActivate = async (banner) => {
        try {
            await productApi.setActiveBanner(banner.id);
            alert('Banner activado exitosamente');
            fetchBanners();
        } catch (error) {
            console.error('Error al activar banner:', error);
            alert('Hubo un error al activar el banner.');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            button_text: '',
            button_link: '',
        });
        setImages([]);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800">
                    {editingId ? 'Modificar Banner' : 'Crear Nuevo Banner'}
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
                    <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Datos del Banner</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Ej: ESTILO QUE TE DEFINE"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                                <input
                                    type="text"
                                    name="subtitle"
                                    value={formData.subtitle}
                                    onChange={handleInputChange}
                                    placeholder="Ej: NUEVA COLECCIÓN"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Prendas modernas, cómodas y con actitud..."
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Texto del Botón</label>
                                    <input
                                        type="text"
                                        name="button_text"
                                        value={formData.button_text}
                                        onChange={handleInputChange}
                                        placeholder="Ej: VER COLECCIÓN"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link del Botón</label>
                                    <input
                                        type="text"
                                        name="button_link"
                                        value={formData.button_link}
                                        onChange={handleInputChange}
                                        placeholder="Ej: /products"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Imagen Principal (JPG/PNG, máx 5MB) *</label>
                            
                            {images.length === 0 ? (
                                <div className="relative group cursor-pointer mb-4 h-64">
                                    <input
                                        type="file"
                                        accept="image/jpeg, image/png, image/webp"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 h-full flex flex-col items-center justify-center py-8 transition-colors">
                                        <FiUploadCloud className="text-indigo-500 text-5xl mb-3" />
                                        <span className="text-indigo-700 font-medium text-lg">Click para cargar imagen</span>
                                        <span className="text-sm text-indigo-400 mt-1">Soporta JPG, PNG y WEBP (Ideal apaisada)</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm group">
                                    <img
                                        src={images[0].preview}
                                        alt="preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={removeImage}
                                        className="absolute top-3 right-3 bg-white/90 text-red-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 shadow-md"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lista de Banners */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Banners Existentes</h2>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Cargando banners...</div>
                    ) : banners.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {banners.map(banner => (
                                <div key={banner.id} className={`flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow ${banner.is_active ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-4 w-full md:w-2/3">
                                        <div className="w-32 h-20 rounded-md overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0">
                                            {banner.image_url ? (
                                                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin foto</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg text-gray-800 truncate">{banner.title}</h3>
                                                {banner.is_active && (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                        <FiCheckCircle /> ACTIVO
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{banner.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4 md:mt-0">
                                        {!banner.is_active && (
                                            <button
                                                onClick={() => handleActivate(banner)}
                                                className="text-green-600 hover:text-green-800 hover:bg-green-50 px-4 py-2 rounded-md transition-colors font-medium border border-transparent hover:border-green-200 flex items-center gap-2"
                                            >
                                                <FiCheckCircle /> Activar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(banner)}
                                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-md transition-colors"
                                            title="Editar"
                                        >
                                            <FiEdit2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner)}
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
                            No hay banners creados aún.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BannerManagement;
