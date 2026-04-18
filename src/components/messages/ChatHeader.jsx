import React from 'react';
import { FiArrowLeft, FiUser, FiUsers } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

const ChatHeader = ({ chat, onBack, isOnline }) => {
  const { darkMode } = useTheme();

  return (
    <div className={clsx(
      'p-4 border-b flex items-center gap-3',
      darkMode ? 'border-gray-700' : 'border-gray-200'
    )}>
      <button
        onClick={onBack}
        className={clsx(
          'sm:hidden p-1.5 rounded-lg transition-colors',
          darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
        )}
      >
        <FiArrowLeft size={20} />
      </button>
      
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
        {chat?.isGroup ? <FiUsers size={18} /> : <FiUser size={18} />}
      </div>
      
      <div className="flex-1">
        <h3 className={clsx('font-medium', darkMode ? 'text-white' : 'text-gray-800')}>
          {chat?.name || chat?.phone}
        </h3>
        <p className={clsx('text-xs', isOnline ? 'text-green-500' : 'text-gray-400')}>
          {isOnline ? 'Online' : 'WhatsApp'}
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;