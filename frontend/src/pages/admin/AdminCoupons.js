import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, Percent, IndianRupee, Calendar } from 'lucide-react'; // CHANGED: DollarSign to IndianRupee
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { toast } from 'sonner';

const AdminCoupons = () => {
  const { api } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage', // 'fixed' or 'percentage'
    discount_value: '',
    min_purchase: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoupon = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error('Code and Discount Value are required.');
      return;
    }
    
    try {
      const couponData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_purchase: parseFloat(formData.min_purchase) || 0,
        code: formData.code.toUpperCase(),
        // Format expiry date to ISO string for backend if it exists
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : undefined,
      };

      await api.post('/coupons', couponData);
      toast.success('Coupon created successfully!');
      setDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      const detail = error.response?.data?.detail || 'Failed to save coupon.';
      toast.error(detail);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted.');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon.');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      expiry_date: ''
    });
  };
  
  // Helper to format ISO date string for input type="date"
  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    try {
      // Use only the date part YYYY-MM-DD
      return new Date(isoDate).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="icon" className="rounded-none border-black hover:bg-black hover:text-white">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold playfair text-black">Manage Coupons</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-black text-white hover:bg-gray-800 rounded-none">
                <Plus className="mr-2" size={20} />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-none border-black">
              <DialogHeader>
                <DialogTitle className="playfair text-2xl">Create New Coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                
                {/* Coupon Code */}
                <div>
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input 
                    id="code" 
                    value={formData.code.toUpperCase()} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="rounded-none border-gray-300 focus:border-black uppercase font-semibold"
                    placeholder="E.g., FLAT500"
                    maxLength={15}
                  />
                </div>
                
                {/* Discount Type */}
                <div>
                  <Label>Discount Type</Label>
                  <div className="flex gap-4 mt-2">
                    <Button 
                      onClick={() => setFormData({...formData, discount_type: 'percentage'})}
                      variant={formData.discount_type === 'percentage' ? 'default' : 'outline'}
                      className={`rounded-none ${formData.discount_type === 'percentage' ? 'bg-black text-white' : 'border-gray-300'}`}
                    >
                      <Percent size={16} className="mr-2" /> Percentage (%)
                    </Button>
                    <Button 
                      onClick={() => setFormData({...formData, discount_type: 'fixed'})}
                      variant={formData.discount_type === 'fixed' ? 'default' : 'outline'}
                      className={`rounded-none ${formData.discount_type === 'fixed' ? 'bg-black text-white' : 'border-gray-300'}`}
                    >
                      <IndianRupee size={16} className="mr-2" /> Fixed Amount (₹) {/* CHANGED ICON */}
                    </Button>
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <Label htmlFor="discount_value">Discount Value *</Label>
                  <Input 
                    id="discount_value" 
                    type="number" 
                    value={formData.discount_value} 
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    className="rounded-none border-gray-300 focus:border-black"
                    placeholder={formData.discount_type === 'percentage' ? "e.g., 10 (for 10%)" : "e.g., 500 (for ₹500 off)"}
                  />
                </div>
                
                {/* Minimum Purchase */}
                <div>
                  <Label htmlFor="min_purchase">Minimum Purchase (₹) - Optional</Label>
                  <Input 
                    id="min_purchase" 
                    type="number" 
                    value={formData.min_purchase} 
                    onChange={(e) => setFormData({...formData, min_purchase: e.target.value})}
                    className="rounded-none border-gray-300 focus:border-black"
                    placeholder="e.g., 1500"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <Label htmlFor="expiry_date">Expiry Date - Optional</Label>
                  <Input 
                    id="expiry_date" 
                    type="date" 
                    value={formData.expiry_date} 
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="rounded-none border-gray-300 focus:border-black"
                  />
                </div>

                <Button onClick={handleSaveCoupon} className="w-full bg-black text-white hover:bg-gray-800 rounded-none py-6">
                  Create Coupon
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Code</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Discount</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Min. Purchase</th> 
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Expiry</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <motion.tr 
                      key={coupon.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6 font-semibold text-black uppercase">{coupon.code}</td>
                      <td className="py-4 px-6 text-black">
                        {coupon.discount_type === 'fixed' ? (
                            <div className="flex items-center text-sm font-medium">
                                <IndianRupee size={14} className="mr-1" /> {coupon.discount_value.toFixed(2)} OFF {/* CHANGED ICON */}
                            </div>
                        ) : (
                            <div className="flex items-center text-sm font-medium">
                                <Percent size={14} className="mr-1" /> {coupon.discount_value}% OFF
                            </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {coupon.min_purchase > 0 ? `₹${coupon.min_purchase.toFixed(2)}` : 'None'}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {coupon.expiry_date ? formatDate(coupon.expiry_date) : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                            <Trash2 size={18} className="text-red-500 hover:text-red-700" />
                          </Button>
                        </div>
                      </td>
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

export default AdminCoupons;