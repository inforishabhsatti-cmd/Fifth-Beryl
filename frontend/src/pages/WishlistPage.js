import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WishlistPage = () => {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && wishlist.length > 0) {
      fetchWishlistProducts();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, wishlist]);

  const fetchWishlistProducts = async () => {
    setLoading(true);
    try {
      // This is not efficient, but it's simple.
      // A better way would be a new backend endpoint: GET /api/products/batch
      const productRequests = wishlist.map(id => axios.get(`${API}/products/${id}`));
      const responses = await Promise.all(productRequests);
      setProducts(responses.map(res => res.data));
    } catch (error) {
      console.error('Error fetching wishlist products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair">Please Sign In</h2>
          <p className="text-gray-600 mb-8">Sign in to view your wishlist</p>
          <Button onClick={signInWithGoogle} className="bg-green-700 hover:bg-green-800">
            Sign In with Google
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Heart size={32} />
          <h1 className="text-4xl font-bold playfair" data-testid="wishlist-title">
            My Wishlist
          </h1>
        </motion.div>

        {products.length === 0 ? (
          <div className="text-center py-20" data-testid="no-wishlist-items">
            <Heart size={80} className="mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold mb-4 playfair">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Click the heart on a product to save it here.</p>
            <Button onClick={() => navigate('/products')} className="bg-green-700 hover:bg-green-800">
              Find Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <ProductCard 
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default WishlistPage;