import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import Input from '../../../components/common/Input.jsx';
import Button from '../../../components/common/Button.jsx';

export const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        email: '',
        phone: '',
        password: '',
        address: {
            street: '',
            number: '',
            floor: '',
            apartment: '',
            city: '',
            province: '',
            country: 'Argentina',
            zipCode: '',
        },
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [addressField]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center mb-8">Crear Cuenta</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Apellido"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="DNI"
                            name="dni"
                            value={formData.dni}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Teléfono"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Contraseña"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <h3 className="text-xl font-bold mt-6 mb-4">Dirección</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Calle"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Número"
                            name="address.number"
                            value={formData.address.number}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Piso"
                            name="address.floor"
                            value={formData.address.floor}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Departamento"
                            name="address.apartment"
                            value={formData.address.apartment}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Ciudad"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Provincia"
                            name="address.province"
                            value={formData.address.province}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Código Postal"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-6"
                        disabled={loading}
                    >
                        {loading ? 'Creando cuenta...' : 'Registrarse'}
                    </Button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-black font-medium hover:underline">
                            Inicia sesión aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
