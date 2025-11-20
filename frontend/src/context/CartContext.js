import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('rishe-cart');
    // We only set the cart if savedCart exists and is parsable.
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from local storage:", e);
        // Clear corrupt storage
        localStorage.removeItem('rishe-cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever cart state changes
  useEffect(() => {
    localStorage.setItem('rishe-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, variant, size, quantity = 1) => {
    const existingItemIndex = cart.findIndex(
      item => 
        item.product.id === product.id && 
        item.variant.color === variant.color && 
        item.size === size
    );

    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
      toast.success('Cart updated');
    } else {
      setCart([...cart, { product, variant, size, quantity }]);
      toast.success('Added to cart');
    }
  };

  const removeFromCart = (productId, color, size) => {
    setCart(cart.filter(
      item => !(item.product.id === productId && item.variant.color === color && item.size === size)
    ));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId, color, size, quantity) => {
    const updatedCart = cart.map(item => {
      if (item.product.id === productId && item.variant.color === color && item.size === size) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};