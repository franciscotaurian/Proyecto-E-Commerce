import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthApiRepository from '../../../../infrastructure/api/AuthApiRepository.js';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await AuthApiRepository.sendResetPasswordEmail(email);
            setSubmitted(true);
        } catch (err) {
            setError('Ocurrió un error. Verificá que el email sea correcto e intentá nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                        🔑
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center mb-2">
                    Recuperar Contraseña
                </h2>
                <p className="text-gray-500 text-sm text-center mb-8">
                    Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
                </p>

                {submitted ? (
                    /* Success state */
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                                ✉️
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-800">
                            ¡Correo enviado!
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Revisá tu casilla de correo electrónico y seguí las instrucciones
                            para restablecer tu contraseña.
                        </p>
                        <p className="text-xs text-gray-400 mb-6">
                            Si no recibís el correo en unos minutos, revisá tu carpeta de spam.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block text-sm font-medium text-black hover:underline"
                        >
                            ← Volver al inicio de sesión
                        </Link>
                    </div>
                ) : (
                    /* Form state */
                    <>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-2 px-4 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Enviando...' : 'Enviar link de recuperación'}
                            </button>
                        </form>

                        <div className="text-center mt-6">
                            <Link
                                to="/login"
                                className="text-sm text-gray-500 hover:text-black hover:underline"
                            >
                                ← Volver al inicio de sesión
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
