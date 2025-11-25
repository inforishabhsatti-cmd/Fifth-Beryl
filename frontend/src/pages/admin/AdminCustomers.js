import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, ShoppingCart, DollarSign, RotateCcw, XCircle, CheckCircle } from 'lucide-react';
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
    DialogFooter
} from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';

// Helper component for updating return status
const ReturnStatusUpdater = ({ order, api, onUpdate }) => {
    const [status, setStatus] = useState(order.return_status);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            // Correct API path: /api/admin/returns/{order_id}
            await api.put(`/admin/returns/${order.id}`, { 
                return_status: status,
                admin_notes: notes 
            });
            toast.success(`Return updated to ${status.toUpperCase()}`);
            setDialogOpen(false);
            onUpdate();
        } catch (error) {
            console.error('Error updating return:', error.response?.data || error);
            toast.error('Failed to update return status.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (s) => {
        switch(s) {
            case 'requested': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-black text-white';
            default: return 'bg-gray-100 text-gray-600';
        }
    };
    
    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`rounded-none ${getStatusColor(order.return_status)}`}>
                    {order.return_status.charAt(0).toUpperCase() + order.return_status.slice(1)}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white rounded-none border-black">
                <DialogHeader>
                    <DialogTitle className="playfair text-xl">Update Return Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Order ID: {order.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-sm font-semibold">Customer: {order.user_email}</p>
                    <p className="text-sm text-gray-600 border-b border-gray-200 pb-2">Reason: {order.return_reason || 'N/A'}</p>

                    <Label htmlFor="status-select">New Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="status-select" className="rounded-none border-gray-300 focus:border-black">
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="requested">Requested</SelectItem>
                            <SelectItem value="approved">Approved (Issue Refund)</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="completed">Completed (Refund Processed)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                    <Textarea
                        id="admin-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes for processing the return/refund..."
                        rows={3}
                        className="rounded-none border-gray-300 focus:border-black"
                    />
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleUpdate} 
                        disabled={loading}
                        className="bg-black text-white hover:bg-gray-800 rounded-none w-full"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
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