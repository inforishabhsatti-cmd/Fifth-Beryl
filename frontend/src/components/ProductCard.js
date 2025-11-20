import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { currentUser } = useAuth(); 
  const { toggleWishlist, isItemInWishlist, loading: wishlistLoading } = useWishlist();
  const isWishlisted = isItemInWishlist(product.id);

  const handleWishlistToggle = (e) => {
    e.stopPropagation(); 
    if (!currentUser) {
        navigate('/login');
        return;
    }
    toggleWishlist(product.id);
  };

  const handleProductClick = () => {
    // MODIFIED: Use slug for navigation if available, otherwise use id
    const urlParam = product.slug || product.id; 
    navigate(`/product/${urlParam}`);
  };

  const totalStock = product.variants?.reduce((total, variant) => {
    return total + Object.values(variant.sizes).reduce((sum, stock) => sum + stock, 0);
  }, 0) || 0;

  // Logic to show MRP and Sale Price
  const mainImageUrl = product.images[0]?.url.replace('/upload/', '/upload/w_500,q_auto,f_auto/') || '/placeholder.jpg';
  const hoverImageUrl = product.images[1]?.url.replace('/upload/', '/upload/w_500,q_auto,f_auto/') || mainImageUrl;
  const hasSecondImage = product.images.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer"
      onClick={handleProductClick}
      data-testid={`featured-product-${index}`}
    >
      <motion.div
        whileHover={{ y: -8 }}
        className="relative overflow-hidden bg-white border border-gray-100 hover:border-black hover:shadow-2xl transition-all duration-300"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-[4/5] bg-gray-50">
          
          {/* Image Crossfade Logic */}
          <motion.img
            src={mainImageUrl}
            alt={`${product.name} - Front View`}
            animate={{ 
              opacity: isHovered && hasSecondImage ? 0 : 1, 
              scale: isHovered ? 1.05 : 1
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 left-0 w-full h-full object-cover mix-blend-multiply z-10" 
          />
          {hasSecondImage && (
            <motion.img
                src={hoverImageUrl}
                alt={`${product.name} - Second View`}
                animate={{ 
                  opacity: isHovered ? 1 : 0, 
                  scale: isHovered ? 1.05 : 1
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute top-0 left-0 w-full h-full object-cover mix-blend-multiply z-0"
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {product.featured && (
              <div className="bg-black text-white px-3 py-1 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                <Sparkles size={10} />
                Featured
              </div>
            )}
            {totalStock === 0 && (
              <div className="bg-gray-200 text-gray-600 px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
                Sold Out
              </div>
            )}
          </div>
          
          {/* Wishlist Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered || isWishlisted ? 1 : 0 }}
            className="absolute top-3 right-3 p-2 bg-white border border-black rounded-full shadow-md hover:bg-black hover:text-white transition-all z-20"
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
          >
            <Heart 
              size={18} 
              className={`transition-colors ${isWishlisted ? 'fill-black text-black hover:fill-white hover:text-white' : ''}`} 
              strokeWidth={1.5}
            />
          </motion.button>

          {/* Quick Add Button (Visible on Hover) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isHovered ? 0 : '100%' }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 to-transparent z-20"
          >
             <button
              onClick={(e) => {
                e.stopPropagation();
                // MODIFIED: Use slug for quick add navigation
                const urlParam = product.slug || product.id; 
                navigate(`/product/${urlParam}`);
              }}
              disabled={totalStock === 0}
              className="w-full py-3 bg-black text-white text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} />
              {totalStock === 0 ? 'Out of Stock' : 'View Details'}
            </button>
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="p-3 sm:p-4"> 
          <h3 className="text-base sm:text-lg font-medium mb-1 playfair text-black">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-2">
              {/* MRP Display */}
              {product.mrp && product.mrp > product.price && (
                <span className="text-xs text-gray-500 line-through">
                  ₹{product.mrp.toFixed(2)}
                </span>
              )}
              {/* Sale Price */}
              <span className="text-base sm:text-lg font-semibold text-black">
                ₹{product.price.toFixed(2)}
              </span>
            </div>
            
            {/* Color Swatches */}
            <div className="flex gap-1.5">
              {product.variants?.slice(0, 3).map((variant, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full border border-gray-200 shadow-sm"
                  style={{ backgroundColor: variant.color_code }}
                  title={variant.color}
                />
              ))}
              {product.variants?.length > 3 && (
                <div className="text-[10px] text-gray-400 flex items-center">
                  +{product.variants.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductCard;