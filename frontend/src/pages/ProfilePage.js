import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Package, LogOut, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { currentUser, logOut, api } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Initialize form data from currentUser
    setFormData({
      name: currentUser.name || '',
      phone: currentUser.shipping_address?.phone || '',
      address_line1: currentUser.shipping_address?.address_line1 || '',
      address_line2: currentUser.shipping_address?.address_line2 || '',
      city: currentUser.shipping_address?.city || '',
      state: currentUser.shipping_address?.state || '',
      postal_code: currentUser.shipping_address?.postal_code || '',
      country: 'India'
    });
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logOut();
    navigate('/login');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Construct the payload to match UserProfileUpdate model
      const updatePayload = {
        name: formData.name,
        shipping_address: {
          name: formData.name, // Use profile name for shipping
          phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country
        }
      };

      await api.put('/profile', updatePayload);
      
      // We need to reload the page or re-fetch user to update context
      // For now, a simple reload works best to sync everything
      toast.success("Profile updated successfully");
      setIsEditing(false);
      window.location.reload(); 
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold playfair mb-2">My Account</h1>
              <p className="text-gray-500">Manage your profile and shipping details</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               {isEditing ? (
                 <>
                   <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 md:flex-none border-gray-300 rounded-none">
                     <X size={16} className="mr-2" /> Cancel
                   </Button>
                   <Button onClick={handleSaveProfile} disabled={loading} className="flex-1 md:flex-none bg-black text-white hover:bg-gray-800 rounded-none">
                     <Save size={16} className="mr-2" /> {loading ? 'Saving...' : 'Save Changes'}
                   </Button>
                 </>
               ) : (
                 <Button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none bg-black text-white hover:bg-gray-800 rounded-none px-6">
                   <Edit2 size={16} className="mr-2" /> Edit Profile
                 </Button>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar / Summary */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-50 p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-bold">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{currentUser.name}</h3>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                  </div>
                </div>
                
                <nav className="space-y-2">
                  <button onClick={() => navigate('/orders')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white hover:shadow-sm transition-all text-left border border-transparent hover:border-gray-200">
                    <Package size={18} />
                    <span>My Orders</span>
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all text-left border border-transparent hover:border-red-100">
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content Form */}
            <div className="lg:col-span-2">
              <div className="bg-white p-0 md:p-6 border border-gray-100 md:border-none">
                
                {/* Personal Information */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                    <User size={20} />
                    <h2 className="text-xl font-bold playfair">Personal Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-gray-500 text-xs uppercase tracking-wider">Full Name</Label>
                      {isEditing ? (
                        <Input name="name" value={formData.name} onChange={handleInputChange} className="mt-1 rounded-none border-gray-300 focus:border-black" />
                      ) : (
                        <p className="mt-2 text-lg font-medium">{currentUser.name || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-500 text-xs uppercase tracking-wider">Email Address</Label>
                      <p className="mt-2 text-lg font-medium text-gray-700">{currentUser.email}</p>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-500 text-xs uppercase tracking-wider">Phone Number</Label>
                      {isEditing ? (
                        <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91..." className="mt-1 rounded-none border-gray-300 focus:border-black" />
                      ) : (
                        <p className="mt-2 text-lg font-medium">{currentUser.shipping_address?.phone || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                    <MapPin size={20} />
                    <h2 className="text-xl font-bold playfair">Shipping Address</h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="address_line1" className="text-gray-500 text-xs uppercase tracking-wider">Address Line 1</Label>
                      {isEditing ? (
                        <Input name="address_line1" value={formData.address_line1} onChange={handleInputChange} className="mt-1 rounded-none border-gray-300 focus:border-black" />
                      ) : (
                        <p className="mt-2 text-lg">{currentUser.shipping_address?.address_line1 || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address_line2" className="text-gray-500 text-xs uppercase tracking-wider">Address Line 2</Label>
                      {isEditing ? (
                        <Input name="address_line2" value={formData.address_line2} onChange={handleInputChange} className="mt-1 rounded-none border-gray-300 focus:border-black" />
                      ) : (
                        <p className="mt-2 text-lg">{currentUser.shipping_address?.address_line2 || '-'}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="city" className="text-gray-500 text-xs uppercase tracking-wider">City</Label>
                        {isEditing ? (
                          <Input name="city" value={formData.city} onChange={handleInputChange} className="mt-1 rounded-none border-gray-300 focus:border-black" />
                        ) : (
                          <p className="mt-2 text-lg">{currentUser.shipping_address?.city || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-gray-500 text-xs uppercase tracking-wider">State</Label>
                        {isEditing ? (
                          <Input name="state" value={formData.state} onChange={handleInputChange} className="mt-1 rounded-none border-gray-300 focus:border-black" />
                        ) : (
                          <p className="mt-2 text-lg">{currentUser.shipping_address?.state || 'Not set'}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="postal_code" className="text-gray-500 text-xs uppercase tracking-wider">Postal Code</Label>
                        {isEditing ? (
                          <Input name="postal_code" value={formData.postal_code} onChange={handleInputChange} className="mt-1 rounded-none border-gray-300 focus:border-black" />
                        ) : (
                          <p className="mt-2 text-lg">{currentUser.shipping_address?.postal_code || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="country" className="text-gray-500 text-xs uppercase tracking-wider">Country</Label>
                        <p className="mt-2 text-lg">India</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}