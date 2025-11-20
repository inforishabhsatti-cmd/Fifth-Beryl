import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'];

const AdminAnalytics = () => {
  const { api } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // 'api' handles the token automatically
      const response = await api.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusData = analytics ? Object.entries(analytics.status_counts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  })) : [];

  const revenueData = analytics?.recent_orders.slice(0, 10).reverse().map((order, index) => ({
    name: `Order ${index + 1}`,
    // NOTE: Changed to final_amount if it exists, otherwise it defaults to total_amount
    amount: order.final_amount || order.total_amount 
  })) || [];

  return (
    <div className="min-h-screen bg-white pt-24">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="outline" size="icon" className="rounded-none border-black hover:bg-black hover:text-white" data-testid="back-btn">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold playfair text-black" data-testid="admin-analytics-title">Sales Analytics</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : analytics && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 p-6 shadow-sm"
              >
                <p className="text-gray-500 mb-2 text-sm uppercase tracking-wider">Total Orders</p>
                <p className="text-4xl font-bold text-black">{analytics.total_orders}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 p-6 shadow-sm"
              >
                <p className="text-gray-500 mb-2 text-sm uppercase tracking-wider">Total Revenue</p>
                <p className="text-4xl font-bold text-black">₹{analytics.total_revenue.toFixed(2)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 p-6 shadow-sm"
              >
                <p className="text-gray-500 mb-2 text-sm uppercase tracking-wider">Avg. Order Value</p>
                <p className="text-4xl font-bold text-black">
                  ₹{analytics.total_orders > 0 ? (analytics.total_revenue / analytics.total_orders).toFixed(2) : '0'}
                </p>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Status Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border border-gray-200 p-6 shadow-sm"
              >
                <h2 className="text-2xl font-bold mb-6 playfair text-black">Order Status Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Recent Orders Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white border border-gray-200 p-6 shadow-sm"
              >
                <h2 className="text-2xl font-bold mb-6 playfair text-black">Recent Orders Revenue</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{fill: '#f5f5f5'}} />
                    <Bar dataKey="amount" fill="#000000" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Recent Orders Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border border-gray-200 p-6 shadow-sm"
              data-testid="recent-orders-table"
            >
              <h2 className="text-2xl font-bold mb-6 playfair text-black">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recent_orders.map((order, index) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors" data-testid={`order-row-${index}`}>
                        <td className="py-3 px-4 text-gray-600">{order.id.substring(0, 8)}</td>
                        <td className="py-3 px-4 text-gray-600">{order.user_email}</td>
                        <td className="py-3 px-4 font-semibold text-black">
                            {/* Use final_amount if available, otherwise total_amount */}
                            ₹{order.final_amount !== undefined ? order.final_amount.toFixed(2) : order.total_amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 text-xs font-bold border border-black text-black uppercase tracking-wide">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;