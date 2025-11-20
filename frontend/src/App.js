import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import './App.css';
// Contexts
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminInventory from './pages/admin/AdminInventory';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminLandingPage from './pages/admin/AdminLandingPage';
import AdminCoupons from './pages/admin/AdminCoupons'; // NEW: Coupon Page

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from './components/ui/toaster';
import AdminRoute from './components/AdminRoute';
import SplashShutter from './components/SplashShutter';

function App() {
  const [isShutterLoading, setIsShutterLoading] = useState(true);

  // Effect to manage body scroll lock during splash screen
  useEffect(() => {
    if (isShutterLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
    };
  }, [isShutterLoading]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <div className="relative min-h-screen">
                
                {/* 1. Main Application Structure (Always rendered) */}
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminRoute />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="inventory" element={<AdminInventory />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="landing-page" element={<AdminLandingPage />} />
                      <Route path="coupons" element={<AdminCoupons />} /> {/* NEW ROUTE */}
                      {/* Catch-all for /admin/* */}
                      <Route path="*" element={<Navigate to="/admin" />} />
                    </Route>

                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
                <Footer />

                {/* 2. Splash Screen Overlay (Renders on top if loading) */}
                {isShutterLoading && (
                  <SplashShutter onComplete={() => setIsShutterLoading(false)} />
                )}
              </div>
            </Router>
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;