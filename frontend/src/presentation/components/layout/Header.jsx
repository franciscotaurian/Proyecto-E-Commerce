import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.js';
import { useCart } from '../../hooks/useCart.js';

export const Header = () => {
    const { isAuthenticated, user, isAdmin, logout } = useAuth();
    const { getItemCount } = useCart();
    const navigate = useNavigate();
    const [showMobileMenu, setShowMobileMenu] = React.useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const cartItemCount = getItemCount();

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="text-2xl font-bold">
                        E-COMMERCE
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="hover:text-gray-600 transition">
                            Inicio
                        </Link>
                        {isAdmin() && (
                            <>
                                <Link to="/admin" className="hover:text-gray-600 transition">
                                    Panel Admin
                                </Link>
                                <Link to="/admin/sales" className="hover:text-gray-600 transition">
                                    Mis Ventas
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/cart"
                                    className="relative p-2 hover:bg-gray-100 rounded-full transition"
                                >
                                    <FiShoppingCart className="w-6 h-6" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    to="/my-orders"
                                    className="hidden md:inline-block px-4 py-2 hover:bg-gray-100 rounded transition"
                                >
                                    Mis Compras
                                </Link>
                                <Link
                                    to="/profile"
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                >
                                    <FiUser className="w-6 h-6" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="hidden md:inline-block px-4 py-2 hover:bg-gray-100 rounded transition"
                                >
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 hover:bg-gray-100 rounded transition"
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                                >
                                    Registrarse
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2"
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="md:hidden py-4 border-t border-gray-200">
                        <nav className="flex flex-col space-y-2">
                            <Link to="/" className="py-2 hover:bg-gray-100 px-4 rounded">
                                Inicio
                            </Link>
                            {isAuthenticated && (
                                <>
                                    <Link to="/my-orders" className="py-2 hover:bg-gray-100 px-4 rounded">
                                        Mis Compras
                                    </Link>
                                    {isAdmin() && (
                                        <>
                                            <Link to="/admin" className="py-2 hover:bg-gray-100 px-4 rounded">
                                                Panel Admin
                                            </Link>
                                            <Link to="/admin/sales" className="py-2 hover:bg-gray-100 px-4 rounded">
                                                Mis Ventas
                                            </Link>
                                        </>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="py-2 hover:bg-gray-100 px-4 rounded text-left"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
