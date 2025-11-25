import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, XCircle, Link as LinkIcon, IndianRupee, RotateCcw } from 'lucide-react'; // ADDED: RotateCcw for returns
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Helper component for the Return Request Modal
const ReturnRequestModal = ({ orderId, api, onReturnSubmitted }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleReturnRequest = async () => {
        if (reason.length < 10) {
            toast.error('Please provide a reason of at least 10 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post(`/orders/${orderId}/return`, { reason });
            toast.success('Return request submitted!');
            setDialogOpen(false);
            onReturnSubmitted(); // Trigger parent fetch
        } catch (error) {
            console.error('Error submitting return:', error.response?.data || error);
            const errorMessage = error.response?.data?.detail || 'Failed to submit return request.';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white text-black border-black rounded-none hover:bg-gray-50"
                >
                    <RotateCcw size={16} className="mr-2" /> Request Return
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white rounded-none border-black">
                <DialogHeader>
                    <DialogTitle className="playfair text-xl">Request Return for Order ID: {orderId.substring(0, 8).toUpperCase()}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">You are requesting a return within the 15-day eligibility window.</p>
                    <Label htmlFor="return-reason">Reason for Return *</Label>
                    <Textarea 
                        id="return-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Wrong size received, product damaged, changed mind..."
                        rows={4}
                        className="rounded-none border-gray-300 focus:border-black"
                    />
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleReturnRequest} 
                        disabled={isSubmitting || reason.length < 10}
                        className="bg-black text-white hover:bg-gray-800 rounded-none w-full"
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const OrdersPage = () => {
    const { currentUser: user, api, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const isReturnEligible = (order) => {
        // Must be delivered
        if (order.status !== 'delivered') return false;
        
        // Must not have a return already requested or completed
        if (order.return_status && order.return_status !== 'none' && order.return_status !== 'rejected') return false;

        const deliveredDateStr = order.updated_at || order.created_at;
        try {
            const deliveredDate = new Date(deliveredDateStr);
            const today = new Date();
            const diffTime = Math.abs(today - deliveredDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Check if within 15 days (less than or equal to 15 days old)
            return diffDays <= 15;
        } catch {
            return false;
        }
    };
    
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
            case 'abandoned':
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
            case 'abandoned':
                return 'bg-red-50 text-red-800 border border-red-100';
            case 'shipped':
                return 'bg-gray-100 text-black border border-gray-300';
            case 'processing':
                return 'bg-white text-black border border-black';
            default:
                return 'bg-gray-50 text-gray-500 border border-gray-200';
        }
    };
    
    const getReturnTag = (returnStatus) => {
        switch(returnStatus) {
            case 'requested':
                return <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1"><RotateCcw size={12} /> Return Requested</span>;
            case 'approved':
                return <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Return Approved</span>;
            case 'rejected':
                return <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 rounded-full flex items-center gap-1"><XCircle size={12} /> Return Rejected</span>;
            case 'completed':
                return <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-black text-white rounded-full flex items-center gap-1"><IndianRupee size={12} /> Refund Completed</span>;
            default:
                return null;
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
                        {orders.map((order, index) => {
                            const trackingLink = getTrackingLink(order.courier, order.tracking_number);
                            const eligibleForReturn = isReturnEligible(order);

                            return (
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
                                            {/* Order Status Tag */}
                                            <span className={`px-4 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            {/* Return Status Tag (if applicable) */}
                                            {order.return_status && order.return_status !== 'none' && getReturnTag(order.return_status)}
                                            
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
                                                <p className="text-xl font-bold text-black">₹{order.final_amount ? order.final_amount.toFixed(2) : order.total_amount.toFixed(2)}</p> 
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Tracking Information */}
                                    {(order.tracking_number && order.courier && order.status !== 'delivered' && order.status !== 'cancelled') && (
                                        <div className="p-3 bg-gray-50 border border-gray-200 mt-4 mb-4 flex justify-between items-center rounded-none">
                                            <div className="flex items-center">
                                                <Truck size={20} className="text-black mr-3"/>
                                                <div>
                                                    <p className="text-xs text-gray-600 uppercase tracking-wider">Tracking ({order.courier})</p>
                                                    <a 
                                                        href={trackingLink} 
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
                                                <a href={trackingLink} target="_blank" rel="noopener noreferrer">Track Order</a>
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
                                        <div className="flex flex-col items-start md:items-end justify-between">
                                            <p className="text-sm text-gray-400">Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</p>
                                            
                                            {/* Return Button */}
                                            {eligibleForReturn && (
                                                <div className="mt-4 md:mt-0">
                                                    <ReturnRequestModal 
                                                        orderId={order.id}
                                                        api={api}
                                                        onReturnSubmitted={fetchOrders}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">15-day return window available.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;