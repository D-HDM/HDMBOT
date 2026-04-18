import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTime } from '../../utils/helpers';
import clsx from 'clsx';

const MessageBubble = ({ message, isOwn }) => {
  const { darkMode } = useTheme();

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <FiCheck size={12} className="text-gray-400" />;
      case 'delivered':
        return (
          <div className="flex">
            <FiCheck size={12} className="text-gray-400" />
            <FiCheck size={12} className="text-gray-400 -ml-1" />
          </div>
        );
      case 'read':
        return (
          <div className="flex">
            <FiCheck size={12} className="text-blue-500" />
            <FiCheck size={12} className="text-blue-500 -ml-1" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={clsx('flex mb-3', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[75%] px-4 py-2 rounded-2xl shadow-sm',
          isOwn
            ? darkMode
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-primary-500 text-white rounded-br-md'
            : darkMode
              ? 'bg-gray-700 text-gray-200 rounded-bl-md'
              : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
        )}
      >
        <p className="text-sm break-words">{message.body}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={clsx('text-xs', isOwn ? 'text-primary-100' : 'text-gray-400')}>
            {formatTime(message.timestamp)}
          </span>
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;