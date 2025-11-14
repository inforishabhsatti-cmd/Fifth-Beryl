import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '../components/ui/textarea';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, token } = useAuth();
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
      const response = await axios.get(`${API}/products/${id}`);
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
      const response = await axios.get(`${API}/reviews/${id}`);
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
      await axios.post(
        `${API}/reviews`,
        { product_id: id, ...newReview },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <Button onClick={() => navigate('/products')} className="mt-4">Back to Products</Button>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            {/* --- MODIFIED: Added bg-white --- */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg mb-4"
            >
              <img
                /* --- MODIFIED: Cloudinary URL and object-contain --- */
                src={product.images[selectedImage]?.url.replace('/upload/', '/upload/w_800,q_auto,f_auto/') || '/placeholder.jpg'}
                alt={product.name}
                className="w-full aspect-square object-contain"
                data-testid="main-product-image"
              />
            </motion.div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  /* --- MODIFIED: Added bg-white --- */
                  className={`rounded-lg overflow-hidden border-2 bg-white ${
                    selectedImage === index ? 'border-green-700' : 'border-gray-200'
                  }`}
                  data-testid={`thumbnail-${index}`}
                >
                  <img 
                    /* --- MODIFIED: Cloudinary URL and object-contain --- */
                    src={image.url.replace('/upload/', '/upload/w_100,q_auto,f_auto/')} 
                    alt={`${product.name} ${index + 1}`} 
                    className="w-full aspect-square object-contain" 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold mb-4 playfair" data-testid="product-name">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-gray-600">({reviews.length} reviews)</span>
            </div>

            <p className="text-3xl font-bold text-green-700 mb-6" data-testid="product-price">₹{product.price}</p>
            
            <p className="text-gray-700 mb-8" data-testid="product-description">{product.description}</p>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Color</h3>
              <div className="flex gap-3 flex-wrap">
                {product.variants?.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setSelectedSize('');
                    }}
                    className={`relative w-12 h-12 rounded-full border-2 ${
                      selectedVariant?.color === variant.color ? 'border-green-700' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: variant.color_code }}
                    data-testid={`color-${index}`}
                  >
                    {selectedVariant?.color === variant.color && (
                      <Check className="absolute inset-0 m-auto text-white" size={20} />
                    )}
                  </button>
                ))}
              </div>
              {selectedVariant && (
                <p className="text-sm text-gray-600 mt-2">Selected: {selectedVariant.color}</p>
              )}
            </div>

            {/* Size Selection */}
            {selectedVariant && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3">Size</h3>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(selectedVariant.sizes).map(([size, stock]) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={stock === 0}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        selectedSize === size
                          ? 'bg-green-700 text-white'
                          : stock === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-2 border-gray-300 hover:border-green-700'
                      }`}
                      data-testid={`size-${size}`}
                    >
                      {size}
                      {stock === 0 && <span className="block text-xs">Out of Stock</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-green-700 hover:bg-green-800 text-white py-6 text-lg"
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="mr-2" size={24} />
              Add to Cart
            </Button>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 playfair">Customer Reviews</h2>
          
          {user && (
            <div className="bg-white rounded-2xl p-6 mb-8">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    data-testid={`rating-star-${star}`}
                  >
                    <Star
                      size={24}
                      className={star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="mb-4"
                data-testid="review-comment"
              />
              <Button onClick={handleSubmitReview} data-testid="submit-review-btn">Submit Review</Button>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div key={review.id} className="bg-white rounded-2xl p-6" data-testid={`review-${index}`}>
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-semibold">{review.user_name}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;