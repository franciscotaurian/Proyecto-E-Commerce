import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button.jsx';

export const AdminDashboard = () => {
    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/admin/products/create" className="p-6 bg-white border-2 border-black rounded-lg hover-lift">
                    <h2 className="font-bold text-xl mb-2">Crear Producto</h2>
                    <p className="text-gray-600">Agregar nuevo producto al catálogo</p>
                </Link>

                <Link to="/admin/categories/create" className="p-6 bg-white border-2 border-black rounded-lg hover-lift">
                    <h2 className="font-bold text-xl mb-2">Crear Categoría</h2>
                    <p className="text-gray-600">Agregar nueva categoría</p>
                </Link>

                <Link to="/admin/sales" className="p-6 bg-white border-2 border-black rounded-lg hover-lift">
                    <h2 className="font-bold text-xl mb-2">Mis Ventas</h2>
                    <p className="text-gray-600">Ver y gestionar ventas</p>
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
