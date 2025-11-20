import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, XCircle, Link as LinkIcon, IndianRupee } from 'lucide-react'; // ADDED: LinkIcon, IndianRupee
import Navbar from '../components/Navbar';
// Footer import is kept, but component usage removed below
import Footer from '../components/Footer'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // ADDED: Link from router-dom
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';


const OrdersPage = () => {
  const { currentUser: user, api, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define tracking URL bases for easy link creation
  const trackingUrlBase = {
      'FedEx': 'https://www.fedex.com/apps/fedextrack/?tracknumbers=',
      'Delhivery': 'https://www.delhivery.com/track/package/',
      // Add more courier base URLs here if needed
  };

  const getTrackingLink = (courier, number) => {
      if (courier && number && trackingUrlBase[courier]) {
          return trackingUrlBase[courier] + number;
      }
      return null;
  }
  
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="text-black" size={24} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={24} />;
      case 'shipped':
        return <Truck className="text-gray-600" size={24} />;
      default:
        return <Package className="text-gray-400" size={24} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-black text-white';
      case 'cancelled':
        return 'bg-red-50 text-red-800 border border-red-100';
      case 'shipped':
        return 'bg-gray-100 text-black border border-gray-300';
      case 'processing':
        return 'bg-white text-black border border-black';
      default:
        return 'bg-gray-50 text-gray-500 border border-gray-200';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center py-40"><div className="spinner" /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-40 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair text-black">Please Sign In</h2>
          <p className="text-gray-500 mb-8">Sign in to view your orders</p>
          <Button onClick={() => navigate('/login')} className="bg-black hover:bg-gray-800 text-white rounded-none px-8 py-3 uppercase tracking-wide">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-12 playfair text-black border-b border-gray-100 pb-4"
          data-testid="orders-title"
        >
          My Orders
        </motion.h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20" data-testid="no-orders">
            <Package size={64} className="mx-auto text-gray-300 mb-6" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold mb-4 playfair text-black">No orders yet</h2>
            <p className="text-gray-500 mb-8">Start shopping to place your first order</p>
            <Button onClick={() => navigate('/products')} className="bg-black hover:bg-gray-800 text-white rounded-none px-8 py-3 uppercase tracking-wide">
              Shop Now
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300"
                data-testid={`order-${index}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b border-gray-200 pb-6">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                      <p className="font-semibold text-black font-mono">{order.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`px-4 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
                      {/* FIX: Using final_amount (after discount) for display */}
                      <p className="text-xl font-bold text-black">₹{order.final_amount ? order.final_amount.toFixed(2) : order.total_amount.toFixed(2)}</p> 
                    </div>
                  </div>
                </div>
                
                {/* Tracking Information (NEW) */}
                {(order.tracking_number && order.courier && order.status !== 'delivered' && order.status !== 'cancelled') && (
                    <div className="p-3 bg-gray-50 border border-gray-200 mt-4 mb-4 flex justify-between items-center rounded-none">
                        <div className="flex items-center">
                            <Truck size={20} className="text-black mr-3"/>
                            <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wider">Tracking ({order.courier})</p>
                                <a 
                                    href={getTrackingLink(order.courier, order.tracking_number)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 text-sm"
                                >
                                    {order.tracking_number}
                                    <LinkIcon size={14} />
                                </a>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white text-black border-black rounded-none"
                            asChild
                        >
                            <a href={getTrackingLink(order.courier, order.tracking_number)} target="_blank" rel="noopener noreferrer">Track Order</a>
                        </Button>
                    </div>
                )}
                {/* Discount Info */}
                {order.discount_amount > 0 && (
                    <div className="flex justify-between items-center pt-2 pb-2 text-sm text-green-600">
                        <span className="font-medium flex items-center gap-1">
                            <IndianRupee size={14} /> Coupon Discount ({order.coupon_code})
                        </span>
                        <span>- ₹{order.discount_amount.toFixed(2)}</span>
                    </div>
                )}

                <div className="pt-2">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-black border-t border-gray-100 pt-4">Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-black text-lg playfair">{item.product_name}</p>
                          <p className="text-sm text-gray-500">
                            {item.color} | Size: {item.size} | Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-black">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-2 text-black">Shipping Address</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {order.shipping_address.name}<br />
                      {order.shipping_address.address_line1}<br />
                      {order.shipping_address.address_line2 && <>{order.shipping_address.address_line2}<br /></>}
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
                      {order.shipping_address.country}<br />
                      Phone: {order.shipping_address.phone}
                    </p>
                  </div>
                  <div className="flex items-end justify-start md:justify-end">
                      <p className="text-sm text-gray-400">Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                      })}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;