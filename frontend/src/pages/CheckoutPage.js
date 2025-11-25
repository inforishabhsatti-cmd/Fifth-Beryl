// src/pages/CheckoutPage.js
import { useState, useEffect, useMemo } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; 
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { IndianRupee } from 'lucide-react'; 

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  
  const { currentUser: user, api } = useAuth(); 
  
  const [loading, setLoading] = useState(false); 
  const [dataLoading, setDataLoading] = useState(true); 
  
  // COUPON STATES
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState({ 
    amount: 0.0, 
    code: null, 
    message: 'Have a coupon? Enter it here.',
    isValid: false
  });
  const [couponLoading, setCouponLoading] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });

  // CALCULATED FINAL TOTAL
  const finalTotal = useMemo(() => {
    return cartTotal - discount.amount;
  }, [cartTotal, discount.amount]);
  
  // Recalculate discount if cartTotal changes (e.g., if a percentage coupon is applied)
  useEffect(() => {
    if (discount.code && discount.isValid) {
        handleApplyCoupon(discount.code); 
    }
  }, [cartTotal]); 

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const response = await api.get('/profile');
          const profile = response.data;
          
          setShippingAddress({
            name: profile.name || user.name || '',
            phone: profile.shipping_address?.phone || '',
            address_line1: profile.shipping_address?.address_line1 || '',
            address_line2: profile.shipping_address?.address_line2 || '',
            city: profile.shipping_address?.city || '',
            state: profile.shipping_address?.state || '',
            postal_code: profile.shipping_address?.postal_code || '',
            country: 'India'
          });
        } catch (error) {
          console.error('Failed to fetch profile for checkout:', error);
          setShippingAddress(prev => ({ ...prev, name: user.name || '' }));
        } finally {
          setDataLoading(false);
        }
      } else {
        setDataLoading(false); 
      }
    };
    fetchProfile();
  }, [user]); 

  const handleInputChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyCoupon = async (codeOverride = null) => {
    const code = codeOverride || couponCode;
    if (!code) {
      toast.error('Please enter a coupon code.');
      return;
    }
    
    setCouponLoading(true);
    setDiscount({ amount: 0.0, code: null, message: 'Validating...', isValid: false });

    try {
      const response = await api.post('/coupons/validate', {
        code: code,
        total_amount: cartTotal
      });
      
      const data = response.data;
      setDiscount({
        amount: data.discount_amount,
        code: code.toUpperCase(),
        message: data.message,
        isValid: true
      });
      toast.success('Coupon applied!');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Invalid coupon code or requirements not met.';
      setDiscount({ amount: 0.0, code: null, message: errorMessage, isValid: false });
      toast.error(errorMessage);
    } finally {
      setCouponLoading(false);
    }
  };
  
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setDiscount({ amount: 0.0, code: null, message: 'Coupon removed.', isValid: false });
    toast.info('Coupon removed.');
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      navigate('/login');
      return;
    }

    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address_line1 || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Failed to load Razorpay SDK');
        setLoading(false);
        return;
      }

      const orderData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          color: item.variant.color,
          size: item.size,
          quantity: item.quantity,
          price: item.product.price // Price paid per item
        })),
        shipping_address: shippingAddress,
        total_amount: cartTotal, // Original total before discount
        coupon_code: discount.isValid ? discount.code : undefined // Send applied coupon code
      };

      // API applies discount and calculates final amount for Razorpay
      const response = await api.post('/orders/create-razorpay-order', orderData);
      const { order_id, razorpay_order_id, amount, currency } = response.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount, // Amount is the final amount after discount (in paise)
        currency: currency,
        name: 'Fifth Beryl', 
        description: 'Premium Shirts',
        order_id: razorpay_order_id,
        handler: async function (response) {
          try {
            await api.post('/orders/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order_id
            });
            
            clearCart();
            toast.success('Order placed successfully!');
            navigate('/orders');
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: shippingAddress.name,
          email: user.email,
          contact: shippingAddress.phone
        },
        theme: {
          color: '#000000'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!user && !dataLoading) {
    return (
      // FIX: Added pt-32 padding to clear fixed header
      <div className="min-h-screen bg-white pt-32"> 
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair text-black">Please Sign In</h2>
          <p className="text-gray-500 mb-8">You need to sign in to proceed with checkout</p>
          <Button onClick={() => navigate('/login')} className="bg-black hover:bg-gray-800 text-white rounded-none px-8 py-3">
            Sign In / Register
          </Button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      // FIX: Added pt-32 padding to clear fixed header
      <div className="min-h-screen bg-white pt-32">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair text-black">Your cart is empty</h2>
          <Button onClick={() => navigate('/products')} className="bg-black hover:bg-gray-800 text-white rounded-none px-8 py-3">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
        // FIX: Added pt-32 padding to clear fixed header
        <div className="min-h-screen bg-white pt-32">
            <Navbar />
            <div className="flex justify-center items-center py-20">
                <div className="spinner" />
            </div>
        </div>
    );
  }

  return (
    // FIX: Added pt-32 padding to clear fixed header
    <div className="min-h-screen bg-white pt-32">
      <Navbar />

      {/* FIX: Changed py-16 to pb-16 and added manual top padding to H1 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-10 playfair text-black pt-12" // ADDED: pt-12 to push H1 down
          data-testid="checkout-title"
        >
          Checkout
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            {/* FIX: Added padding and border to the form container for better structure */}
            <div className="bg-white p-4 sm:p-6 border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-8 playfair text-black border-b border-gray-100 pb-4">
                Shipping Information
              </h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={shippingAddress.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    data-testid="input-name"
                    className="bg-white border-gray-300 focus:border-black rounded-none h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    data-testid="input-phone"
                    className="bg-white border-gray-300 focus:border-black rounded-none h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="address_line1">Address Line 1 *</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    value={shippingAddress.address_line1}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    data-testid="input-address1"
                    className="bg-white border-gray-300 focus:border-black rounded-none h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    name="address_line2"
                    value={shippingAddress.address_line2}
                    onChange={handleInputChange}
                    placeholder="Apartment, suite, etc. (optional)"
                    data-testid="input-address2"
                    className="bg-white border-gray-300 focus:border-black rounded-none h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      placeholder="Mumbai"
                      data-testid="input-city"
                      className="bg-white border-gray-300 focus:border-black rounded-none h-12"
                    />
                </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      placeholder="Maharashtra"
                      data-testid="input-state"
                      className="bg-white border-gray-300 focus:border-black rounded-none h-12"
                    />
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      value={shippingAddress.postal_code}
                      onChange={handleInputChange}
                      placeholder="400001"
                      data-testid="input-postal"
                      className="bg-white border-gray-300 focus:border-black rounded-none h-12"
                    />
                </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleInputChange}
                      disabled
                      data-testid="input-country"
                      className="bg-gray-100 border-gray-300 text-gray-500 rounded-none h-12"
                    />
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-8 lg:sticky lg:top-24 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 playfair text-black">Order Summary</h2>
              
              {/* Coupon Form */}
              <div className="border border-gray-200 p-4 mb-6">
                <Label htmlFor="coupon">Apply Coupon</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="COUPONCODE"
                    className="bg-white border-gray-300 focus:border-black rounded-none h-10 uppercase"
                    disabled={discount.isValid}
                  />
                  {!discount.isValid ? (
                    <Button
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading || !couponCode}
                      className="bg-black hover:bg-gray-800 text-white rounded-none h-10 px-4"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRemoveCoupon}
                      variant="destructive"
                      className="rounded-none h-10 px-4"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p 
                    className={`text-xs mt-2 ${discount.isValid ? 'text-green-600' : discount.code ? 'text-red-500' : 'text-gray-500'}`}
                >
                    {discount.message}
                </p>
              </div>


              <div className="space-y-4 mb-8">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-medium text-black">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-black">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-black">Free</span>
                  </div>
                  
                  {/* Discount Row */}
                  {discount.amount > 0 && (
                     <div className="flex justify-between mb-2 text-sm text-green-600 font-semibold border-b border-gray-200 pb-2">
                        <span className='flex items-center'>
                            <IndianRupee size={14} className='mr-1' /> Discount {/* CHANGED ICON */}
                        </span>
                        <span>- ₹{discount.amount.toFixed(2)}</span>
                     </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <div className="flex justify-between text-lg font-bold text-black">
                      <span>Total</span>
                      <span data-testid="checkout-total">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={loading || dataLoading || finalTotal <= 0}
                className="w-full bg-black hover:bg-gray-800 text-white py-6 text-sm uppercase tracking-wider rounded-none shadow-lg"
                data-testid="place-order-btn"
              >
                {loading ? 'Processing...' : `Pay ₹${finalTotal.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;