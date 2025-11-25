import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, TrendingUp, BarChart3, ShoppingCart, Percent, Zap, Users, AlertTriangle } from 'lucide-react';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { currentUser: user, api } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkLoading, setCheckLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchAnalytics();
    else setLoading(false);
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAbandonedCheck = async () => {
    setCheckLoading(true);
    try {
      const res = await api.post('/admin/check-abandoned-carts');
      toast.success(res.data.message);
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to run abandoned cart check.');
    } finally {
      setCheckLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6">
        <h2 className="text-3xl font-bold mb-4 playfair">Admin Access Required</h2>
        <p className="text-gray-500 mb-6">Please sign in to access the admin dashboard</p>
        <Button onClick={() => navigate('/login')} className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-none">
          Sign In
        </Button>
      </div>
    );
  }

  const menuItems = [
    { icon: <Package size={24} />, title: 'Products', description: 'Manage products', link: '/admin/products' },
    { icon: <ShoppingCart size={24} />, title: 'Orders', description: 'View & manage orders', link: '/admin/orders' },
    { icon: <Users size={24} />, title: 'Customers', description: 'Analytics & returns', link: '/admin/customers' },
    { icon: <ShoppingBag size={24} />, title: 'Inventory', description: 'Track stock levels', link: '/admin/inventory' },
    { icon: <Percent size={24} />, title: 'Coupons', description: 'Create discount codes', link: '/admin/coupons' },
    { icon: <BarChart3 size={24} />, title: 'Analytics', description: 'Sales & reports', link: '/admin/analytics' },
    { icon: <Zap size={24} />, title: 'Running Label', description: 'Edit scrolling text', link: '/admin/ticker' },
    { icon: <TrendingUp size={24} />, title: 'Landing Page', description: 'Customize homepage', link: '/admin/landing-page' }
  ];

  return (
    <div className="min-h-screen bg-white pt-28"> {/* fixed padding top only — no navbar here */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 pb-8 border-b border-gray-100 flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2 playfair text-black">Admin Dashboard</h1>
            <p className="text-gray-500">Overview of your Fifth Beryl store</p>
          </div>

          <Button
            onClick={handleAbandonedCheck}
            disabled={checkLoading}
            variant="destructive"
            className="rounded-none bg-red-600 hover:bg-red-700 hidden sm:flex items-center"
          >
            <AlertTriangle className="mr-2" size={16} />
            {checkLoading ? 'Checking...' : 'Run Abandoned Cart Check'}
          </Button>
        </motion.div>

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner" /></div>
        ) : analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Total Orders */}
            <Stat title="Total Orders" value={analytics.total_orders} icon={<ShoppingCart size={20} />} />
            {/* Revenue */}
            <Stat title="Total Revenue" value={`₹${analytics.total_revenue.toFixed(2)}`} icon={<TrendingUp size={20} />} delay={0.1} />
            {/* Products */}
            <Stat title="Total Products" value={analytics.total_products} icon={<Package size={20} />} delay={0.2} />
            {/* AOV */}
            <Stat
              title="Avg Order Value"
              value={`₹${analytics.total_orders > 0 ? (analytics.total_revenue / analytics.total_orders).toFixed(2) : '0'}`}
              icon={<BarChart3 size={20} />}
              delay={0.3}
            />
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-2xl font-bold mb-8 playfair text-black">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + index * 0.1 }}>
              <Link to={item.link}>
                <div className="bg-white border border-gray-200 p-8 shadow-sm hover:shadow-lg h-full flex flex-col justify-between group transition-all duration-300 cursor-pointer relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-black -translate-x-1 group-hover:translate-x-0 transition-transform duration-300"></div>
                  <div>
                    <div className="text-black mb-6">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-2 playfair text-black">{item.title}</h3>
                    <p className="text-gray-500 text-sm">{item.description}</p>
                  </div>
                  <div className="mt-6 w-8 h-px bg-gray-300 group-hover:w-full group-hover:bg-black transition-all duration-500"></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      
    </div>
  );
};

// Stat Card Component
const Stat = ({ title, value, icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-center justify-between mb  -4">
      <div className="bg-black text-white p-3">{icon}</div>
    </div>
    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{title}</p>
    <p className="text-3xl font-bold text-black">{value}</p>
  </motion.div>
);

export default AdminDashboard;
