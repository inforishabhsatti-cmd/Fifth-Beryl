import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import './App.css';
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

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from './components/ui/toaster';
import AdminRoute from './components/AdminRoute';
import SplashShutter from './components/SplashShutter';

function App() {
  const [isShutterLoading, setIsShutterLoading] = useState(true);

  // FIX: Use useEffect to lock/unlock scroll on the body tag
  useEffect(() => {
    if (isShutterLoading) {
      // Lock scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock scrolling
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to ensure scroll is re-enabled when the component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isShutterLoading]);

  // Callback function to hide the shutter after the animation completes
  const handleShutterComplete = () => {
    setIsShutterLoading(false);
  };

  // We keep the main app container visible, but blur it and disable interaction while loading
  const appEffectClass = isShutterLoading 
    ? 'app-content-blur' 
    : 'app-content-unblur';

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {/* 1. Main App Content - Visible, but blurred if loading */}
              <div className={`flex flex-col min-h-screen ${appEffectClass}`}>
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />

                    {/* Admin Routes (Protected) */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/products" element={<AdminProducts />} />
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route path="/admin/inventory" element={<AdminInventory />} />
                      <Route path="/admin/analytics" element={<AdminAnalytics />} />
                      <Route path="/admin/landing-page" element={<AdminLandingPage />} />
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
                <Toaster />
              </div>

              {/* 2. Splash Screen - Rendered only when loading, floating above the blurred app */}
              {isShutterLoading && <SplashShutter onComplete={handleShutterComplete} />}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;