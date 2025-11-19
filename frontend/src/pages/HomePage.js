import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
  
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

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
    {/* Removed pt-20 from here (main wrapper) */}
    <div className={`min-h-screen transition-colors duration-300 bg-white`}>
      {/* Hero Section */}
      <section 
        ref={heroRef}
        {/* Added pt-20 here to push the hero content down from the fixed navbar */}
        className="relative h-[85vh] sm:h-[95vh] flex flex-col items-center justify-center overflow-hidden bg-black pt-20"
      >
        {landingSettings?.hero_media ? (
          <motion.div 
            style={{ scale: contentScale, opacity: contentOpacity }}
            className="absolute inset-0 z-0"
          >
            {landingSettings.hero_media_type === 'video' ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto" 
                className="w-full h-full object-cover opacity-90"
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
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        )}

        {/* Content Overlay - Now COMPLETELY EMPTY, leaving only the video */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-16 sm:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* All previous content (text and button) has been removed. */}
          </motion.div>
        </div>
      </section>

      {/* Featured Products - Centered & Mobile Friendly */}
      <section className="py-12 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold playfair text-gray-900 mb-2">
              New Arrivals
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mb-4">Curated just for you.</p>
            <Link 
              to="/products" 
              className="text-sm font-medium text-black border-b border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors"
            >
              View All Collection
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#faf8f5] relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <span className="text-gray-500 text-sm font-bold tracking-widest uppercase mb-4 block">
            Exclusive
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 playfair text-gray-900">
            Redefine Your Style
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-8 font-light">
            Experience the perfect blend of comfort and sophistication with our latest collection.
          </p>
          {/* FIX: Converted the self-closing tag to a properly closed tag with content */}
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

    </div>
  );
};

export default HomePage;
