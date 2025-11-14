import { useState, useEffect } from 'react'; // <-- Import useEffect
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user, token, signInWithGoogle } = useAuth(); // Removed 'loading' as we use a new one
  const [loading, setLoading] = useState(false); // For payment processing
  const [dataLoading, setDataLoading] = useState(true); // For fetching profile
  
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

  // --- NEW: Fetch profile to pre-fill shipping address ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (user && token) {
        try {
          const response = await axios.get(`${API}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const profile = response.data;
          
          // Pre-fill the form with profile data, falling back to empty strings
          setShippingAddress({
            name: profile.name || user.displayName || '',
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
          // If it fails, just pre-fill the name
          setShippingAddress(prev => ({ ...prev, name: user.displayName || '' }));
        } finally {
          setDataLoading(false);
        }
      } else if (!user) {
        setDataLoading(false); // Not logged in, no data to load
      }
    };
    fetchProfile();
  }, [user, token]); // Run this effect when user or token becomes available
  // --- END NEW ---

  const handleInputChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
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
      navigate('/login'); // Go to login page instead of Google popup
      return;
    }

    // Validate shipping address
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address_line1 || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Failed to load Razorpay SDK');
        setLoading(false);
        return;
      }

      // Create order
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          color: item.variant.color,
          size: item.size,
          quantity: item.quantity,
          price: item.product.price
        })),
        shipping_address: shippingAddress,
        total_amount: cartTotal
      };

      const response = await axios.post(
        `${API}/orders/create-razorpay-order`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order_id, razorpay_order_id, amount, currency } = response.data;

      // Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'Fifth Beryl', // Updated name
        description: 'Premium Shirts',
        order_id: razorpay_order_id,
        handler: async function (response) {
          try {
            await axios.post(
              `${API}/orders/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order_id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
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
          color: '#228B22' // Updated to forest green
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
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair">Please Sign In</h2>
          <p className="text-gray-600 mb-8">You need to sign in to proceed with checkout</p>
          <Button onClick={() => navigate('/login')} className="bg-green-700 hover:bg-green-800">
            Sign In / Register
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair">Your cart is empty</h2>
          <Button onClick={() => navigate('/products')} className="bg-green-700 hover:bg-green-800">
            Continue Shopping
          </Button>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (dataLoading) {
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="flex justify-center items-center py-20">
                <div className="spinner" />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8 playfair"
          data-testid="checkout-title"
        >
          Checkout
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 playfair">Shipping Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={shippingAddress.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    data-testid="input-name"
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
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
              <h2 className="text-2xl font-bold mb-6 playfair">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-semibold">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-green-700">Free</span>
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-green-700" data-testid="checkout-total">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={loading || dataLoading}
                className="w-full bg-green-700 hover:bg-green-800 text-white py-6 text-lg"
                data-testid="place-order-btn"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;