import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, TrendingUp, Users, BarChart3, ShoppingCart } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Button } from '../../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, token, signInWithGoogle } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      fetchAnalytics();
    }
  }, [user, token]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair">Admin Access Required</h2>
          <p className="text-gray-600 mb-8">Please sign in to access the admin dashboard</p>
          <Button onClick={signInWithGoogle} className="bg-emerald-600 hover:bg-emerald-700">
            Sign In with Google
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const menuItems = [
    { icon: <Package size={24} />, title: 'Products', description: 'Manage products', link: '/admin/products', color: 'emerald' },
    { icon: <ShoppingCart size={24} />, title: 'Orders', description: 'View & manage orders', link: '/admin/orders', color: 'blue' },
    { icon: <ShoppingBag size={24} />, title: 'Inventory', description: 'Track stock levels', link: '/admin/inventory', color: 'purple' },
    { icon: <BarChart3 size={24} />, title: 'Analytics', description: 'Sales & reports', link: '/admin/analytics', color: 'orange' },
    { icon: <TrendingUp size={24} />, title: 'Landing Page', description: 'Customize homepage', link: '/admin/landing-page', color: 'pink' }
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2 playfair" data-testid="admin-dashboard-title">Admin Dashboard</h1>
      <p className="text-gray-600">Manage your Fifth Beryl store</p>
    </motion.div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
              data-testid="stat-orders"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <ShoppingCart className="text-emerald-600" size={24} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold">{analytics.total_orders}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
              data-testid="stat-revenue"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">₹{analytics.total_revenue.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
              data-testid="stat-products"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Package className="text-purple-600" size={24} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Products</p>
              <p className="text-3xl font-bold">{analytics.total_products}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
              data-testid="stat-avg-order"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <BarChart3 className="text-orange-600" size={24} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Avg Order Value</p>
              <p className="text-3xl font-bold">
                ₹{analytics.total_orders > 0 ? (analytics.total_revenue / analytics.total_orders).toFixed(2) : '0'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              data-testid={`menu-item-${index}`}
            >
              <Link to={item.link}>
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                  <div className={`bg-${item.color}-100 p-4 rounded-lg mb-4 inline-block`}>
                    <div className={`text-${item.color}-600`}>{item.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 playfair">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;