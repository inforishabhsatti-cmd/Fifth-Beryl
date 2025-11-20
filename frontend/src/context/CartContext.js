import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext); // 🔥 FIXED HERE
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart on mount
  useEffect(() => {
    const saved = localStorage.getItem('rishe-cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        localStorage.removeItem('rishe-cart');
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart only after load completes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('rishe-cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (product, variant, size, quantity = 1) => {
    const i = cart.findIndex(
      item =>
        item.product.id === product.id &&
        item.variant.color === variant.color &&
        item.size === size
    );

    if (i > -1) {
      const updated = [...cart];
      updated[i].quantity += quantity;
      setCart(updated);
      toast.success('Cart updated');
    } else {
      setCart([...cart, { product, variant, size, quantity }]);
      toast.success('Added to cart');
    }
  };

  const removeFromCart = (productId, color, size) => {
    setCart(cart.filter(
      item =>
        !(
          item.product.id === productId &&
          item.variant.color === color &&
          item.size === size
        )
    ));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId, color, size, quantity) => {
    setCart(
      cart.map(item =>
        item.product.id === productId &&
        item.variant.color === color &&
        item.size === size
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  const cartTotal = cart.reduce(
    (t, item) => t + item.product.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((t, item) => t + item.quantity, 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  };

  if (!isLoaded) return null; // prevents overwriting saved cart

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
