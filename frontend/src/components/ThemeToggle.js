// src/components/ThemeToggle.js
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`
        relative p-2.5 rounded-full transition-all duration-300 border-2
        ${isDark 
          ? 'bg-white text-black border-white hover:bg-gray-100' 
          : 'bg-black text-white border-black hover:bg-gray-900'
        } 
        shadow-md
      `}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      data-testid="theme-toggle"
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDark ? 360 : 0,
          scale: 1
        }}
        transition={{ duration: 0.4, ease: "backOut" }}
      >
        {isDark ? (
          <Sun size={20} strokeWidth={2} />
        ) : (
          <Moon size={20} strokeWidth={2} />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;