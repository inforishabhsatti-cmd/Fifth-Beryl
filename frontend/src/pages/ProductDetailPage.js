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
            <Button variant="link" className="text-sm font-semibold p-0 text-gray-500 hover:text-white transition-colors h-auto flex items-center gap-1">
                <Ruler size={14} /> Size Guide 
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg bg-white rounded-none border-black">
            <DialogHeader>
                <DialogTitle className="playfair text-2xl text-black">Shirt Size Chart ({sizeChartData.units})</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mb-4">Measurements are garment dimensions, not body size.</p>
            <Table className="border border-gray-200">
                <TableHeader className="bg-gray-100">
                    <TableRow>
                        <TableHead className="font-bold text-black uppercase">Size</TableHead>
                        <TableHead className="font-bold text-black uppercase">Chest (in)</TableHead>
                        <TableHead className="font-bold text-black uppercase">Length (in)</TableHead>
                        <TableHead className="font-bold text-black uppercase">Shoulder (in)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sizeChartData.sizes.map((row) => (
                        <TableRow key={row.size} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-black">{row.size}</TableCell>
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
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center py-40">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-40">
          <h2 className="text-2xl font-bold text-black">Product not found</h2>
          <Button onClick={() => navigate('/products')} className="mt-4 bg-black text-white">Back to Products</Button>
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
    <div className="min-h-screen bg-black text-white pt-32">
      
      <Helmet>
        <title>{product.name} | Fifth Beryl</title>
        <meta name="description" content={product.description.substring(0, 160) + '... Buy now!'} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description.substring(0, 160) + '...'} />
        <meta property="og:image" content={product.images[0]?.url} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      <Navbar />
      
      <div className="bg-black pb-20"> 
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Images / Media Gallery */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white text-black border border-gray-100 overflow-hidden mb-4 aspect-[4/5] p-4 shadow-xl group relative"
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
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 hidden lg:block pointer-events-none">
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
                        selectedImage === index ? 'border-white ring-2 ring-white ring-offset-2 ring-offset-black' : 'border-transparent'
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
                <h1 className="text-4xl font-bold mb-4 playfair text-white" data-testid="product-name">{product.name}</h1>
                
                {/* Fit and Rating Row */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    {/* ADDED: Fit Visualization */}
                    <div className="flex items-center gap-2 text-gray-400">
                        <Shirt size={18} className="text-white" />
                        <span className="text-sm font-semibold uppercase tracking-wider text-white">{product.fit}</span>
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
                    <p className="text-3xl font-medium text-white" data-testid="product-price">
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
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">Color: <span className="font-normal text-gray-400">{selectedVariant?.color}</span></h3>
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
                          selectedVariant?.color === variant.color ? 'ring-2 ring-white ring-offset-2 ring-offset-black border-transparent' : 'border-gray-700 hover:border-white'
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
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Size: <span className="font-normal text-gray-400">{selectedSize}</span></h3>
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
                              ? 'bg-white text-black border-white'
                              : stock === 0
                              ? 'bg-gray-800 text-gray-600 border-transparent cursor-not-allowed decoration-slice line-through'
                              : 'bg-black text-white border-gray-700 hover:border-white'
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
                  className="w-full bg-white hover:bg-gray-100 text-black py-7 text-lg rounded-none font-medium tracking-wide"
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingCart className="mr-3" size={20} />
                  ADD TO CART
                </Button>
              </motion.div>
            </div>

            {/* Reviews Section */}
            <div className="mt-24 border-t border-gray-800 pt-16">
              <h2 className="text-3xl font-bold mb-10 playfair text-center text-white">Customer Reviews</h2>
              
              {user && (
                <div className="bg-gray-900 p-8 mb-12 max-w-2xl mx-auto shadow-md">
                  <h3 className="font-bold mb-4 text-lg text-white">Write a Review</h3>
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
                    className="mb-4 bg-black text-white border-gray-700 focus:border-white rounded-none"
                    data-testid="review-comment"
                  />
                  <Button onClick={handleSubmitReview} className="bg-white text-black hover:bg-gray-100 rounded-none" data-testid="submit-review-btn">Submit Review</Button>
                </div>
              )}

              <div className="grid gap-8 max-w-4xl mx-auto p-6">
                {reviews.length === 0 ? (
                    <p className="text-center text-gray-400 italic">No reviews yet. Be the first to review this product.</p>
                ) : (
                    reviews.map((review, index) => (
                      <div key={review.id} className="border-b border-gray-800 pb-8 last:border-0" data-testid={`review-${index}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg text-white">{review.user_name}</span>
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
                    <h2 className="text-3xl font-bold mb-10 playfair text-center text-white">Customers Also Bought</h2>
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