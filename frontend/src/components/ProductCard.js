import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const { toggleWishlist, isItemInWishlist, loading: wishlistLoading } = useWishlist();
  const isWishlisted = isItemInWishlist(product.id);

  const handleWishlistToggle = (e) => {
    e.stopPropagation(); // Prevent card click
    if (!user) {
        navigate('/login');
        return;
    }
    toggleWishlist(product.id);
  };

  const handleProductClick = () => {
    navigate(`/product/${product.id}`);
  };

  const totalStock = product.variants?.reduce((total, variant) => {
    return total + Object.values(variant.sizes).reduce((sum, stock) => sum + stock, 0);
  }, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer"
      onClick={handleProductClick}
      data-testid={`featured-product-${index}`}
    >
      <motion.div
        whileHover={{ 
          y: -12,
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        /* --- MODIFIED: Added colored shadow on hover --- */
        className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
          isDark 
            ? 'bg-gray-800 shadow-xl hover:shadow-2xl hover:shadow-green-500/10' 
            : 'bg-white shadow-lg hover:shadow-2xl hover:shadow-green-700/20'
        }`}
      >
        {/* Image Container */}
        {/* --- MODIFIED: Added bg-white to make object-contain look clean --- */}
        <div className="relative overflow-hidden aspect-square bg-white">
          <motion.img
            src={product.images[0]?.url.replace('/upload/', '/upload/w_400,q_auto,f_auto/') || '/placeholder.jpg'}
            alt={product.name}
            /* --- MODIFIED: Changed object-cover to object-contain --- */
            className="w-full h-full object-contain"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.featured && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
              >
                <Sparkles size={12} />
                Featured
              </motion.div>
            )}
            
            {totalStock === 0 && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Out of Stock
              </div>
            )}
            
            {totalStock > 0 && totalStock < 10 && (
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Only {totalStock} left
              </div>
            )}
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered || isWishlisted ? 1 : 0, 
              scale: isHovered ? 1 : 0.8
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute top-4 right-4"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className={`bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all ${wishlistLoading ? 'cursor-not-allowed' : ''}`}
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
            >
              <Heart 
                size={16} 
                className={`transition-all ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`} 
              />
            </motion.button>
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <motion.h3 
            className={`text-xl font-semibold mb-2 playfair transition-colors ${
              isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-700'
            }`}
            animate={{ 
              scale: isHovered ? 1.02 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            {product.name}
          </motion.h3>
          
          <p className={`mb-3 line-clamp-2 text-sm transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {product.description}
          </p>
          
          <motion.div 
            className="flex items-center justify-between mb-4"
            animate={{ y: isHovered ? -2 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-2xl font-bold text-green-700">
              ₹{product.price}
            </span>
            
            <div className="flex gap-1">
              {product.variants?.slice(0, 3).map((variant, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ 
                    scale: isHovered ? 1.1 : 0.9,
                    opacity: isHovered ? 1 : 0.8
                  }}
                  transition={{ delay: i * 0.05 }}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: variant.color_code }}
                  title={variant.color}
                />
              ))}
              {product.variants?.length > 3 && (
                <div className={`text-xs flex items-center ml-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  +{product.variants.length - 3}
                </div>
              )}
            </div>
          </motion.div>
          
          <div className={`text-center text-xs mb-4 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
            disabled={totalStock === 0}
            className={`
              w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-300
              flex items-center justify-center gap-2 text-sm
              ${totalStock === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl'
              }
            `}
          >
            <ShoppingCart size={16} />
            {totalStock === 0 ? 'Out of Stock' : 'View Details'}
          </motion.button>
        </div>
        
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        />
      </motion.div>
    </motion.div>
  );
};

export default ProductCard;