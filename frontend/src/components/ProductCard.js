import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Sparkles, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react'; // ADDED: useMemo
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // ADDED: useCart
import { Button } from './ui/button'; // ADDED: Button import
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

const ProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart(); // ADDED: addToCart
  
  const [isHovered, setIsHovered] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false); // ADDED: Quick Add modal state
  const [selectedQuickVariant, setSelectedQuickVariant] = useState(product.variants ? product.variants[0] : null); // ADDED: Quick selection variant
  const [selectedQuickSize, setSelectedQuickSize] = useState(''); // ADDED: Quick selection size

  const { currentUser } = useAuth(); 
  const { toggleWishlist, isItemInWishlist, loading: wishlistLoading } = useWishlist();
  const isWishlisted = isItemInWishlist(product.id);
  
  // --- HELPERS ---
  
  // Calculate total stock for 'Sold Out' badge
  const totalStock = useMemo(() => {
    return product.variants?.reduce((total, variant) => {
      return total + Object.values(variant.sizes).reduce((sum, stock) => sum + stock, 0);
    }, 0) || 0;
  }, [product.variants]);
  
  // Get current stock for selected size
  const currentStock = selectedQuickSize ? selectedQuickVariant?.sizes[selectedQuickSize] || 0 : 0;
  
  // --- HANDLERS ---

  const handleWishlistToggle = (e) => {
    e.stopPropagation(); 
    if (!currentUser) {
        navigate('/login');
        return;
    }
    toggleWishlist(product.id);
  };
  
  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (!selectedQuickVariant) {
        toast.error('Product variant missing.');
        return;
    }
    if (!selectedQuickSize) {
        toast.error('Please select a size.');
        return;
    }
    if (currentStock === 0) {
        toast.error('Selected size is out of stock.');
        return;
    }
    
    addToCart(product, selectedQuickVariant, selectedQuickSize, 1);
    
    // Reset and close
    setSelectedQuickSize('');
    setQuickAddOpen(false);
  };

  const handleProductClick = () => {
    // Navigate to detail page if user clicks the card body, not the Quick Add button
    const urlParam = product.slug || product.id; 
    navigate(`/product/${urlParam}`);
  };

  // Logic for images (from previous steps)
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
      // Prevent card click from firing when opening modal
      onClick={handleProductClick} 
      data-testid={`featured-product-${index}`}
    >
      <motion.div
        whileHover={{ y: -8 }}
        // CHANGED: bg-white/hover:border-black to bg-background/hover:border-foreground
        className="relative overflow-hidden bg-background border border-gray-100 hover:border-foreground hover:shadow-2xl transition-all duration-300"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-[4/5] bg-gray-50">
          
          {/* Image Crossfade Logic */}
          <motion.img
            src={mainImageUrl}
            alt={`${product.name} - Front View`}
            animate={{ opacity: isHovered && hasSecondImage ? 0 : 1, scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 left-0 w-full h-full object-cover mix-blend-multiply z-10" 
          />
          {hasSecondImage && (
            <motion.img
                src={hoverImageUrl}
                alt={`${product.name} - Second View`}
                animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute top-0 left-0 w-full h-full object-cover mix-blend-multiply z-0"
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {product.featured && (
              <div 
                // CHANGED: bg-black text-white to bg-foreground text-background (Brown Badge, Vanilla Text)
                className="bg-foreground text-background px-3 py-1 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1"
              >
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
            // CHANGED: bg-white border-black/hover:bg-black/hover:text-white to theme variables
            className="absolute top-3 right-3 p-2 bg-background border border-foreground rounded-full shadow-md hover:bg-foreground hover:text-background transition-all z-20"
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
          >
            <Heart 
              size={18} 
              // CHANGED: fill-black/text-black/hover:fill-white/hover:text-white to theme variables
              className={`transition-colors ${isWishlisted ? 'fill-foreground text-foreground hover:fill-background hover:text-background' : ''}`} 
              strokeWidth={1.5}
            />
          </motion.button>

          {/* Quick Add Button (Visible on Hover) - Now uses DialogTrigger */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isHovered ? 0 : '100%' }}
            transition={{ duration: 0.3 }}
            // CHANGED: from-white/90 to from-background/90
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent z-20"
          >
            <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
                <DialogTrigger asChild>
                    <Button
                      onClick={(e) => {
                        // Prevent card click propagation and manual navigate
                        e.stopPropagation();
                        if (totalStock === 0) {
                            navigate(`/product/${product.slug || product.id}`);
                        }
                      }}
                      disabled={totalStock === 0}
                      // Uses default variant (Vanilla Button)
                      className="w-full py-3 text-sm font-medium tracking-wide transition-colors flex items-center justify-center gap-2 rounded-none"
                    >
                      <ShoppingCart size={16} />
                      {totalStock === 0 ? 'Out of Stock' : 'Quick Add'}
                    </Button>
                </DialogTrigger>
                
                {/* QUICK ADD MODAL CONTENT */}
                <DialogContent 
                  // CHANGED: bg-white/border-black to bg-background/border-foreground
                  className="max-w-xs sm:max-w-md bg-background rounded-none border-foreground"
                >
                    <DialogHeader>
                        <DialogTitle className="playfair text-xl text-foreground">{product.name}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Color Selection */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-foreground">Color: <span className="font-normal text-gray-600">{selectedQuickVariant?.color}</span></h3>
                            <div className="flex gap-3 flex-wrap">
                                {product.variants?.map((variant, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setSelectedQuickVariant(variant);
                                            setSelectedQuickSize(''); // Reset size on variant change
                                        }}
                                        className={`relative w-8 h-8 rounded-full border transition-all ${
                                            // CHANGED: ring-black/hover:border-black to ring-foreground/hover:border-foreground
                                            selectedQuickVariant?.color === variant.color ? 'ring-2 ring-foreground ring-offset-2 border-transparent' : 'border-gray-300 hover:border-foreground'
                                        }`}
                                        style={{ backgroundColor: variant.color_code }}
                                        title={variant.color}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        {/* Size Selection */}
                        {selectedQuickVariant && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-foreground">Select Size:</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(selectedQuickVariant.sizes).map(([size, stock]) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedQuickSize(size)}
                                            disabled={stock === 0}
                                            className={`min-w-10 h-10 border transition-all flex items-center justify-center text-sm ${
                                                selectedQuickSize === size
                                                    // SELECTED: bg-foreground text-background (Brown fill, Vanilla text)
                                                    ? 'bg-foreground text-background border-foreground'
                                                    : stock === 0
                                                    ? 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed decoration-slice line-through'
                                                    // UNSELECTED: bg-background text-foreground (Vanilla bg, Brown text)
                                                    : 'bg-background text-foreground border-gray-200 hover:border-foreground'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Stock Urgency Message */}
                                {selectedQuickSize && currentStock > 0 && currentStock < 5 && (
                                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                        <AlertTriangle size={14} /> Only {currentStock} left!
                                    </p>
                                )}
                                {selectedQuickSize && currentStock === 0 && (
                                    <p className="text-red-600 text-sm mt-2">
                                        Out of stock in {selectedQuickSize}.
                                    </p>
                                )}
                            </div>
                        )}
                        
                        <Button
                            onClick={handleQuickAdd}
                            disabled={!selectedQuickSize || currentStock === 0}
                            // Uses default variant (Vanilla Button)
                            className="w-full rounded-none py-3 mt-4"
                        >
                            <ShoppingCart size={16} className="mr-2" /> Add to Cart
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="p-3 sm:p-4" onClick={handleProductClick}>
          {/* text-foreground (Red-Brown) */}
          <h3 className="text-base sm:text-lg font-medium mb-1 playfair text-foreground">
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
              {/* Sale Price (text-foreground - Red-Brown) */}
              <span className="text-base sm:text-lg font-semibold text-foreground">
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