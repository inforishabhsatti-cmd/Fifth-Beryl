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
      <div className="min-h-screen bg-[#faf8f5]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center" data-testid="empty-cart">
          <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-3xl font-bold mb-4 playfair">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
          <Button onClick={() => navigate('/products')} className="bg-emerald-600 hover:bg-emerald-700" data-testid="shop-now-empty-btn">
            Shop Now
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8 playfair"
          data-testid="cart-title"
        >
          Shopping Cart
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <motion.div
                key={`${item.product.id}-${item.variant.color}-${item.size}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
                data-testid={`cart-item-${index}`}
              >
                <div className="flex gap-6">
                  <img
                    src={item.product.images[0]?.url || '/placeholder.jpg'}
                    alt={item.product.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 playfair">{item.product.name}</h3>
                    <p className="text-gray-600 mb-2">
                      Color: {item.variant.color} | Size: {item.size}
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">₹{item.product.price}</p>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <button
                      onClick={() => removeFromCart(item.product.id, item.variant.color, item.size)}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`remove-item-${index}`}
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant.color, item.size, item.quantity - 1)}
                        className="hover:text-emerald-600"
                        data-testid={`decrease-qty-${index}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-semibold w-8 text-center" data-testid={`quantity-${index}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant.color, item.size, item.quantity + 1)}
                        className="hover:text-emerald-600"
                        data-testid={`increase-qty-${index}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
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
              className="bg-white rounded-2xl p-6 shadow-lg sticky top-24"
              data-testid="order-summary"
            >
              <h2 className="text-2xl font-bold mb-6 playfair">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold" data-testid="subtotal">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-emerald-600">Free</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-emerald-600" data-testid="total">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate('/checkout')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
                data-testid="checkout-btn"
              >
                Proceed to Checkout
              </Button>
              
              <button
                onClick={() => navigate('/products')}
                className="w-full mt-4 text-emerald-600 hover:text-emerald-700 font-semibold"
                data-testid="continue-shopping-btn"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;