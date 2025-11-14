import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // We no longer need the 'theme' state or toggle
  
  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // --- THIS IS THE FIX ---
    // Always remove 'dark' and force 'light'
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Save to localStorage to prevent re-load
    localStorage.setItem('rishe-theme', 'light');
  }, []); // Run only once on app load

  const value = {
    theme: 'light',
    toggleTheme: () => {}, // Empty function, does nothing
    isDark: false // Always report as not dark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};