// frontend/src/components/TickerLabel.js
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import '../App.css'; 

const TickerLabel = ({ position }) => {
  const { api } = useAuth();
  const [tickerText, setTickerText] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickerSettings = async () => {
      try {
        if (!api) return; 
        
        const response = await api.get('/ticker');
        setTickerText(response.data.text);
        setIsActive(response.data.is_active);
      } catch (error) {
        console.error("Error fetching ticker settings:", error);
        setTickerText("Welcome to Fifth Beryl! Free Shipping on all orders.");
        setIsActive(false); 
      } finally {
        setLoading(false);
      }
    };
    fetchTickerSettings();
  }, [api]); 
  
  if (loading || !isActive || !tickerText) {
      return null;
  }

  // Double the text for seamless looping marquee effect
  const repeatedText = `${tickerText} \u2022 ${tickerText} \u2022 `;
  
  const isTop = position === 'top';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // Fixed position, top: 0, z-50 to guarantee visibility over Navbar
      className={`ticker-container ${isTop ? 'bg-black text-white' : 'bg-black text-white'} z-50`} 
      style={{ 
        position: isTop ? 'fixed' : 'relative', 
        top: isTop ? '0' : 'auto', 
        width: '100vw' 
      }}
    >
      <p 
        className="text-xs font-medium uppercase tracking-widest ticker-content" 
        style={{ color: 'white' }}
      >
        {repeatedText}
      </p>
    </motion.div>
  );
};

export default TickerLabel;