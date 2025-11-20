import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, ChevronDown, Save, Link as LinkIcon, Edit3 } from 'lucide-react'; // Added icons
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
// Footer removed
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input'; // ADDED: Input
import { Label } from '../../components/ui/label'; // ADDED: Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from '../../components/ui/dialog'; // ADDED: Dialog imports
import { toast } from 'sonner';

const AdminOrders = () => {
  const { api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false); // State for the tracking modal
  const [currentOrder, setCurrentOrder] = useState(null);
  const [trackingData, setTrackingData] = useState({
      status: '',
      tracking_number: '',
      courier: ''
  });

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

  const handleOpenUpdateModal = (order) => {
    setCurrentOrder(order);
    setTrackingData({
        status: order.status,
        tracking_number: order.tracking_number || '',
        courier: order.courier || ''
    });
    setDialogOpen(true);
  };
  
  const handleSaveUpdate = async () => {
    if (!currentOrder || !trackingData.status) return;

    if (trackingData.status === 'shipped' && (!trackingData.tracking_number || !trackingData.courier)) {
        toast.error('Tracking number and courier are required when setting status to "Shipped".');
        return;
    }
    
    try {
        await api.put(`/orders/${currentOrder.id}/status`, {
            status: trackingData.status,
            tracking_number: trackingData.tracking_number || null,
            courier: trackingData.courier || null
        });
        toast.success('Order status and tracking updated');
        setDialogOpen(false);
        fetchOrders();
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
  
  const formatAddress = (addr) => {
      const parts = [
          addr.address_line1,
          addr.address_line2,
          `${addr.city} ${addr.postal_code}`,
          `${addr.state}, ${addr.country}`,
      ].filter(p => p && p.trim() && p.trim() !== ','); // Filter out empty strings/optional lines
      return parts.join(', ');
  }
  
  const trackingUrlBase = {
      'FedEx': 'https://www.fedex.com/apps/fedextrack/?tracknumbers=',
      'Delhivery': 'https://www.delhivery.com/track/package/',
      // Add more courier base URLs here
  };
  const getTrackingLink = (courier, number) => {
      if (courier && number && trackingUrlBase[courier]) {
          return trackingUrlBase[courier] + number;
      }
      return null;
  }

  return (
    <div className="min-h-screen bg-white pt-24">
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
        
        {/* Tracking Update Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md bg-white rounded-none border-black">
                <DialogHeader>
                    <DialogTitle className="playfair text-2xl">Update Order #{currentOrder?.id.substring(0, 8)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    
                    {/* Status Selection */}
                    <div>
                        <Label htmlFor="status">Order Status</Label>
                        <Select 
                            value={trackingData.status} 
                            onValueChange={(val) => setTrackingData({...trackingData, status: val})}
                        >
                            <SelectTrigger id="status" className="w-full rounded-none border-gray-300 focus:border-black">
                                <SelectValue placeholder="Select Status" />
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

                    {/* Tracking Number */}
                    {trackingData.status === 'shipped' && (
                        <>
                            <div>
                                <Label htmlFor="tracking_number">Tracking Number</Label>
                                <Input 
                                    id="tracking_number"
                                    value={trackingData.tracking_number}
                                    onChange={(e) => setTrackingData({...trackingData, tracking_number: e.target.value})}
                                    className="rounded-none border-gray-300 focus:border-black"
                                    placeholder="Enter tracking number"
                                />
                            </div>
                            
                            {/* Courier Selection */}
                            <div>
                                <Label htmlFor="courier">Courier Service</Label>
                                <Input 
                                    id="courier"
                                    value={trackingData.courier}
                                    onChange={(e) => setTrackingData({...trackingData, courier: e.target.value})}
                                    className="rounded-none border-gray-300 focus:border-black"
                                    placeholder="e.g., FedEx, Delhivery"
                                />
                            </div>
                        </>
                    )}

                    <Button onClick={handleSaveUpdate} className="w-full bg-black text-white hover:bg-gray-800 rounded-none py-3">
                        <Save size={18} className="mr-2" /> Save Update
                    </Button>
                </div>
            </DialogContent>
        </Dialog>


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
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Address & Phone</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Total Paid</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Tracking</th>
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
                      <td className="py-4 px-6 font-medium text-black text-xs">{order.id.substring(0, 8)}</td>
                      <td className="py-4 px-6 text-gray-600">
                        <div className="font-medium text-black">{order.shipping_address.name || order.user_email}</div>
                        <div className="text-xs text-gray-500">{order.user_email}</div>
                        {order.coupon_code && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                                Coupon: {order.coupon_code}
                            </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm max-w-xs">
                          <div className="text-black font-medium">{order.shipping_address.phone}</div>
                          <div className="text-xs">{formatAddress(order.shipping_address)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-black">
                            ₹{order.final_amount ? order.final_amount.toFixed(2) : order.total_amount.toFixed(2)}
                        </div>
                        {order.discount_amount > 0 && (
                            <div className="text-xs text-red-500 flex items-center">
                                (- ₹{order.discount_amount.toFixed(2)})
                            </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                          <Button 
                              onClick={() => handleOpenUpdateModal(order)}
                              variant="ghost" 
                              className="px-3 py-1 h-auto text-xs font-bold uppercase tracking-wide border border-gray-300 text-black hover:bg-gray-100 rounded-none"
                          >
                             <Edit3 size={14} className="mr-1" /> {order.status}
                          </Button>
                      </td>
                      
                      {/* ADDED: Tracking Display */}
                      <td className="py-4 px-6 text-sm">
                          {order.tracking_number ? (
                              <a 
                                  href={getTrackingLink(order.courier, order.tracking_number)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                  {order.tracking_number}
                                  <LinkIcon size={14} />
                              </a>
                          ) : (
                              <span className="text-gray-500">-</span>
                          )}
                          {order.courier && <div className="text-xs text-gray-500">{order.courier}</div>}
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
    </div>
  );
};

export default AdminOrders;