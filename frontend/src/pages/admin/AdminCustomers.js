import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, ShoppingCart, DollarSign, RotateCcw, XCircle, CheckCircle, Package, AlertTriangle, Repeat2, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';

// Helper function for coloring return status
const getStatusColor = (s) => {
    switch(s) {
        case 'requested': return 'bg-yellow-100 text-yellow-800';
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'completed': return 'bg-black text-white';
        default: return 'bg-gray-100 text-gray-600';
    }
};

// Helper component for updating return status
const ReturnStatusUpdater = ({ order, api, onUpdate }) => {
    // Determine if it's a simple return or a replacement request
    const isReplacement = order.return_reason?.startsWith('[REPLACEMENT]');
    const [action, setAction] = useState(
        order.return_status === 'approved' ? 'completed' : 
        (isReplacement ? 'approve_exchange' : 'approve_return')
    ); // Admin's selected action
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [productDetails, setProductDetails] = useState(null);

    const replacementRequest = order.replacement_request || {};
    const originalItem = replacementRequest.original_item;
    const requestedItem = replacementRequest;

    useEffect(() => {
        if (dialogOpen && isReplacement && originalItem && !productDetails) {
            fetchProductDetails(originalItem.product_id);
        }
    }, [dialogOpen, isReplacement, originalItem]);

    const fetchProductDetails = async (productId) => {
        try {
            // Assuming /api/products/{id} works based on server.py's slug_or_id
            const response = await api.get(`/products/${productId}`);
            setProductDetails(response.data);
        } catch (error) {
            console.error('Error fetching product details for replacement:', error);
            toast.error('Failed to load product details for exchange check.');
        }
    };
    
    const getStock = () => {
        if (!productDetails || !requestedItem.new_color || !requestedItem.new_size) return null;
        
        const variant = productDetails.variants.find(v => v.color === requestedItem.new_color);
        return variant?.sizes[requestedItem.new_size] || 0;
    };
    
    // Check if stock is available for the quantity the customer returned
    const isStockAvailable = getStock() >= (originalItem?.quantity || 1);
    
    // --- MAIN ACTION HANDLER ---
    const handleAction = async () => {
        setLoading(true);
        try {
            let apiPath = `/admin/returns/${order.id}/action`;
            let payload = {
                action: action,
                admin_notes: notes
            };
            
            // Handle the final status update for Approved -> Completed
            if (order.return_status === 'approved' && action === 'completed') {
                apiPath = `/admin/returns/${order.id}`;
                payload = { return_status: 'completed', admin_notes: notes };
                await api.put(apiPath, payload);
                toast.success(`Return updated to COMPLETED (Refund Processed)`);
            } 
            // Handle initial action (Approve/Decline/Exchange)
            else if (order.return_status === 'requested') {
                const response = await api.put(apiPath, payload);
                toast.success(response.data.message);
            } else {
                 throw new Error("Invalid action for current return status.");
            }
            
            setDialogOpen(false);
            onUpdate();
        } catch (error) {
            console.error('Error processing return action:', error.response?.data || error);
            const errorMessage = error.response?.data?.detail || 'Failed to process return action.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    // Simple state update for Approved/Completed transition
    if (order.return_status === 'approved' || order.return_status === 'completed') {
        return (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                 <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className={`rounded-none ${getStatusColor(order.return_status)}`}>
                        {order.return_status.charAt(0).toUpperCase() + order.return_status.slice(1)}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white rounded-none border-black">
                    <DialogHeader>
                        <DialogTitle className="playfair text-xl">Finalize Refund</DialogTitle>
                        <DialogDescription>
                            The request is already {order.return_status}. Use this to mark the refund as fully processed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Label htmlFor="status-select">New Status</Label>
                        <Select 
                             value={action} 
                             onValueChange={(v) => setAction(v)}
                        >
                            <SelectTrigger id="status-select" className="rounded-none border-gray-300 focus:border-black">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="approved">Approved (Pending Refund)</SelectItem>
                                <SelectItem value="completed">Completed (Refund Processed)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Label htmlFor="admin-notes">Admin Notes</Label>
                        <Textarea id="admin-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes for final processing..." rows={3} className="rounded-none border-gray-300 focus:border-black"/>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAction} disabled={loading} className="bg-black text-white hover:bg-gray-800 rounded-none w-full">
                            {loading ? 'Saving...' : 'Update Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
    
    // Primary "Requested" status handling
    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`rounded-none ${getStatusColor(order.return_status)}`}>
                    {order.return_status.charAt(0).toUpperCase() + order.return_status.slice(1)}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white rounded-none border-black">
                <DialogHeader>
                    <DialogTitle className="playfair text-xl">Process Return Request</DialogTitle>
                    <DialogDescription>Order ID: {order.id.substring(0, 8).toUpperCase()}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-3 border bg-gray-50 text-sm">
                        <p className="font-semibold">Customer: {order.user_email}</p>
                        <p className="mt-1">Reason: <span className="font-medium text-gray-700">{order.return_reason || 'N/A'}</span></p>
                    </div>

                    {/* Replacement Details View (Conditional) */}
                    {isReplacement && originalItem && (
                        <div className="border border-blue-200 p-4 space-y-2 bg-blue-50">
                            <h3 className="font-bold text-blue-800 flex items-center"><Repeat2 size={16} className="mr-2"/> Replacement Request</h3>
                            <p className="text-sm">Original Item: <span className="font-mono">{originalItem.product_name}</span> ({originalItem.color} / {originalItem.size}) x {originalItem.quantity}</p>
                            <p className="text-sm font-semibold">Requested: {requestedItem.new_color} / {requestedItem.new_size}</p>
                            <Separator className="bg-blue-300 my-2" />
                            <div className={`p-2 text-sm font-medium flex items-center ${isStockAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isStockAvailable ? (
                                    <> <CheckCircle size={16} className="mr-2"/> IN STOCK: {getStock()} available for replacement.</>
                                ) : (
                                    <> <AlertTriangle size={16} className="mr-2"/> OUT OF STOCK: Cannot fulfill exchange. Must initiate refund.</>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <Separator />
                    
                    <Label htmlFor="admin-action-select">Admin Action</Label>
                    <Select value={action} onValueChange={setAction}>
                        <SelectTrigger id="admin-action-select" className="rounded-none border-gray-300 focus:border-black">
                            <SelectValue placeholder="Select Action" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Standard Return Options */}
                            <SelectItem value="approve_return">Approve Return (Issue Refund)</SelectItem>
                            <SelectItem value="decline">Decline Request</SelectItem>
                            
                            {/* Replacement Options (Conditional) */}
                            {isReplacement && (
                                <>
                                    <Separator className="my-1"/>
                                    <SelectItem value="approve_exchange" disabled={!isStockAvailable}>
                                        Approve Exchange & Reissue Order
                                    </SelectItem>
                                    <SelectItem value="refund_unavailable" disabled={isStockAvailable}>
                                        Initiate Refund (Replacement Not Available)
                                    </SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>

                    <Label htmlFor="admin-notes">Admin Notes (Required for Decline)</Label>
                    <Textarea
                        id="admin-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes for the customer (e.g., reason for decline, next steps for return)."
                        rows={3}
                        className="rounded-none border-gray-300 focus:border-black"
                    />
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleAction} 
                        disabled={loading || (action === 'decline' && notes.length < 5)}
                        className={`text-white hover:bg-gray-800 rounded-none w-full ${action === 'decline' ? 'bg-red-600 hover:bg-red-700' : 'bg-black'}`}
                    >
                        {loading ? 'Processing...' : `Execute Action: ${action.replace('_', ' ').toUpperCase()}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const AdminCustomers = () => {
    const { api } = useAuth();
    const [users, setUsers] = useState([]);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState('customers');

    useEffect(() => {
        if (currentTab === 'customers') {
            fetchUserAnalytics();
        } else if (currentTab === 'returns') {
            fetchReturns();
        }
    }, [currentTab]);

    const fetchUserAnalytics = async () => {
        setLoading(true);
        try {
            // Correct API path: /api/admin/users
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching user analytics:', error);
            toast.error('Failed to fetch customer data.');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchReturns = async () => {
        setLoading(true);
        try {
            // Correct API path: /api/admin/returns
            const response = await api.get('/admin/returns');
            setReturns(response.data);
        } catch (error) {
            console.error('Error fetching returns:', error);
            toast.error('Failed to fetch return requests.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${amount.toFixed(2)}`;
    };

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
                    <h1 className="text-4xl font-bold playfair text-black">Customer & Returns Management</h1>
                </div>

                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-none h-14 bg-gray-100 p-0 mb-8">
                        <TabsTrigger value="customers" className="rounded-none text-base uppercase tracking-wider font-semibold data-[state=active]:bg-black data-[state=active]:text-white h-full">
                            Customer Analytics
                        </TabsTrigger>
                        <TabsTrigger value="returns" className="rounded-none text-base uppercase tracking-wider font-semibold data-[state=active]:bg-black data-[state=active]:text-white h-full">
                            Return Requests
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="customers">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="spinner" /></div>
                        ) : (
                            <div className="bg-white border border-gray-200 shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Customer</th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Total Spent</th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Orders</th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Abandoned Carts</th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Returns</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user, index) => (
                                                <motion.tr 
                                                    // FIX: Use user_id as key with a fallback to ensure key is unique and not null
                                                    key={user.user_id || `user-analytic-${index}`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    className="border-b border-gray-100 hover:bg-gray-50"
                                                >
                                                    <td className="py-4 px-6">
                                                        <p className="font-medium text-black">{user.name}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                        {/* FIX: Safely access user.user_id before calling substring */}
                                                        <p className="text-xs text-gray-400 mt-1">ID: {user.user_id ? user.user_id.substring(0, 8) : 'N/A'}</p>
                                                    </td>
                                                    <td className="py-4 px-6 font-bold text-black">{formatCurrency(user.total_spent)}</td>
                                                    <td className="py-4 px-6 text-gray-600">{user.order_count}</td>
                                                    <td className={`py-4 px-6 font-medium ${user.abandoned_cart_count > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                                        {user.abandoned_cart_count}
                                                    </td>
                                                    <td className={`py-4 px-6 font-medium ${user.return_request_count > 0 ? 'text-blue-500' : 'text-gray-600'}`}>
                                                        {user.return_request_count}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="returns">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="spinner" /></div>
                        ) : returns.length === 0 ? (
                            <div className="text-center py-20">
                                <RotateCcw size={64} className="mx-auto text-gray-300 mb-6" strokeWidth={1.5} />
                                <h2 className="text-2xl font-bold mb-4 playfair text-black">No Active Return Requests</h2>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Order ID / Customer</th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Total</th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Request Date</th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Reason</th>
                                                <th className="text-right py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Status</th>
                                                <th className="text-right py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returns.map((order, index) => (
                                                <motion.tr 
                                                    // FIX: Use order.id as key with a fallback to ensure key is unique and not null
                                                    key={order.id || `return-order-${index}`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    className="border-b border-gray-100 hover:bg-gray-50"
                                                >
                                                    <td className="py-4 px-6">
                                                        <p className="font-semibold text-black font-mono">#{order.id.substring(0, 8).toUpperCase()}</p>
                                                        <p className="text-sm text-gray-500">{order.user_email}</p>
                                                    </td>
                                                    <td className="py-4 px-6 font-bold text-black">{formatCurrency(order.final_amount)}</td>
                                                    <td className="py-4 px-6 text-gray-600">
                                                        {new Date(order.return_request_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-600 max-w-xs truncate" title={order.return_reason}>
                                                        {order.return_reason || 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        {/* FIX: getStatusColor is now defined and accessible */}
                                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getStatusColor(order.return_status)}`}>
                                                           {order.return_status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <ReturnStatusUpdater 
                                                            order={order} 
                                                            api={api} 
                                                            onUpdate={fetchReturns}
                                                        />
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminCustomers;