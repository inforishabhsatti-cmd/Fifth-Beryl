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
  const videoRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchLandingSettings();
  }, []);

  useEffect(() => {
    // Force video play if autoplay blocked
    if (landingSettings?.hero_media_type === "video" && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => console.log("Autoplay prevented, retrying on user interaction"));
      }
    }
  }, [landingSettings]);

  const fetchLandingSettings = async () => {
    try {
      const response = await axios.get(`${API}/landing-page`);
      setLandingSettings(response.data);
    } catch (error) {
      console.error("Error fetching landing settings:", error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API}/products/featured`);
      setFeaturedProducts(response.data.slice(0, 4));
    } catch (error) {
      console.error("Error fetching featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-white">
      
      {/* HERO SECTION */}
      <section
        ref={heroRef}
        className="relative h-[85vh] sm:h-[95vh] flex flex-col items-center justify-center overflow-hidden bg-black mt-[-64px]"
      >
        {landingSettings?.hero_media && (
          <div className="absolute inset-0 z-0">
            {landingSettings.hero_media_type === "video" ? (
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controls={false}
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

            {/* Animate ONLY the overlay (fix for iOS autoplay) */}
            <motion.div
              style={{ scale: contentScale, opacity: contentOpacity }}
              className="absolute inset-0 bg-black/30"
            />
          </div>
        )}
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-12 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold playfair text-gray-900 mb-2">
              New Arrivals
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mb-4">
              Curated just for you.
            </p>
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
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION */}
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/products")}
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
