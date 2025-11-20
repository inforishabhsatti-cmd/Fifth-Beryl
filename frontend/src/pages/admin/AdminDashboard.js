import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, TrendingUp, BarChart3, ShoppingCart, Percent } from 'lucide-react'; // ADDED: Percent icon
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { currentUser: user, api } = useAuth(); // Uses the 'api' object from context
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Uses the 'api' object which handles the token automatically
      const response = await api.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-40 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair text-black">Admin Access Required</h2>
          <p className="text-gray-500 mb-8">Please sign in to access the admin dashboard</p>
          <Button onClick={() => navigate('/login')} className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-none uppercase tracking-wide">
            Sign In
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const menuItems = [
    { icon: <Package size={24} />, title: 'Products', description: 'Manage products', link: '/admin/products' },
    { icon: <ShoppingCart size={24} />, title: 'Orders', description: 'View & manage orders', link: '/admin/orders' },
    { icon: <ShoppingBag size={24} />, title: 'Inventory', description: 'Track stock levels', link: '/admin/inventory' },
    // ADDED: Coupon Management Link
    { icon: <Percent size={24} />, title: 'Coupons', description: 'Create discount codes', link: '/admin/coupons' }, 
    { icon: <BarChart3 size={24} />, title: 'Analytics', description: 'Sales & reports', link: '/admin/analytics' },
    { icon: <TrendingUp size={24} />, title: 'Landing Page', description: 'Customize homepage', link: '/admin/landing-page' }
  ];

  return (
    <div className="min-h-screen bg-white pt-24"> {/* Added pt-24 to prevent navbar overlap */}
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-b border-gray-100 pb-8"
        >
          <h1 className="text-4xl font-bold mb-2 playfair text-black" data-testid="admin-dashboard-title">Admin Dashboard</h1>
          <p className="text-gray-500">Manage your Fifth Beryl store overview</p>
        </motion.div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              data-testid="stat-orders"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-black text-white p-3">
                  <ShoppingCart size={20} />
                </div>
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-black">{analytics.total_orders}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              data-testid="stat-revenue"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-100 text-black p-3">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-black">₹{analytics.total_revenue.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              data-testid="stat-products"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-100 text-black p-3">
                  <Package size={20} />
                </div>
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Products</p>
              <p className="text-3xl font-bold text-black">{analytics.total_products}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              data-testid="stat-avg-order"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-100 text-black p-3">
                  <BarChart3 size={20} />
                </div>
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Avg Order Value</p>
              <p className="text-3xl font-bold text-black">
                ₹{analytics.total_orders > 0 ? (analytics.total_revenue / analytics.total_orders).toFixed(2) : '0'}
              </p>
            </motion.div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-8 playfair text-black">Quick Actions</h2>

        {/* Quick Actions Grid */}
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
                <div className="bg-white border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col justify-between group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-black transform -translate-x-1 group-hover:translate-x-0 transition-transform duration-300"></div>
                  <div>
                    <div className="text-black mb-6 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-2 playfair text-black group-hover:translate-x-2 transition-transform duration-300">{item.title}</h3>
                    <p className="text-gray-500 text-sm group-hover:translate-x-2 transition-transform duration-300">{item.description}</p>
                  </div>
                  <div className="mt-6 w-8 h-px bg-gray-300 group-hover:w-full group-hover:bg-black transition-all duration-500"></div>
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