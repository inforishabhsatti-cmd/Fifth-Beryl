import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      fetchWishlist();
    } else {
      setWishlist([]); // Clear wishlist on logout
    }
  }, [user, token]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(response.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.error('Please sign in to add items to your wishlist.');
      return;
    }

    setLoading(true);
    const isWishlisted = wishlist.includes(productId);

    try {
      let response;
      if (isWishlisted) {
        // Remove from wishlist
        response = await axios.delete(`${API}/profile/wishlist/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Removed from wishlist');
      } else {
        // Add to wishlist
        response = await axios.post(`${API}/profile/wishlist`, { product_id: productId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Added to wishlist');
      }
      setWishlist(response.data.wishlist);
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist.');
    } finally {
      setLoading(false);
    }
  };

  const isItemInWishlist = (productId) => {
    return wishlist.includes(productId);
  };

  const value = {
    wishlist,
    loading,
    toggleWishlist,
    isItemInWishlist,
    fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};