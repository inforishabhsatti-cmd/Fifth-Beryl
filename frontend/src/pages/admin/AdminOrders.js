import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

const AdminOrders = () => {
  const { api } = useAuth(); // Use 'api'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status?status=${newStatus}`);
      toast.success('Order status updated');
      fetchOrders(); // Refresh
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="text-black" size={20} />;
      case 'cancelled': return <XCircle className="text-red-500" size={20} />;
      case 'shipped': return <Truck className="text-gray-600" size={20} />;
      default: return <Package className="text-gray-400" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="outline" size="icon" className="rounded-none border-black hover:bg-black hover:text-white">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold playfair text-black">Manage Orders</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Order ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Items</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Total</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <motion.tr 
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-black">{order.id.substring(0, 8)}</td>
                      <td className="py-4 px-6 text-gray-600">
                        <div className="font-medium text-black">{order.shipping_address.name}</div>
                        <div className="text-xs text-gray-500">{order.user_email}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {order.items.length} items
                      </td>
                      <td className="py-4 px-6 font-bold text-black">₹{order.total_amount}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Select 
                            defaultValue={order.status} 
                            onValueChange={(val) => updateStatus(order.id, val)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs border-gray-300 rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminOrders;