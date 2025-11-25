import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Package, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

const OrderDetailsPage = () => {
    const { id } = useParams();
    const { api } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // NOTE: A dedicated API endpoint to fetch a single order by ID is currently missing in server.py.
        // For now, we will assume it exists or reuse the my-orders logic.
        // A dedicated endpoint GET /api/orders/{order_id} is recommended.
        
        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                // Temporary logic: Fetch all orders and find the one by ID. 
                // Replace with a dedicated GET /api/orders/{id} endpoint when implemented.
                const response = await api.get('/orders/my-orders');
                const foundOrder = response.data.find(o => o.id === id);

                if (!foundOrder) {
                    setError("Order not found or access denied.");
                    toast.error("Order not found or access denied.");
                } else {
                    setOrder(foundOrder);
                }
            } catch (err) {
                console.error('Error fetching order details:', err);
                setError("Failed to fetch order details.");
                toast.error("Failed to fetch order details.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [id, api]);

    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

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
    
    if (loading) {
        return (
            <div className="min-h-screen bg-white pt-24">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-black" />
                    <p className="mt-4 text-gray-600">Loading order #{id.substring(0, 8).toUpperCase()}...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-white pt-24">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <h1 className="text-3xl font-bold text-red-600">{error || "Order Details Unavailable"}</h1>
                    <Link to="/orders">
                        <Button className="mt-6 bg-black text-white hover:bg-gray-800 rounded-none">
                            <ArrowLeft size={20} className="mr-2" /> Back to Orders
                        </Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-24">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold playfair text-black">
                        Order <span className="font-mono">#{id.substring(0, 8).toUpperCase()}</span>
                    </h1>
                    <Link to="/orders">
                        <Button variant="outline" className="rounded-none border-black hover:bg-black hover:text-white">
                            <ArrowLeft size={16} className="mr-2" /> Back to Orders
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Summary Card */}
                    <div className="lg:col-span-2 bg-gray-50 p-6 border border-gray-200">
                        <h2 className="text-2xl font-semibold mb-4 text-black">Summary</h2>
                        
                        <div className="space-y-3 text-gray-700">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">Status:</span>
                                <span 
                                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getStatusColor(order.status)}`}
                                >
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Date Placed:</span>
                                <span>{new Date(order.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Total Items:</span>
                                <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                            {order.tracking_number && (
                                <div className="flex justify-between">
                                    <span className="font-medium">Tracking Number:</span>
                                    <span>{order.tracking_number} ({order.courier || 'N/A'})</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t mt-4 border-gray-300">
                                <span className="text-xl font-bold">Final Total:</span>
                                <span className="text-xl font-bold flex items-center">
                                    <IndianRupee size={18} className="mr-1" />{formatCurrency(order.final_amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address Card */}
                    <div className="bg-gray-50 p-6 border border-gray-200">
                        <h2 className="text-2xl font-semibold mb-4 text-black">Shipping To</h2>
                        <address className="text-gray-700 space-y-1 not-italic">
                            <p className="font-medium">{order.shipping_address.name}</p>
                            <p>{order.shipping_address.address_line1}</p>
                            {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                            <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}</p>
                            <p>Phone: {order.shipping_address.phone}</p>
                        </address>
                    </div>
                </div>

                {/* Items List */}
                <div className="mt-8 bg-white border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-semibold p-6 border-b text-black">Items Ordered</h2>
                    <div className="divide-y divide-gray-100">
                        {order.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col">
                                        <p className="font-medium text-black">{item.product_name}</p>
                                        <p className="text-sm text-gray-500">Color: {item.color} | Size: {item.size}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-black">{formatCurrency(item.price)} x {item.quantity}</p>
                                    <p className="text-sm text-gray-600 font-bold flex items-center justify-end">
                                        <IndianRupee size={14} className="mr-0.5" />
                                        {formatCurrency(item.price * item.quantity)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Return Status (Add your detailed return logic here if needed) */}
                {order.return_status && order.return_status !== 'none' && (
                     <div className="mt-8 bg-yellow-50 p-6 border border-yellow-200">
                        <h2 className="text-2xl font-semibold mb-4 text-black">Return/Replacement Status</h2>
                        <div className="space-y-2 text-gray-700">
                            <p><span className="font-medium">Status:</span> <span className="font-bold uppercase text-yellow-800">{order.return_status}</span></p>
                            <p><span className="font-medium">Request Date:</span> {new Date(order.return_request_date).toLocaleString()}</p>
                            <p><span className="font-medium">Reason:</span> {order.return_reason}</p>
                            {order.admin_notes && <p><span className="font-medium">Admin Notes:</span> {order.admin_notes}</p>}
                            <p className="text-sm italic pt-2">Please wait for admin approval. If approved, next steps will be communicated via email.</p>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default OrderDetailsPage;