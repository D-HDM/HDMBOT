import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FiGrid, FiMessageSquare, FiZap, FiBarChart2, FiSettings } from 'react-icons/fi';
import clsx from 'clsx';

const MobileNav = () => {
  const { darkMode } = useTheme();

  const navItems = [
    { path: '/dashboard', icon: FiGrid, label: 'Home' },
    { path: '/messages', icon: FiMessageSquare, label: 'Chats' },
    { path: '/automation', icon: FiZap, label: 'Auto' },
    { path: '/analytics', icon: FiBarChart2, label: 'Stats' },
    { path: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-sm',
        darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      )}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center w-full h-full transition-colors',
                  isActive
                    ? darkMode
                      ? 'text-primary-400'
                      : 'text-primary-600'
                    : darkMode
                      ? 'text-gray-500 hover:text-gray-300'
                      : 'text-gray-400 hover:text-gray-600'
                )
              }
            >
              <Icon size={22} />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;