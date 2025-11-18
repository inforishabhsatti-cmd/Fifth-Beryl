import React, { useEffect, useState } from 'react';
// Removed: Loader2 import as it is no longer used

/**
 * Full-screen splash screen with a vertical "shutter" open effect (down to up, transparent background).
 */
const SplashShutter = ({ onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  // Using the reliable path for the favicon/logo
  const LOGO_SRC = '/assets/favicon.png'; 
  const BRAND_NAME = 'FIFTH BERYL';

  useEffect(() => {
    // 1. Wait a longer moment (1200ms) before the slide-up animation starts.
    const startAnimationTimer = setTimeout(() => {
      setIsAnimating(true); // Triggers the shutter-open CSS transition
    }, 1200); // Delay is 1200ms

    // 2. Set the total duration for the component to unmount. 
    // This is 1200ms delay + 1s CSS transition + 100ms buffer = 2300ms.
    const endTimer = setTimeout(() => {
      setIsDone(true); // Triggers opacity fade out in CSS
      if (onComplete) {
        setTimeout(onComplete, 600); 
      }
    }, 2300); 

    return () => {
      clearTimeout(startAnimationTimer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  // Use the isDone state to control the overall fade-out of the whole splash container
  return (
    <div className={`shutter-glass-container ${isDone ? 'shutter-fade-out' : ''}`}>
        
      {/* This element slides UP (It is the content container) */}
      <div className={`shutter-slide-up ${isAnimating ? 'shutter-open' : ''}`}>
        
        {/* Content is now directly inside the transparent shutter panel */}
        <div className="shutter-content"> 
          
          {/* LOGO (Vertically centered above text) */}
          <img 
            src={LOGO_SRC} 
            alt={`${BRAND_NAME} Logo`} 
            className="w-32 h-32 mx-auto mb-4" 
            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} 
          />
          
          {/* Store Name in one line - FIX: whitespace-nowrap ensures FIFTH BERYL stays on one line */}
          <h1 className="text-6xl md:text-8xl font-bold font-alegreya-sc tracking-widest uppercase text-black leading-none whitespace-nowrap">
            {BRAND_NAME}
          </h1>
          
          {/* Tagline and loading indicator are removed */}
        </div>
        
      </div>
    </div>
  );
};

export default SplashShutter;