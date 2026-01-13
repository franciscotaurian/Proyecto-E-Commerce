import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4">E-COMMERCE</h3>
                        <p className="text-gray-400">
                            Tu tienda de confianza para las mejores prendas.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Enlaces</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li>
                                <Link to="/" className="hover:text-white transition">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-white transition">
                                    Iniciar Sesión
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="hover:text-white transition">
                                    Registrarse
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Contacto</h4>
                        <p className="text-gray-400">
                            Córdoba, Argentina
                        </p>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()} E-Commerce. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
