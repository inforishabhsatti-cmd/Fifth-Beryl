import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
  const { currentUser: user, loading: authLoading, api } = useAuth();
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (user && wishlist.length > 0) {
      fetchWishlistProducts();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, wishlist]);

  const fetchWishlistProducts = async () => {
    setLoading(true);
    try {
      const productRequests = wishlist.map(id => api.get(`/products/${id}`));
      const responses = await Promise.all(productRequests);
      setProducts(responses.map(res => res.data));
    } catch (error) {
      console.error('Error fetching wishlist products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center py-40">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-40 text-center">
          <h2 className="text-3xl font-bold mb-4 playfair text-black">Please Sign In</h2>
          <p className="text-gray-500 mb-8">Sign in to view your wishlist</p>
          <Button onClick={() => navigate('/login')} className="bg-black hover:bg-gray-800 text-white rounded-none px-8 py-3 uppercase tracking-wide">
            Sign In
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24"> {/* Added pt-24 for navbar spacing */}
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-12 border-b border-gray-100 pb-4"
        >
          <Heart size={32} className="text-black" />
          <h1 className="text-4xl font-bold playfair text-black" data-testid="wishlist-title">
            My Wishlist
          </h1>
        </motion.div>

        {products.length === 0 ? (
          <div className="text-center py-20" data-testid="no-wishlist-items">
            <Heart size={64} className="mx-auto text-gray-300 mb-6" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold mb-4 playfair text-black">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8">Click the heart on a product to save it here.</p>
            <Button onClick={() => navigate('/products')} className="bg-black hover:bg-gray-800 text-white rounded-none px-8 py-3 uppercase tracking-wide">
              Find Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"> {/* Adjusted grid cols */}
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
    
    </div>
  );
};

export default WishlistPage;