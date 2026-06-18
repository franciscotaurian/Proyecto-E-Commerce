import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import Spinner from '../../../components/common/Spinner.jsx';
import Input from '../../../components/common/Input.jsx';
import Button from '../../../components/common/Button.jsx';
import UserApiRepository from '../../../../infrastructure/api/UserApiRepository.js';

export const EditProfile = () => {
    const { user, updateUserProfile } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        phone: '',
        address: {
            street: '',
            number: '',
            floor: '',
            apartment: '',
            city: '',
            province: '',
            country: '',
            zipCode: ''
        }
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        const loadUserData = async () => {
            try {
                setLoading(true);
                // Intentamos obtener perfil fresco para tener los últimos datos
                const profile = await UserApiRepository.getProfile();

                setFormData({
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    dni: profile.dni || '',
                    phone: profile.phone || '',
                    address: {
                        street: profile.address?.street || '',
                        number: profile.address?.number || '',
                        floor: profile.address?.floor || '',
                        apartment: profile.address?.apartment || '',
                        city: profile.address?.city || '',
                        province: profile.address?.province || '',
                        country: profile.address?.country || '',
                        zipCode: profile.address?.zipCode || ''
                    }
                });
            } catch (err) {
                console.error("Error loading profile:", err);
                setError("No se pudieron cargar los datos del perfil.");
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData({
                ...formData,
                address: {
                    ...formData.address,
                    [addressField]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }

        // Clear error when typing
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: null
            });
        }
    };

    const validate = () => {
        const errors = {};
        if (!formData.firstName.trim()) errors.firstName = 'El nombre es obligatorio';
        if (!formData.lastName.trim()) errors.lastName = 'El apellido es obligatorio';
        if (!formData.dni.trim()) errors.dni = 'El DNI es obligatorio';
        if (!formData.phone.trim()) errors.phone = 'El teléfono es obligatorio';

        if (!formData.address.street.trim()) errors['address.street'] = 'La calle es obligatoria';
        if (!formData.address.number.trim()) errors['address.number'] = 'El número es obligatorio';
        if (!formData.address.city.trim()) errors['address.city'] = 'La ciudad es obligatoria';
        if (!formData.address.province.trim()) errors['address.province'] = 'La provincia es obligatoria';
        if (!formData.address.country.trim()) errors['address.country'] = 'El país es obligatorio';
        if (!formData.address.zipCode.trim()) errors['address.zipCode'] = 'El código postal es obligatorio';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await updateUserProfile({
                ...formData,
                id: user?.id
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/profile');
            }, 1500);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.message || "Ocurrió un error al actualizar el perfil.");
        } finally {
            setSubmitting(false);
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
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <button
                onClick={() => navigate('/profile')}
                className="flex items-center text-gray-500 hover:text-black mb-6 transition-colors"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver al Perfil
            </button>

            <h1 className="text-3xl font-bold mb-8">Modificar Perfil</h1>

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-green-700 font-medium">¡Perfil actualizado con éxito! Redirigiendo...</span>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                    <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-red-700 font-medium">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">

                {/* Email (Readonly) */}
                <div>
                    <h2 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2">Cuenta</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal text-xs ml-2">(No modificable)</span></label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Personal Data */}
                <div>
                    <h2 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2">Datos Personales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            error={formErrors.firstName}
                            required
                        />
                        <Input
                            label="Apellido"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            error={formErrors.lastName}
                            required
                        />
                        <Input
                            label="DNI"
                            name="dni"
                            value={formData.dni}
                            onChange={handleChange}
                            error={formErrors.dni}
                            required
                        />
                        <Input
                            label="Teléfono"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={formErrors.phone}
                            required
                        />
                    </div>
                </div>

                {/* Address Data */}
                <div>
                    <h2 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2">Dirección de Envío</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Input
                                    label="Calle"
                                    name="address.street"
                                    value={formData.address.street}
                                    onChange={handleChange}
                                    error={formErrors['address.street']}
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <Input
                                    label="Número"
                                    name="address.number"
                                    value={formData.address.number}
                                    onChange={handleChange}
                                    error={formErrors['address.number']}
                                    required
                                />
                            </div>
                        </div>
                        <Input
                            label="Piso (Opcional)"
                            name="address.floor"
                            value={formData.address.floor}
                            onChange={handleChange}
                        />
                        <Input
                            label="Departamento (Opcional)"
                            name="address.apartment"
                            value={formData.address.apartment}
                            onChange={handleChange}
                        />
                        <Input
                            label="Ciudad"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            error={formErrors['address.city']}
                            required
                        />
                        <Input
                            label="Provincia"
                            name="address.province"
                            value={formData.address.province}
                            onChange={handleChange}
                            error={formErrors['address.province']}
                            required
                        />
                        <Input
                            label="País"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleChange}
                            error={formErrors['address.country']}
                            required
                        />
                        <Input
                            label="Código Postal"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleChange}
                            error={formErrors['address.zipCode']}
                            required
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={submitting}
                        className="w-full md:w-auto"
                    >
                        Actualizar Perfil
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
