import React, { useState } from 'react';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

const MessageInput = ({ onSend, disabled }) => {
  const { darkMode } = useTheme();
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={clsx(
            'p-2 rounded-full transition-colors',
            darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          )}
        >
          <FiPaperclip size={20} />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className={clsx(
            'flex-1 px-4 py-2 rounded-full text-sm outline-none transition-colors',
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500'
              : 'bg-gray-100 border-gray-200 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={clsx(
            'p-2 rounded-full transition-colors',
            message.trim() && !disabled
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : darkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <FiSend size={20} />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;