// src/pages/CartPage.js
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center" data-testid="empty-cart">
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-10 playfair text-black text-center sm:text-left"
          data-testid="cart-title"
        >
          Shopping Cart
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-8">
            {cart.map((item, index) => (
              <motion.div
                key={`${item.product.id}-${item.variant.color}-${item.size}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-6 border-b border-gray-100 pb-8 last:border-0"
                data-testid={`cart-item-${index}`}
              >
                <div className="w-32 h-40 bg-gray-50 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.product.images[0]?.url || '/placeholder.jpg'}
                    alt={item.product.name}
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-medium playfair text-black">{item.product.name}</h3>
                    <p className="text-lg font-bold text-black">₹{item.product.price}</p>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    Color: {item.variant.color} <span className="mx-2">|</span> Size: {item.size}
                  </p>
                  
                  <div className="mt-auto flex justify-between items-center">
                    <div className="flex items-center border border-gray-300">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant.color, item.size, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        data-testid={`decrease-qty-${index}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium text-sm" data-testid={`quantity-${index}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant.color, item.size, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        data-testid={`increase-qty-${index}`}
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
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-50 p-8 sticky top-24 border border-gray-100"
              data-testid="order-summary"
            >
              <h2 className="text-2xl font-bold mb-6 playfair text-black">Order Summary</h2>
              
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-black" data-testid="subtotal">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-black">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold text-black">
                    <span>Total</span>
                    <span data-testid="total">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tax included.</p>
                </div>
              </div>

              <Button
                onClick={() => navigate('/checkout')}
                className="w-full bg-black hover:bg-gray-800 text-white py-6 text-sm font-medium uppercase tracking-wider rounded-none shadow-lg"
                data-testid="checkout-btn"
              >
                Proceed to Checkout
              </Button>
              
              <button
                onClick={() => navigate('/products')}
                // --- FIXED: Removed 'w-full' and 'w-auto' conflict. Used 'block w-fit mx-auto' ---
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