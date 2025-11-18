import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
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
      setFeaturedProducts(response.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 bg-white pt-20`}> {/* Added pt-20 */}
      <Navbar />
      
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity, scale }} 
        className="relative h-[85vh] sm:h-[95vh] flex items-center justify-center overflow-hidden"
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
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200" /> {/* Removed color gradient */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute top-20 right-20 w-64 h-64 bg-gray-500 rounded-full blur-3xl"
            />
          </>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-16 sm:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center gap-2 mb-3 sm:mb-4"
            >
              <Sparkles className="text-white" size={20} />
              <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white">
                Premium Quality
              </span>
              <Sparkles className="text-white" size={20} />
            </motion.div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-4 sm:mb-6 playfair text-white drop-shadow-xl tracking-tight">
              Fifth Beryl
            </h1>
            
            <p className="text-base sm:text-xl mb-8 sm:mb-10 max-w-xl mx-auto text-white/90 drop-shadow-md font-light leading-relaxed">
              {landingSettings?.hero_subtitle || "Elevate your style with our premium collection of handcrafted shirts."}
            </p>
            
            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/products')}
                className="bg-white text-gray-900 px-6 py-3 sm:px-8 sm:py-4 rounded-full font-medium text-sm sm:text-base hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2"
              >
                Shop Collection
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Products */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-end mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold playfair text-gray-900 mb-2">
                New Arrivals
              </h2>
              <p className="text-gray-500 text-sm sm:text-base">Curated just for you.</p>
            </div>
            <Link 
              to="/products" 
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-black hover:text-gray-600 transition-colors pb-1 border-b border-black hover:border-gray-600"
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8">
              {featuredProducts.map((product, index) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link 
              to="/products" 
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-black px-6 py-3 rounded-full shadow-md"
            >
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#faf8f5] relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <span className="text-gray-500 text-sm font-bold tracking-widest uppercase mb-4 block">
            Exclusive
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 playfair text-gray-900">
            Redefine Your Style
          </h2>
          <p className="text-lg text-gray-600 mb-8 font-light">
            Experience the perfect blend of comfort and sophistication with our latest collection.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/products')}
            className="bg-gray-900 text-white px-10 py-4 rounded-full font-medium hover:bg-gray-800 transition-all shadow-xl"
          >
            Explore Now
          </motion.button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;