import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, Award, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [landingSettings, setLandingSettings] = useState(null);
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  // Keep the scroll-away animations
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchLandingSettings();
  }, []);

  const fetchLandingSettings = async () => {
    try {
      const response = await axios.get(`${API}/landing-page`);
      setLandingSettings(response.data);
    } catch (error) {
      console.error('Error fetching landing settings:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API}/products/featured`);
      setFeaturedProducts(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Truck size={32} />,
      title: 'Free Shipping',
      description: 'On orders above ₹999'
    },
    {
      icon: <Shield size={32} />,
      title: 'Secure Payment',
      description: '100% protected transactions'
    },
    {
      icon: <Award size={32} />,
      title: 'Premium Quality',
      description: 'Handpicked finest fabrics'
    },
    {
      icon: <ShoppingBag size={32} />,
      title: 'Easy Returns',
      description: '7-day hassle-free returns'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : ''
    }`}>
      <Navbar />
      
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity, scale }} // This opacity is for scroll, not initial load
        className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
      >
        {/* Background Media */}
        {landingSettings?.hero_media ? (
          <div className="absolute inset-0 z-0">
            {landingSettings.hero_media_type === 'video' ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={landingSettings.hero_media} type="video/mp4" />
              </video>
            ) : (
              <img
                src={landingSettings.hero_media}
                alt="Hero"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />
          </div>
        ) : (
          <>
            {/* Default Background with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-bisque-50 to-orange-100" />
            
            {/* Decorative Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute top-20 right-20 w-64 h-64 bg-green-500 rounded-full blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="absolute bottom-20 left-20 w-96 h-96 bg-green-300 rounded-full blur-3xl"
            />
          </>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* --- MODIFIED: Added delay to hero content animations --- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.7 }} // Delay starts after navbar finishes
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9 }} // Delay this even more
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Sparkles className={`${landingSettings?.hero_media ? 'text-white' : 'text-green-800'}`} size={24} />
              <span className={`text-sm font-semibold tracking-wider uppercase ${landingSettings?.hero_media ? 'text-white' : 'text-green-800'}`}>
                Premium Quality
              </span>
              <Sparkles className={`${landingSettings?.hero_media ? 'text-white' : 'text-green-800'}`} size={24} />
            </motion.div>
            
            <h1 
              className={`text-5xl sm:text-6xl lg:text-8xl font-bold mb-6 playfair ${landingSettings?.hero_media ? 'drop-shadow-2xl' : ''}`}
              data-testid="hero-title"
            >
              <span className={landingSettings?.hero_media ? 'text-white' : 'text-gray-900'}>
                Welcome to
              </span>{' '}
              <span className="gradient-text">
                Fifth Beryl
              </span>
            </h1>
            <p className={`text-lg sm:text-xl mb-8 max-w-2xl mx-auto ${landingSettings?.hero_media ? 'text-white drop-shadow-lg' : 'text-gray-600'}`}>
              {landingSettings?.hero_subtitle || "Elevate your style with our premium collection of handcrafted shirts. Where elegance meets comfort."}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/products')}
                className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
                data-testid="shop-now-btn"
              >
                Shop Now
                <ArrowRight size={24} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/products')}
                className={`btn-secondary text-lg px-8 py-4 ${landingSettings?.hero_media ? 'bg-white/90 hover:bg-white border-white text-gray-900' : ''}`}
                data-testid="explore-collection-btn"
              >
                Explore Collection
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* --- MODIFIED: Delayed scroll indicator --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8, repeat: Infinity, repeatType: "reverse" }} // Delayed
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className={`w-6 h-10 border-2 ${landingSettings?.hero_media ? 'border-white' : 'border-green-800'} rounded-full flex justify-center`}>
            <div className={`w-1.5 h-3 ${landingSettings?.hero_media ? 'bg-white' : 'bg-green-800'} rounded-full mt-2`} />
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 bg-white" data-testid="features-section">
        {/* ... (rest of the file is the same) ... */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl hover:bg-green-50 transition-colors duration-300"
                data-testid={`feature-${index}`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-100 text-green-800 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 playfair">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20" data-testid="featured-products-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 playfair">
              Featured Collection
            </h2>
            <p className="text-gray-600 text-lg">Discover our handpicked favorites</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/products"
              className="btn-secondary inline-flex items-center gap-2"
              data-testid="view-all-products-btn"
            >
              View All Products
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-700 to-green-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 playfair">
              Ready to Upgrade Your Wardrobe?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of satisfied customers who trust Fifth Beryl for premium quality shirts.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/products')}
              className="bg-white text-green-800 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors duration-300"
              data-testid="cta-shop-btn"
            >
              Start Shopping
            </motion.button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;