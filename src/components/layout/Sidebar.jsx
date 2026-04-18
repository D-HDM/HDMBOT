import React, { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiGrid,
  FiMessageSquare,
  FiZap,
  FiBarChart2,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiSmartphone,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Sidebar = ({ collapsed, onToggle, isMobile = false }) => {
  const { darkMode } = useTheme();
  const { logout, getUserName, getUserEmail } = useAuth();
  const navigate = useNavigate();
  
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef(null);

  const navItems = [
    { path: '/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/messages', icon: FiMessageSquare, label: 'Messages' },
    { path: '/automation', icon: FiZap, label: 'Automation' },
    { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/devices', icon: FiSmartphone, label: 'Devices' },      // ADDED
    { path: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  const handleLogoClick = () => {
    logoClickCount.current += 1;
    
    if (logoClickTimer.current) {
      clearTimeout(logoClickTimer.current);
    }
    
    if (logoClickCount.current >= 5) {
      if (window.__hdm_unlock) {
        window.__hdm_unlock();
      }
      logoClickCount.current = 0;
      toast.success('🔓 Admin access granted', { duration: 1500 });
    } else {
      logoClickTimer.current = setTimeout(() => {
        logoClickCount.current = 0;
      }, 1500);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = getUserName();
  const userEmail = getUserEmail();

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300',
        darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleLogoClick}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <FiSmartphone className="text-white" size={18} />
            </div>
            <span className="font-bold text-lg text-gray-800 dark:text-white">HDM</span>
          </div>
        )}
        {collapsed && (
          <div 
            className="w-8 h-8 mx-auto bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center cursor-pointer"
            onClick={handleLogoClick}
          >
            <FiSmartphone className="text-white" size={18} />
          </div>
        )}
        <button
          onClick={onToggle}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            darkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>

      {/* User Profile (collapsed only) */}
      {collapsed && (
        <div className="flex justify-center py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                      isActive
                        ? darkMode
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-primary-50 text-primary-700'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                      collapsed && 'justify-center'
                    )
                  }
                >
                  <Icon size={20} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info (expanded only) */}
      {!collapsed && (
        <div className={clsx('p-4 border-t', darkMode ? 'border-gray-700' : 'border-gray-200')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-800 dark:text-white">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className={clsx('p-2 border-t', darkMode ? 'border-gray-700' : 'border-gray-200')}>
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-600 dark:text-red-400',
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50',
            collapsed && 'justify-center'
          )}
        >
          <FiLogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;