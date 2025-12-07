import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Ruler, Shirt } from 'lucide-react'; // ADDED: Shirt icon
import { Helmet } from 'react-helmet-async'; 
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard'; 
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Size Chart Data (in inches, adjust as needed)
const sizeChartData = {
    units: 'Inches',
    sizes: [
        { size: 'S', chest: '38', length: '27', shoulder: '17' },
        { size: 'M', chest: '40', length: '28', shoulder: '18' },
        { size: 'L', chest: '42', length: '29', shoulder: '19' },
        { size: 'XL', chest: '44', length: '30', shoulder: '20' },
        { size: 'XXL', chest: '46', length: '31', shoulder: '21' },
    ]
};

const SizeChartDialog = () => (
    <Dialog>
        <DialogTrigger asChild>
            {/* CHANGED: text-gray-500/hover:text-white to theme variables */}
            <Button variant="link" className="text-sm font-semibold p-0 text-foreground/70 hover:text-primary transition-colors h-auto flex items-center gap-1">
                <Ruler size={14} /> Size Guide 
            </Button>
        </DialogTrigger>
        {/* CHANGED: bg-white/border-black to bg-background/border-foreground */}
        <DialogContent className="max-w-lg bg-background rounded-none border-foreground">
            <DialogHeader>
                {/* CHANGED: text-black to text-foreground */}
                <DialogTitle className="playfair text-2xl text-foreground">Shirt Size Chart ({sizeChartData.units})</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mb-4">Measurements are garment dimensions, not body size.</p>
            <Table className="border border-gray-200">
                {/* CHANGED: text-black to text-foreground */}
                <TableHeader className="bg-gray-100">
                    <TableRow>
                        <TableHead className="font-bold text-foreground uppercase">Size</TableHead>
                        <TableHead className="font-bold text-foreground uppercase">Chest (in)</TableHead>
                        <TableHead className="font-bold text-foreground uppercase">Length (in)</TableHead>
                        <TableHead className="font-bold text-foreground uppercase">Shoulder (in)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sizeChartData.sizes.map((row) => (
                        <TableRow key={row.size} className="hover:bg-gray-50">
                            {/* CHANGED: text-black to text-foreground */}
                            <TableCell className="font-medium text-foreground">{row.size}</TableCell>
                            <TableCell>{row.chest}</TableCell>
                            <TableCell>{row.length}</TableCell>
                            <TableCell>{row.shoulder}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DialogContent>
    </Dialog>
);


const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const { currentUser: user, api } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState(0); 
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetchProduct();
  }, [id]); 

  useEffect(() => {
    if (product?.id) {
        fetchReviews();
        fetchRecommendations(product.id); 
    }
  }, [product?.id]); 


  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
      if (response.data.variants?.length > 0) {
        setSelectedVariant(response.data.variants[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const productId = product?.id || id;
      if (!productId) return; 

      const response = await api.get(`/reviews/${productId}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };
  
  const fetchRecommendations = async (productId) => {
    try {
      const response = await api.get(`/products/recommendations/${productId}`);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Please select a color');
      return;
    }
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    addToCart(product, selectedVariant, selectedSize, 1);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }
    try {
      await api.post('/reviews', { 
        product_id: product.id, 
        ...newReview 
      });
      
      toast.success('Review submitted!');
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  // FIX: Set displayImages to always be the full list of product images.
  // The unreliable color-name-in-URL filtering is removed to prevent images from disappearing.
  const displayImages = product?.images || [];

  if (loading) {
    // CHANGED: bg-white to bg-background
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-40">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!product) {
    // CHANGED: bg-white to bg-background
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-40">
          {/* CHANGED: text-black to text-foreground */}
          <h2 className="text-2xl font-bold text-foreground">Product not found</h2>
          {/* CHANGED: bg-black/text-white to bg-primary/text-primary-foreground (Vanilla Button) */}
          <Button onClick={() => navigate('/products')} className="mt-4 bg-primary text-primary-foreground">Back to Products</Button>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const discountPercent = product.mrp && product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  // Use the currently selected image from the displayImages array
  const selectedMedia = displayImages[selectedImage];
  const isVideo = selectedMedia?.url.includes('/video/') || selectedMedia?.url.endsWith('.mp4') || selectedMedia?.url.endsWith('.webm');
  
  const mainMediaUrl = selectedMedia?.url.replace('/upload/', '/upload/w_1200,q_auto,f_auto/') || '/placeholder.jpg';
  

  return (
    // CHANGED: bg-black/text-white to bg-background/text-foreground
    <div className="min-h-screen bg-background text-foreground pt-32">
      
      <Helmet>
        <title>{product.name} | Fifth Beryl</title>
        <meta name="description" content={product.description.substring(0, 160) + '... Buy now!'} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description.substring(0, 160) + '...'} />
        <meta property="og:image" content={product.images[0]?.url} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      <Navbar />
      
      {/* CHANGED: bg-black to bg-background */}
      <div className="bg-background pb-20"> 
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Images / Media Gallery */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  // CHANGED: bg-white/text-black to bg-background/text-foreground
                  className="bg-background text-foreground border border-gray-100 overflow-hidden mb-4 aspect-[4/5] p-4 shadow-xl group relative"
                >
                  
                  {/* Media Display: Video or Image */}
                  {isVideo ? (
                    <video 
                      src={mainMediaUrl} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                      controls 
                      autoPlay 
                      loop
                      muted
                    />
                  ) : (
                    // Image with Simple Hover Zoom
                    <motion.img
                      src={mainMediaUrl}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 ease-out cursor-zoom-in"
                      data-testid="main-product-image"
                      // Simple Zoom Effect on hover (only on large screens)
                      whileHover={{ scale: 1.5, originX: '50%', originY: '50%' }}
                      transition={{ duration: 0.7 }}
                    />
                  )}
                  
                  {/* Zoom instruction overlay for desktop */}
                  {!isVideo && (
                    <div 
                      // CHANGED: bg-black/70/text-white to bg-foreground/70/text-background
                      className="absolute bottom-4 right-4 bg-foreground/70 text-background text-xs px-2 py-1 hidden lg:block pointer-events-none"
                    >
                        Hover to Zoom
                    </div>
                  )}
                </motion.div>
                
                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-4 px-4">
                  {/* FIX: Map over the displayImages array */}
                  {displayImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden border bg-gray-200 ${
                        // CHANGED: border-white/ring-white/ring-offset-black to border-foreground/ring-foreground/ring-offset-background
                        selectedImage === index ? 'border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background' : 'border-transparent'
                      }`}
                      data-testid={`thumbnail-${index}`}
                    >
                      <img 
                        src={image.url.replace('/upload/', '/upload/w_100,q_auto,f_auto/')} 
                        alt={`${product.name} ${index + 1}`} 
                        className="w-full h-full object-contain mix-blend-multiply" 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="pt-4 p-8 lg:p-0" 
              >
                {/* CHANGED: text-white to text-foreground */}
                <h1 className="text-4xl font-bold mb-4 playfair text-foreground" data-testid="product-name">{product.name}</h1>
                
                {/* Fit and Rating Row */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    {/* ADDED: Fit Visualization */}
                    <div className="flex items-center gap-2 text-gray-400">
                        {/* CHANGED: text-white to text-foreground */}
                        <Shirt size={18} className="text-foreground" />
                        {/* CHANGED: text-white to text-foreground */}
                        <span className="text-sm font-semibold uppercase tracking-wider text-foreground">{product.fit}</span>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={18}
                                    className={star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-400 border-b border-gray-700 pb-0.5">
                            {reviews.length} reviews
                        </span>
                    </div>
                </div>

                {/* Price display */}
                <div className="flex items-baseline gap-4 mb-6 border-b border-gray-800 pb-4">
                    {/* CHANGED: text-white to text-foreground */}
                    <p className="text-3xl font-medium text-foreground" data-testid="product-price">
                        ₹{product.price.toFixed(2)}
                    </p>
                    {product.mrp && product.mrp > product.price && (
                        <>
                            <span className="text-xl font-medium text-gray-500 line-through">
                                ₹{product.mrp.toFixed(2)}
                            </span>
                            {discountPercent > 0 && (
                                <span className="text-base font-bold text-green-400">
                                    ({discountPercent}% OFF)
                                </span>
                            )}
                        </>
                    )}
                </div>
                
                <p className="text-gray-300 mb-10 leading-relaxed" data-testid="product-description">{product.description}</p>

                {/* Color Selection */}
                <div className="mb-8">
                  {/* CHANGED: text-white to text-foreground */}
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-foreground">Color: <span className="font-normal text-gray-400">{selectedVariant?.color}</span></h3>
                  <div className="flex gap-4 flex-wrap">
                    {product.variants?.map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setSelectedSize('');
                          setSelectedImage(0); // FIX: Reset image index to 0 when changing color
                        }}
                        className={`relative w-10 h-10 rounded-full border transition-all ${
                          // CHANGED: ring-white/ring-offset-black/hover:border-white to ring-foreground/ring-offset-background/hover:border-foreground
                          selectedVariant?.color === variant.color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background border-transparent' : 'border-gray-700 hover:border-foreground'
                        }`}
                        style={{ backgroundColor: variant.color_code }}
                        data-testid={`color-${index}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                {selectedVariant && (
                  <div className="mb-10">
                    {/* ADDED: Size Guide button */}
                    <div className="flex justify-between items-center mb-4">
                        {/* CHANGED: text-white to text-foreground */}
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Size: <span className="font-normal text-gray-400">{selectedSize}</span></h3>
                        <SizeChartDialog /> 
                    </div>
                    
                    <div className="flex gap-3 flex-wrap">
                      {Object.entries(selectedVariant.sizes).map(([size, stock]) => ( 
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          disabled={stock === 0}
                          className={`min-w-[3rem] h-12 px-4 border transition-all flex items-center justify-center ${
                            selectedSize === size
                              // SELECTED: bg-foreground text-background border-foreground (Brown fill, Vanilla text)
                              ? 'bg-foreground text-background border-foreground'
                              : stock === 0
                              ? 'bg-gray-800 text-gray-600 border-transparent cursor-not-allowed decoration-slice line-through'
                              // UNSELECTED: bg-background text-foreground (Vanilla bg, Brown text)
                              : 'bg-background text-foreground border-gray-700 hover:border-foreground'
                          }`}
                          data-testid={`size-${size}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {selectedSize && selectedVariant.sizes[selectedSize] < 5 && selectedVariant.sizes[selectedSize] > 0 && (
                       <p className="text-red-400 text-sm mt-2">Only {selectedVariant.sizes[selectedSize]} left!</p>
                    )}
                  </div>
                )}

                {/* Add to Cart */}
                <Button
                  onClick={handleAddToCart}
                  // Uses default variant: bg-primary (Vanilla) text-primary-foreground (Red-Brown)
                  className="w-full py-7 text-lg rounded-none font-medium tracking-wide"
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingCart className="mr-3" size={20} />
                  ADD TO CART
                </Button>
              </motion.div>
            </div>

            {/* Reviews Section */}
            <div className="mt-24 border-t border-gray-800 pt-16">
              {/* CHANGED: text-white to text-foreground */}
              <h2 className="text-3xl font-bold mb-10 playfair text-center text-foreground">Customer Reviews</h2>
              
              {user && (
                // CHANGED: bg-gray-900 to bg-secondary
                <div className="bg-secondary p-8 mb-12 max-w-2xl mx-auto shadow-md">
                  {/* CHANGED: text-white to text-foreground */}
                  <h3 className="font-bold mb-4 text-lg text-foreground">Write a Review</h3>
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        data-testid={`rating-star-${star}`}
                      >
                        <Star
                          size={24}
                          className={star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Share your experience..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    // CHANGED: bg-black/text-white/focus:border-white to bg-background/text-foreground/focus:border-foreground
                    className="mb-4 bg-background text-foreground border-gray-700 focus:border-foreground rounded-none"
                    data-testid="review-comment"
                  />
                  {/* Uses default variant (Vanilla Button) */}
                  <Button onClick={handleSubmitReview} className="rounded-none" data-testid="submit-review-btn">Submit Review</Button>
                </div>
              )}

              <div className="grid gap-8 max-w-4xl mx-auto p-6">
                {reviews.length === 0 ? (
                    <p className="text-center text-gray-400 italic">No reviews yet. Be the first to review this product.</p>
                ) : (
                    reviews.map((review, index) => (
                      <div key={review.id} className="border-b border-gray-800 pb-8 last:border-0" data-testid={`review-${index}`}>
                        <div className="flex items-center justify-between mb-3">
                          {/* CHANGED: text-white to text-foreground */}
                          <span className="font-bold text-lg text-foreground">{review.user_name}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-400 leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
            
            {/* NEW SECTION: Product Recommendations */}
            {recommendations.length > 0 && (
                <div className="mt-24 border-t border-gray-800 pt-16">
                    {/* CHANGED: text-white to text-foreground */}
                    <h2 className="text-3xl font-bold mb-10 playfair text-center text-foreground">Customers Also Bought</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {recommendations.map((recProduct, index) => (
                            <ProductCard key={recProduct.id} product={recProduct} index={index} />
                        ))}
                    </div>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;