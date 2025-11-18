import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

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

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      // Use 'api' instance which handles base URL
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
      const response = await api.get(`/reviews/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
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
        product_id: id, 
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

  return (
    <div className="min-h-screen bg-white text-black pt-24"> {/* Added pt-24 */}
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-50 border border-gray-100 overflow-hidden mb-4 aspect-[4/5]"
            >
              <img
                src={product.images[selectedImage]?.url.replace('/upload/', '/upload/w_800,q_auto,f_auto/') || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply"
                data-testid="main-product-image"
              />
            </motion.div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden border bg-gray-50 ${
                    selectedImage === index ? 'border-black' : 'border-transparent'
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
            className="pt-4"
          >
            <h1 className="text-4xl font-bold mb-4 playfair text-black" data-testid="product-name">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={star <= Math.round(avgRating) ? 'fill-black text-black' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 border-b border-gray-300 pb-0.5">
                {reviews.length} reviews
              </span>
            </div>

            <p className="text-3xl font-medium text-black mb-6" data-testid="product-price">₹{product.price}</p>
            
            <p className="text-gray-600 mb-10 leading-relaxed" data-testid="product-description">{product.description}</p>

            {/* Color Selection */}
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-black">Color: <span className="font-normal text-gray-600">{selectedVariant?.color}</span></h3>
              <div className="flex gap-4 flex-wrap">
                {product.variants?.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setSelectedSize('');
                    }}
                    className={`relative w-10 h-10 rounded-full border transition-all ${
                      selectedVariant?.color === variant.color ? 'ring-2 ring-black ring-offset-2 border-transparent' : 'border-gray-300 hover:border-black'
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
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-black">Size: <span className="font-normal text-gray-600">{selectedSize}</span></h3>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(selectedVariant.sizes).map(([size, stock]) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={stock === 0}
                      className={`min-w-[3rem] h-12 px-4 border transition-all flex items-center justify-center ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : stock === 0
                          ? 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed decoration-slice line-through'
                          : 'bg-white text-black border-gray-200 hover:border-black'
                      }`}
                      data-testid={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSize && selectedVariant.sizes[selectedSize] < 5 && selectedVariant.sizes[selectedSize] > 0 && (
                   <p className="text-red-600 text-sm mt-2">Only {selectedVariant.sizes[selectedSize]} left!</p>
                )}
              </div>
            )}

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-black hover:bg-gray-800 text-white py-7 text-lg rounded-none font-medium tracking-wide"
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="mr-3" size={20} />
              ADD TO CART
            </Button>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 border-t border-gray-100 pt-16">
          <h2 className="text-3xl font-bold mb-10 playfair text-center">Customer Reviews</h2>
          
          {user && (
            <div className="bg-gray-50 p-8 mb-12 max-w-2xl mx-auto">
              <h3 className="font-bold mb-4 text-lg">Write a Review</h3>
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    data-testid={`rating-star-${star}`}
                  >
                    <Star
                      size={24}
                      className={star <= newReview.rating ? 'fill-black text-black' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="mb-4 bg-white border-gray-200 focus:border-black rounded-none"
                data-testid="review-comment"
              />
              <Button onClick={handleSubmitReview} className="bg-black text-white hover:bg-gray-800 rounded-none" data-testid="submit-review-btn">Submit Review</Button>
            </div>
          )}

          <div className="grid gap-8 max-w-4xl mx-auto">
            {reviews.length === 0 ? (
                <p className="text-center text-gray-500 italic">No reviews yet. Be the first to review this product.</p>
            ) : (
                reviews.map((review, index) => (
                  <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0" data-testid={`review-${index}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg">{review.user_name}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= review.rating ? 'fill-black text-black' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;