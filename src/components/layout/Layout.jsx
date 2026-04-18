import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import HiddenAdminPanel from '../admin/HiddenAdminPanel';
import clsx from 'clsx';

const Layout = () => {
  const { darkMode } = useTheme();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);

  return (
    <div className={clsx(
      'min-h-screen',
      darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    )}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div
          className={clsx(
            'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar 
            collapsed={false} 
            onToggle={toggleMobileMenu} 
            isMobile 
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={clsx(
          'transition-all duration-300 ease-in-out',
          !isMobile && (sidebarCollapsed ? 'ml-20' : 'ml-64')
        )}
      >
        <Header
          isMobile={isMobile}
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={toggleMobileMenu}
        />
        
        <main className="p-4 md:p-6 mt-16">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav />}

      {/* Hidden Admin Panel - Access via Ctrl+Shift+A, #hashdm, or ?access=hashdm */}
      <HiddenAdminPanel />
    </div>
  );
};

export default Layout;