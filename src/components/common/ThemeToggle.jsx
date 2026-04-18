import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: darkMode ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute"
      >
        {darkMode ? (
          <FiMoon className="text-yellow-400" size={18} />
        ) : (
          <FiSun className="text-yellow-500" size={18} />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;