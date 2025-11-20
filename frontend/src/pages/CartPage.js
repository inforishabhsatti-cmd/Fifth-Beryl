import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Package } from 'lucide-react'; // Restored necessary icons
import Navbar from '../components/Navbar';
// Footer import kept, but usage removed below
import Footer from '../components/Footer'; 
import { useCart } from '../context/CartContext'; // RESTORED: useCart context
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input'; // ADDED: Input for quantity
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  // RESTORED: All necessary cart functions and count
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart(); 

  const handleCheckout = () => {
    if (cartCount === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    navigate('/checkout');
  };

  // Check if cart is empty early for the empty state render
  if (cart.length === 0) {
    return (
      // REMOVED: local Footer usage, ensuring cleanup.
      <div className="min-h-screen bg-white pt-32"> 
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center" data-testid="empty-cart">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" strokeWidth={1.5} />
          <h2 className="text-3xl font-bold mb-4 playfair text-black">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Start shopping to add items to your cart</p>
          <Button 
            onClick={() => navigate('/products')} 
            className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-none" 
            data-testid="shop-now-empty-btn"
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    // FIX: Increased top padding to pt-32 (8rem) to clear fixed Navbar and Ticker
    <div className="min-h-screen bg-white pt-32">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-10 playfair text-black border-b border-gray-100 pb-4 text-center sm:text-left"
          data-testid="cart-title"
        >
          Your Shopping Cart ({cartCount})
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => (
              <motion.div
                key={`${item.product.id}-${item.variant.color}-${item.size}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-6 border-b border-gray-100 pb-8 last:border-0"
                data-testid={`cart-item-${index}`}
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.product.images[0]?.url.replace('/upload/', '/upload/w_150,q_auto,f_auto/') || '/placeholder.jpg'}
                    alt={item.product.name}
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-medium playfair text-black">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Color: {item.variant.color} <span className="mx-2">|</span> Size: {item.size}
                    </p>
                    <p className="text-xs text-red-500">
                        In stock: {item.variant.sizes[item.size] || 0}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-300">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant.color, item.size, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        data-testid={`decrease-qty-${index}`}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium text-sm" data-testid={`quantity-${index}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant.color, item.size, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        data-testid={`increase-qty-${index}`}
                        disabled={item.quantity >= item.variant.sizes[item.size]}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.product.id, item.variant.color, item.size)}
                      className="text-gray-400 hover:text-red-600 transition-colors text-sm flex items-center gap-1"
                      data-testid={`remove-item-${index}`}
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between items-end">
                  <p className="font-bold text-black text-lg">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                      ({item.quantity} @ ₹{item.product.price.toFixed(2)} each)
                  </p>
                </div>
              </motion.div>
            ))}
            <Button
                onClick={clearCart}
                variant="link"
                className="w-full text-red-500 hover:text-red-700 mt-4 rounded-none border-t border-gray-100 pt-4"
              >
                Clear Entire Cart
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-50 p-6 sticky top-24 border border-gray-100"
              data-testid="order-summary"
            >
              <h2 className="text-2xl font-bold mb-6 playfair text-black">Order Summary</h2>
              
              <div className="space-y-3 border-b border-gray-200 pb-4 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-medium text-black" data-testid="subtotal">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-black">Free</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-black mb-6">
                <span>Estimated Total</span>
                <span data-testid="total">₹{cartTotal.toFixed(2)}</span>
              </div>
              
              <Button
                onClick={handleCheckout}
                className="w-full bg-black hover:bg-gray-800 text-white py-6 text-sm font-medium uppercase tracking-wider rounded-none shadow-lg"
                data-testid="checkout-btn"
              >
                Proceed to Checkout
              </Button>
              
              <button
                onClick={() => navigate('/products')}
                className="block w-fit mx-auto mt-4 text-gray-500 hover:text-black text-sm transition-colors border-b border-transparent hover:border-black pb-0.5"
                data-testid="continue-shopping-btn"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;