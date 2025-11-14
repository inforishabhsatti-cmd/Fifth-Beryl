import { Lightbulb, LightbulbOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className={`
        relative p-3 rounded-full transition-all duration-300 
        ${isDark 
          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-yellow-400/25' 
          : 'bg-gray-800 text-yellow-400 hover:bg-gray-700 shadow-gray-800/25'
        } 
        shadow-lg hover:shadow-xl
      `}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      data-testid="theme-toggle"
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDark ? 0 : 180,
          scale: isDark ? 1 : 0.8
        }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Lightbulb size={24} className="drop-shadow-sm" />
        ) : (
          <LightbulbOff size={24} className="drop-shadow-sm" />
        )}
      </motion.div>
      
      {/* Glow effect */}
      <div className={`
        absolute inset-0 rounded-full transition-all duration-300
        ${isDark 
          ? 'bg-yellow-400/20 blur-xl' 
          : 'bg-gray-800/20 blur-xl'
        }
      `} />
    </motion.button>
  );
};

export default ThemeToggle;