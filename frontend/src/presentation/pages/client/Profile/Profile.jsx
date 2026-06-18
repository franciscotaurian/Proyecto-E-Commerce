import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserApiRepository from '../../../../infrastructure/api/UserApiRepository.js';
import Spinner from '../../../components/common/Spinner.jsx';
import { useAuth } from '../../../hooks/useAuth.js';

export const Profile = () => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await UserApiRepository.getProfile();
                setProfile(data);
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError("No se pudo cargar la información del perfil.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const initials = profile ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() : '';

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl relative">
            <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Personal Information Card */}
                <div className="md:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center h-full">
                        <div className="w-24 h-24 rounded-full bg-gray-900 text-white flex items-center justify-center text-3xl font-bold mb-4">
                            {initials}
                        </div>
                        <h2 className="text-xl font-bold mb-1">{profile.getFullName()}</h2>
                        <p className="text-gray-500 mb-4">{profile.email}</p>
                        
                        <div className="w-full border-t border-gray-100 pt-4 mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-500 text-sm">DNI</span>
                                <span className="font-medium text-sm">{profile.dni || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-500 text-sm">Teléfono</span>
                                <span className="font-medium text-sm">{profile.phone || '-'}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">Estado</span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Activo</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address Information Card */}
                <div className="md:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full">
                        <h3 className="text-lg font-bold mb-4 flex items-center border-b border-gray-100 pb-3">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Dirección de Envío
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Calle</p>
                                <p className="font-medium">{profile.address?.street || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Número</p>
                                <p className="font-medium">{profile.address?.number || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Piso / Depto</p>
                                <p className="font-medium">
                                    {profile.address?.floor ? `Piso ${profile.address.floor}` : ''} 
                                    {profile.address?.floor && profile.address?.apartment ? ' - ' : ''}
                                    {profile.address?.apartment ? `Dpto ${profile.address.apartment}` : ''}
                                    {!profile.address?.floor && !profile.address?.apartment ? '-' : ''}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ciudad</p>
                                <p className="font-medium">{profile.address?.city || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Provincia</p>
                                <p className="font-medium">{profile.address?.province || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">País</p>
                                <p className="font-medium">{profile.address?.country || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Código Postal</p>
                                <p className="font-medium">{profile.address?.zipCode || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button for Edit */}
            <div className="fixed bottom-8 right-8 z-10 md:absolute md:bottom-0 md:right-0 md:mb-12 md:mr-4">
                 <button
                    onClick={() => navigate('/profile/edit')}
                    className="flex items-center justify-center bg-black text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-800 transition-all hover-lift"
                 >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Modificar Perfil
                 </button>
            </div>
        </div>
    );
};

export default Profile;
