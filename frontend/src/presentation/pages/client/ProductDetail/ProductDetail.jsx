import React from 'react';
import { useParams } from 'react-router-dom';
import Spinner from '../../../components/common/Spinner.jsx';

// Simple placeholder for ProductDetail
export const ProductDetail = () => {
    const { id } = useParams();

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Detalle del Producto</h1>
                <p className="text-gray-600">ID del producto: {id}</p>
                <p className="text-sm text-gray-500 mt-4">Esta página estará completamente implementada pronto</p>
            </div>
        </div>
    );
};

export default ProductDetail;
