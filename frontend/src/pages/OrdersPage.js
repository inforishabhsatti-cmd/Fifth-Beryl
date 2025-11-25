import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, XCircle, Link as LinkIcon, IndianRupee, RotateCcw, Loader2, CornerDownLeft, Repeat2, Zap } from 'lucide-react'; // ADDED: Zap
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'; // Added ToggleGroup

// --- NEW HELPER COMPONENT: ReturnRequestDialog ---
const ReturnRequestDialog = ({ order, api, onReturnSubmitted }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [type, setType] = useState('return'); // 'return' or 'replacement'
    const [selectedItem, setSelectedItem] = useState(null); // The actual item object being replaced/returned
    const [replacementColor, setReplacementColor] = useState(null);
    const [replacementSize, setReplacementSize] = useState(null);
    const [productDetails, setProductDetails] = useState({}); // Stores details for items in the order

    // Calculate if the 15-day return window is active
    const isReturnWindowActive = () => {
        if (!order || !order.created_at) return false;
        const purchaseDate = new Date(order.created_at);
        const deadlineDate = new Date(purchaseDate);
        deadlineDate.setDate(purchaseDate.getDate() + 15);
        return new Date() <= deadlineDate;
    };

    const fetchProductDetails = async (productId) => {
        if (productDetails[productId]) return productDetails[productId];

        try {
            // Assuming /api/products/{id} works based on server.py's slug_or_id
            const response = await api.get(`/products/${productId}`);
            const details = response.data;
            setProductDetails(prev => ({ ...prev, [productId]: details }));
            return details;
        } catch (error) {
            console.error('Error fetching product details for replacement:', error);
            // Don't toast here, it's disruptive; the item selection handles the error implicitly.
            return null;
        }
    };
    
    // Fetch product details for all items in the order when dialog opens
    useEffect(() => {
        if (dialogOpen) {
            // Reset state on open
            setSelectedItem(null);
            setReplacementColor(null);
            setReplacementSize(null);
            setReason('');
            
            order.items.forEach(item => {
                fetchProductDetails(item.product_id);
            });
        }
    }, [dialogOpen, order.items]);

    const handleItemSelection = (indexStr) => {
        const index = parseInt(indexStr);
        const item = order.items[index];
        setSelectedItem(item);
        // Reset replacement fields when a new item is selected
        setReplacementColor(item.color); 
        setReplacementSize(item.size); 
    };


    const handleRequest = async () => {
        if (reason.length < 10) {
            toast.error("Please provide a detailed reason (min 10 characters).");
            return;
        }
        if (!selectedItem) {
             toast.error("Please select the item you wish to return or replace.");
            return;
        }
        if (type === 'replacement' && (!replacementColor || !replacementSize)) {
            toast.error("Please select the desired replacement size and color.");
            return;
        }

        setLoading(true);

        const new_item_details = type === 'replacement' ? {
            product_id: selectedItem.product_id,
            item_color: selectedItem.color,
            item_size: selectedItem.size,
            new_color: replacementColor,
            new_size: replacementSize
        } : null;

        try {
            await api.post(`/orders/${order.id}/request-return`, {
                return_reason: reason,
                return_type: type,
                requested_item: selectedItem, // Pass the original item object
                new_item_details: new_item_details
            });
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} request submitted successfully!`);
            setDialogOpen(false);
            onReturnSubmitted(); // Refresh orders list
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to submit request.';
            console.error('Error submitting return request:', error.response?.data || error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    // Check if a return is already requested
    const isRequested = order.return_status && order.return_status !== 'none' && order.return_status !== 'rejected';
    
    if (!isReturnWindowActive()) {
        return (
            <Button variant="outline" size="sm" disabled className="text-xs h-8 px-3 rounded-none">
                Return Window Expired
            </Button>
        );
    }
    
    const selectedProduct = selectedItem ? productDetails[selectedItem.product_id] : null;
    const availableVariants = selectedProduct?.variants || [];
    const availableSizes = availableVariants.find(v => v.color === replacementColor)?.sizes || {};
    // Calculate stock for the item if it's selected and replacement options are chosen
    const currentStock = replacementSize && availableSizes[replacementSize] !== undefined 
        ? availableSizes[replacementSize] 
        : null;
    const hasEnoughStock = currentStock !== null ? currentStock >= (selectedItem?.quantity || 1) : true;

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-8 px-3 rounded-none border-black hover:bg-black hover:text-white"
                    disabled={isRequested}
                >
                    {isRequested ? order.return_status.charAt(0).toUpperCase() + order.return_status.slice(1) : "Return / Replace"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white rounded-none border-black">
                <DialogHeader>
                    <DialogTitle className="playfair text-2xl">Issue Return or Replacement</DialogTitle>
                    <DialogDescription>
                        You have 15 days from purchase date ({new Date(order.created_at).toLocaleDateString()}) to submit a request.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Item Selection */}
                    <div className="space-y-2 border-b pb-4">
                        <Label>Select Item for Action (Only 1 item per request)</Label>
                        <Select 
                            onValueChange={handleItemSelection}
                            value={selectedItem ? order.items.findIndex(item => item.product_id === selectedItem.product_id && item.color === selectedItem.color && item.size === selectedItem.size).toString() : ""}
                        >
                            <SelectTrigger className="rounded-none border-gray-300 focus:border-black">
                                <SelectValue placeholder="Select an item from your order" />
                            </SelectTrigger>
                            <SelectContent>
                                {order.items.map((item, index) => (
                                    <SelectItem key={index} value={index.toString()}>
                                        {item.product_name} ({item.color} / {item.size}) - Qty: {item.quantity}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Request Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type-select">Request Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger id="type-select" className="rounded-none border-gray-300 focus:border-black">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="return">Return (Full Refund)</SelectItem>
                                <SelectItem value="replacement" disabled={!selectedItem}>Replacement (Exchange same product)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Replacement Options (Conditional) */}
                    {type === 'replacement' && selectedItem && selectedProduct && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="p-4 border border-blue-200 bg-blue-50 space-y-3 rounded-none"
                        >
                            <h3 className="font-semibold flex items-center text-blue-800">
                                <Repeat2 size={16} className="mr-2" /> Desired Replacement Details
                            </h3>
                            <p className="text-sm">Original: {selectedItem.color} / {selectedItem.size} - Qty: {selectedItem.quantity}</p>
                            
                            <Label>New Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {availableVariants.map(variant => (
                                    <Button
                                        key={variant.color}
                                        onClick={() => {
                                            setReplacementColor(variant.color);
                                            // Reset size if color changes, unless it's the original item's size
                                            const newSizes = variant.sizes || {};
                                            if (newSizes[replacementSize] === undefined) {
                                                setReplacementSize(null);
                                            }
                                        }}
                                        variant={replacementColor === variant.color ? "default" : "outline"}
                                        className={`rounded-none h-10 px-4 text-xs ${replacementColor === variant.color ? 'bg-black text-white hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        <div style={{ backgroundColor: variant.color_code }} className="w-4 h-4 rounded-full border border-gray-400 mr-2"></div>
                                        {variant.color}
                                    </Button>
                                ))}
                            </div>
                            
                            {replacementColor && (
                                <>
                                    <Label className="mt-4 block">New Size</Label>
                                    <ToggleGroup 
                                        type="single" 
                                        value={replacementSize} 
                                        onValueChange={setReplacementSize}
                                        className="justify-start flex-wrap"
                                    >
                                        {Object.entries(availableSizes).map(([size, stock]) => (
                                            <ToggleGroupItem 
                                                key={size}
                                                value={size}
                                                // Disable if stock is less than the quantity the customer bought
                                                disabled={stock < selectedItem.quantity}
                                                aria-label={`Toggle size ${size}`}
                                                className={`rounded-none border-gray-300 text-xs data-[state=on]:bg-black data-[state=on]:text-white`}
                                            >
                                                {size} ({stock >= selectedItem.quantity ? `${stock} in stock` : 'Low/Out of stock'})
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                    {!hasEnoughStock && <p className="text-red-500 text-sm mt-2 flex items-center"><Zap size={16} className="mr-1"/> Low stock or Out of stock! Replacement may result in refund if approved.</p>}
                                </>
                            )}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for {type}</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="State your reason clearly (min 10 characters)."
                            rows={4}
                            className="rounded-none border-gray-300 focus:border-black"
                        />
                        <p className="text-xs text-gray-500">{reason.length}/10 characters minimum</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleRequest} 
                        disabled={loading || reason.length < 10 || !selectedItem || (type === 'replacement' && (!replacementColor || !replacementSize))}
                        className="bg-black text-white hover:bg-gray-800 rounded-none w-full"
                    >
                        {loading ? 'Submitting...' : `Submit ${type.charAt(0).toUpperCase() + type.slice(1)} Request`}
                        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ... (main OrdersPage component is below, unchanged in logic)

const OrdersPage = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders/my-orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders.');
            // If it's a 401, redirect to login
            if (error.response && error.response.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const formatCurrency = (amount) => {
        return `₹${amount.toFixed(2)}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'shipped': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            case 'pending': return 'bg-gray-100 text-gray-600';
            case 'cancelled':
            case 'abandoned': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    };
    
    const getReturnStatusDisplay = (order) => {
        const status = order.return_status;
        if (!status || status === 'none') return null;

        let icon = RotateCcw;
        let color = 'text-yellow-600';
        let label = 'Return Requested';
        
        if (status === 'approved') {
            icon = CheckCircle;
            color = 'text-green-600';
            label = 'Return Approved (Refund Pending)';
        } else if (status === 'rejected') {
            icon = XCircle;
            color = 'text-red-600';
            label = 'Return Rejected';
        } else if (status === 'completed') {
            icon = IndianRupee;
            color = 'text-black';
            label = 'Refund/Exchange Processed';
        }

        const IconComponent = icon;

        return (
            <div className="flex items-center space-x-2 mt-2 text-sm font-medium">
                <IconComponent size={16} className={color} />
                <span className={color}>{label}</span>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white pt-24">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-black" />
                    <p className="mt-4 text-gray-600">Loading your orders...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-24">
            <Navbar />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-4xl font-bold playfair text-black">Your Orders</h1>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-20 border border-gray-200 shadow-sm bg-gray-50">
                        <Package size={64} className="mx-auto text-gray-300 mb-6" strokeWidth={1.5} />
                        <h2 className="text-2xl font-bold mb-2 playfair text-black">No Orders Yet</h2>
                        <p className="text-gray-600">Looks like you haven't placed any orders. Start shopping now!</p>
                        <Link to="/products">
                            <Button className="mt-6 bg-black text-white hover:bg-gray-800 rounded-none">
                                Explore Products
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border border-gray-200 shadow-sm p-6 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center"
                            >
                                <div>
                                    <p className="font-semibold text-lg text-black font-mono">
                                        Order #{order.id.substring(0, 8).toUpperCase()}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Placed on: {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-xl font-bold text-black mt-2 flex items-center">
                                        <IndianRupee size={18} className="mr-1" />
                                        {formatCurrency(order.final_amount)}
                                    </p>
                                    
                                    {getReturnStatusDisplay(order)}

                                </div>
                                <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end space-y-2">
                                    <span 
                                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getStatusColor(order.status)}`}
                                    >
                                        {order.status}
                                    </span>
                                    <Link to={`/order/${order.id}`}>
                                        <Button variant="outline" size="sm" className="text-xs h-8 px-3 rounded-none border-black hover:bg-black hover:text-white">
                                            View Details
                                        </Button>
                                    </Link>
                                    {/* NEW: Conditional Return/Replace Button */}
                                    {(order.status === 'shipped' || order.status === 'delivered') && (
                                        <ReturnRequestDialog 
                                            order={order} 
                                            api={api} 
                                            onReturnSubmitted={fetchOrders}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default OrdersPage;