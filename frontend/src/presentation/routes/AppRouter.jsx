import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminRoute from './AdminRoute.jsx';

// Layout
import Layout from '../components/layout/Layout.jsx';

// Client Pages
import Home from '../pages/client/Home/Home.jsx';
import ProductDetail from '../pages/client/ProductDetail/ProductDetail.jsx';
import Cart from '../pages/client/Cart/Cart.jsx';
import Checkout from '../pages/client/Checkout/Checkout.jsx';
import PaymentConfirmation from '../pages/client/PaymentConfirmation/PaymentConfirmation.jsx';
import PaymentSuccess from '../pages/client/PaymentSuccess/PaymentSuccess.jsx';
import Profile from '../pages/client/Profile/Profile.jsx';
import EditProfile from '../pages/client/Profile/EditProfile.jsx';
import Login from '../pages/client/Auth/Login.jsx';
import Register from '../pages/client/Auth/Register.jsx';
import MyOrders from '../pages/client/Orders/MyOrders.jsx';
import OrderDetail from '../pages/client/Orders/OrderDetail.jsx';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard/AdminDashboard.jsx';
import ProductList from '../pages/admin/Products/ProductEdit.jsx';
import ProductCreate from '../pages/admin/Products/ProductCreate.jsx';
import CategoryCreate from '../pages/admin/Categories/CategoryCreate.jsx';
import SalesManagement from '../pages/admin/Sales/SalesManagement.jsx';

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />

                    {/* Protected Client Routes */}
                    <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                    <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="payment-confirmation/:orderId" element={<ProtectedRoute><PaymentConfirmation /></ProtectedRoute>} />
                    <Route path="payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                    <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                    <Route path="my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                    <Route path="orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

                    {/* Admin Routes */}
                    <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="admin/products/create" element={<AdminRoute><ProductCreate /></AdminRoute>} />
                    <Route path="admin/products" element={<AdminRoute><ProductList /></AdminRoute>} />
                    <Route path="admin/categories/create" element={<AdminRoute><CategoryCreate /></AdminRoute>} />
                    <Route path="admin/sales" element={<AdminRoute><SalesManagement /></AdminRoute>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
