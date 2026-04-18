import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  const { darkMode } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={clsx(
                'w-full max-w-md rounded-2xl shadow-xl p-6',
                darkMode ? 'bg-gray-800' : 'bg-white'
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <FiAlertTriangle className="text-red-500" size={20} />
                </div>
                <h3 className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>{title}</h3>
              </div>
              <p className={clsx('mb-6', darkMode ? 'text-gray-300' : 'text-gray-600')}>{message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className={clsx(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;