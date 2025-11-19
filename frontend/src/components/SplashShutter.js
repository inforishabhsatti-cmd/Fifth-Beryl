import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Full-screen black shutter that slides from bottom to top, revealing
 * the already-loaded application content directly beneath it.
 */
const SplashShutter = ({ onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const BRAND_NAME = 'FIFTH BERYL';
  // FIX: Changed 'assets/shutter.png' to '/assets/shutter.png' for root-relative loading.
  const LOGO_SRC = '/assets/shutter.png'; 
  
  // Timing Configuration for the dramatic slide-up effect
  const DELAY_BEFORE_SLIDE_MS = 1200; // Time the logo is displayed statically
  const SLIDE_DURATION_MS = 2500;       // *** UPDATED to 2500ms (2.5 seconds) ***
  const TOTAL_UNMOUNT_TIME_MS = DELAY_BEFORE_SLIDE_MS + SLIDE_DURATION_MS + 50; 

  useEffect(() => {
    // 1. Wait the initial delay
    const startAnimationTimer = setTimeout(() => {
      setIsAnimating(true); // Triggers the shutter-open (slide-up) CSS transition
    }, DELAY_BEFORE_SLIDE_MS);

    // 2. Unmount the component completely after the slide-up animation is done
    const endTimer = setTimeout(() => {
      if (onComplete) {
        onComplete(); 
      }
    }, TOTAL_UNMOUNT_TIME_MS); 

    return () => {
      clearTimeout(startAnimationTimer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  // Define the custom CSS for the sliding animation (pure black background, dramatic transition)
  const customCss = `
    /* Container: Full screen, fixed, high z-index. Crucial for overlaying the entire app. */
    .shutter-glass-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999; 
        pointer-events: auto;
        background-color: transparent; /* No flicker on unmount */
    }

    /* Shutter Panel: The element that starts at the bottom (translateY(0)) and slides UP */
    .shutter-slide-up {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%; 
        background-color: #000; /* Pure black shutter */
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateY(0);
        /* *** UPDATED CSS TRANSITION TO 2500ms *** */
        transition: transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.77, 0, 0.175, 1); 
    }

    /* Target state: panel moves up by its full height */
    .shutter-open {
        transform: translateY(-100%);
    }

    .shutter-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
  `;

  return (
    <div className="shutter-glass-container"> 
        
      {/* Black Shutter Panel */}
      <div className={`shutter-slide-up ${isAnimating ? 'shutter-open' : ''}`}>
        
        <div className="shutter-content"> 
          
          {/* Logo (Enlarged) */}
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            src={LOGO_SRC} 
            alt={`${BRAND_NAME} Logo`} 
            className="w-40 h-40 md:w-56 md:h-56 mx-auto mb-8 drop-shadow-lg" 
            onError={(e) => { 
                e.target.onerror = null; 
                e.target.style.display = 'none'; // Hide image if path fails
            }} 
          />
          
          {/* Brand Name */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-widest uppercase text-white drop-shadow-xl leading-none whitespace-nowrap font-serif">
            {BRAND_NAME}
          </h1>
        </div>
      </div>

      {/* Inject custom CSS */}
      <style>{customCss}</style>
    </div>
  );
};

export default SplashShutter;