import React from 'react';
import { FiSearch, FiUser, FiUsers } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTime, truncate } from '../../utils/helpers';
import clsx from 'clsx';

const ChatList = ({ chats = [], selectedChat, onSelectChat, onSearch }) => {
  const { darkMode } = useTheme();

  return (
    <div className={clsx('h-full flex flex-col', darkMode ? 'bg-gray-800' : 'bg-white')}>
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search chats..."
            onChange={(e) => onSearch?.(e.target.value)}
            className={clsx(
              'w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-colors',
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500'
                : 'bg-gray-100 border-gray-200 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary-500'
            )}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-8 text-center">
            <FiUser className="mx-auto text-gray-400 mb-2" size={32} />
            <p className={clsx('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>No conversations yet</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={clsx(
                'w-full p-3 flex items-start gap-3 transition-colors border-b',
                selectedChat?.id === chat.id
                  ? darkMode
                    ? 'bg-primary-500/10 border-primary-500/30'
                    : 'bg-primary-50 border-primary-100'
                  : darkMode
                    ? 'hover:bg-gray-700 border-gray-700'
                    : 'hover:bg-gray-50 border-gray-200'
              )}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
                  {chat.isGroup ? <FiUsers size={18} /> : <FiUser size={18} />}
                </div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className={clsx('text-sm font-medium truncate', darkMode ? 'text-white' : 'text-gray-800')}>
                    {chat.name || chat.phone}
                  </p>
                  <span className={clsx('text-xs', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                    {formatTime(chat.lastMessage?.timestamp)}
                  </span>
                </div>
                <p className={clsx('text-xs truncate mt-0.5', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                  {truncate(chat.lastMessage?.body || 'No messages yet', 25)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;