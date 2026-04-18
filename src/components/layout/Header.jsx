import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FiWifi, FiWifiOff, FiLoader, FiClock, FiLogOut, FiMenu,
  FiChevronDown, FiServer, FiActivity, FiSmartphone
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ThemeToggle from '../common/ThemeToggle';
import clsx from 'clsx';

const Header = ({ isMobile, sidebarCollapsed, onMenuClick }) => {
  const navigate = useNavigate();
  const { isConnected, socket } = useSocket();
  const { logout, getUserName, getUserEmail } = useAuth();
  const { darkMode } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sessions, setSessions] = useState({});
  const [connectedDevicesCount, setConnectedDevicesCount] = useState(0);
  
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef(null);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get default session SAFELY
  const getDefaultSession = useCallback(() => {
    if (!sessions || typeof sessions !== 'object' || Object.keys(sessions).length === 0) {
      return null;
    }
    return sessions['default'] || sessions['RemoteAuth-default'] || null;
  }, [sessions]);

  // Check if default session is connected
  const isDefaultConnected = useCallback(() => {
    const ds = getDefaultSession();
    return ds?.connected === true;
  }, [getDefaultSession]);

  // Check if default session has QR
  const doesDefaultHaveQR = useCallback(() => {
    const ds = getDefaultSession();
    return ds?.hasQR === true || (ds?.qr && typeof ds.qr === 'string' && ds.qr.length > 0);
  }, [getDefaultSession]);

  // Check if default session is initializing
  const isDefaultInitializing = useCallback(() => {
    const ds = getDefaultSession();
    return ds?.initializing === true;
  }, [getDefaultSession]);

  // Update sessions from socket data
  const updateSessions = useCallback((sessionsData) => {
    if (!sessionsData || typeof sessionsData !== 'object') {
      setSessions({});
      setConnectedDevicesCount(0);
      return;
    }
    
    const sessionArray = Object.values(sessionsData);
    const connected = sessionArray.filter(s => s?.connected === true).length;
    
    setSessions(sessionsData);
    setConnectedDevicesCount(connected);
  }, []);

  // Fetch sessions status
  const fetchSessionsStatus = useCallback(() => {
    if (!socket) return;
    
    socket.emit('hdm:get_sessions_status', (status) => {
      updateSessions(status || {});
    });
  }, [socket, updateSessions]);

  // Socket listeners
  useEffect(() => {
    if (!socket) {
      setSessions({});
      setConnectedDevicesCount(0);
      return;
    }

    fetchSessionsStatus();

    socket.on('hdm:sessions_status', updateSessions);
    socket.on('hdm:status_update', fetchSessionsStatus);
    socket.on('hdm:ready', fetchSessionsStatus);
    socket.on('hdm:disconnected', fetchSessionsStatus);
    socket.on('hdm:qr_raw', fetchSessionsStatus);
    socket.on('hdm:auth_failure', fetchSessionsStatus);

    return () => {
      socket.off('hdm:sessions_status', updateSessions);
      socket.off('hdm:status_update', fetchSessionsStatus);
      socket.off('hdm:ready', fetchSessionsStatus);
      socket.off('hdm:disconnected', fetchSessionsStatus);
      socket.off('hdm:qr_raw', fetchSessionsStatus);
      socket.off('hdm:auth_failure', fetchSessionsStatus);
    };
  }, [socket, fetchSessionsStatus, updateSessions]);

  // Reset sessions when socket disconnects
  useEffect(() => {
    if (!isConnected) {
      setSessions({});
      setConnectedDevicesCount(0);
    }
  }, [isConnected]);

  // Status color: Red -> Yellow -> Green
  const getWhatsAppStatusColor = () => {
    if (!isConnected) return 'bg-gray-400';
    if (isDefaultConnected()) return 'bg-green-500';
    if (doesDefaultHaveQR()) return 'bg-yellow-500';
    if (isDefaultInitializing()) return 'bg-blue-500';
    return 'bg-red-500';
  };

  // Status text
  const getWhatsAppStatusText = () => {
    if (!isConnected) return 'Offline';
    if (isDefaultConnected()) return 'WhatsApp';
    if (doesDefaultHaveQR()) return 'Scan QR';
    if (isDefaultInitializing()) return 'Connecting...';
    return 'WhatsApp';
  };

  // Tooltip text
  const getWhatsAppTooltip = () => {
    if (!isConnected) return 'Server disconnected';
    
    const ds = getDefaultSession();
    if (ds?.connected) {
      return `WhatsApp Connected${ds.phone ? ` (${ds.phone})` : ''}`;
    }
    if (ds?.hasQR || ds?.qr) {
      return 'Scan QR code to connect WhatsApp';
    }
    if (ds?.initializing) {
      return 'Initializing WhatsApp...';
    }
    return 'WhatsApp Disconnected';
  };

  // Format time
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const adminName = getUserName() || 'Admin';
  const adminEmail = getUserEmail() || 'admin@hdm.bot';
  const getInitials = () => adminName?.charAt(0)?.toUpperCase() || 'A';

  const handleLogoClick = () => {
    logoClickCount.current += 1;
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    if (logoClickCount.current >= 5) {
      if (window.__hdm_unlock) window.__hdm_unlock();
      logoClickCount.current = 0;
      toast.success('🔓 Admin access granted', { duration: 1500 });
    } else {
      logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0; }, 1500);
    }
  };

  const getConnectedSessionNames = () => {
    if (!sessions || Object.keys(sessions).length === 0) return '';
    return Object.values(sessions)
      .filter(s => s?.connected === true)
      .map(s => s?.name || s?.sessionId?.replace('RemoteAuth-', '') || 'unknown')
      .join(', ');
  };

  // WhatsApp Icon
  const getWhatsAppIcon = () => {
    if (!isConnected) return <FiWifiOff className="text-gray-400" size={isMobile ? 12 : 14} />;
    if (isDefaultInitializing()) return <FiLoader className="text-blue-500 animate-spin" size={isMobile ? 12 : 14} />;
    if (isDefaultConnected()) return <FiWifi className="text-green-500" size={isMobile ? 12 : 14} />;
    return <FiWifiOff className="text-red-500" size={isMobile ? 12 : 14} />;
  };

  return (
    <header 
      className={clsx(
        'fixed top-0 right-0 z-30 transition-all duration-300',
        darkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-white shadow-sm'
      )}
      style={{ left: isMobile ? 0 : (sidebarCollapsed ? 80 : 260), right: 0 }}
    >
      <div className="px-3 md:px-6 py-2 md:py-3">
        <div className="flex justify-between items-center">
          {/* Left side */}
          <div className="flex items-center gap-2 md:gap-3">
            {isMobile && (
              <button onClick={onMenuClick} className={clsx(
                'p-1.5 md:p-2 rounded-lg transition-colors',
                darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )} aria-label="Menu">
                <FiMenu size={18} />
              </button>
            )}
            <div>
              <h2 onClick={handleLogoClick} className={clsx(
                'text-sm md:text-base font-semibold cursor-pointer select-none',
                darkMode ? 'text-white hover:text-primary-400' : 'text-gray-800 hover:text-primary-600'
              )} title="HDM Dashboard">
                HDM Dashboard
              </h2>
              <p className={clsx('hidden md:block text-xs', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                WhatsApp Business Automation
              </p>
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Server Status */}
            <div className="flex items-center gap-1 group relative">
              <div className={clsx('w-2 h-2 rounded-full', isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400')} />
              <span className={clsx('hidden sm:inline text-xs', darkMode ? 'text-gray-400' : 'text-gray-600')}>Server</span>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {isConnected ? 'Server Connected' : 'Server Disconnected'}
              </div>
            </div>

            <div className={clsx('w-px h-4', darkMode ? 'bg-gray-700' : 'bg-gray-300')} />

            {/* Time */}
            <div className="hidden md:flex items-center gap-1 group relative">
              <FiClock size={12} className="text-gray-400" />
              <span className={clsx('text-xs font-mono', darkMode ? 'text-gray-400' : 'text-gray-600')}>{formattedTime}</span>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {formattedDate}
              </div>
            </div>

            <div className={clsx('w-px h-4', darkMode ? 'bg-gray-700' : 'bg-gray-300')} />

            {/* WhatsApp Status */}
            <div className="flex items-center gap-1 group relative">
              <div className={clsx(
                'w-2 h-2 rounded-full',
                getWhatsAppStatusColor(),
                isDefaultConnected() && 'animate-pulse'
              )} />
              <span className={clsx('hidden sm:inline text-xs', darkMode ? 'text-gray-400' : 'text-gray-600')}>
                {getWhatsAppStatusText()}
              </span>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {getWhatsAppTooltip()}
              </div>
            </div>

            {/* WhatsApp Icon */}
            {getWhatsAppIcon()}

            <div className={clsx('w-px h-4', darkMode ? 'bg-gray-700' : 'bg-gray-300')} />

            {/* Device Count */}
            <div className="flex items-center gap-1 group relative">
              <div className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded-full transition-all',
                connectedDevicesCount > 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
              )}>
                <FiSmartphone size={10} className={clsx(
                  connectedDevicesCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                )} />
                <span className={clsx(
                  'text-xs font-medium',
                  connectedDevicesCount > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                )}>{connectedDevicesCount}</span>
              </div>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {connectedDevicesCount > 0 ? (
                  <>
                    <span>{connectedDevicesCount} device{connectedDevicesCount !== 1 ? 's' : ''} connected</span>
                    {getConnectedSessionNames() && (
                      <span className="block text-gray-400 text-[10px] mt-0.5 max-w-[200px] truncate">{getConnectedSessionNames()}</span>
                    )}
                  </>
                ) : (
                  'No devices connected'
                )}
              </div>
            </div>

            <div className={clsx('w-px h-4', darkMode ? 'bg-gray-700' : 'bg-gray-300')} />

            <ThemeToggle />

            {/* User Menu */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-1 group" aria-label="User menu">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {getInitials()}
                </div>
                <FiChevronDown size={12} className={clsx('hidden sm:block text-gray-400 transition-transform', showUserMenu && 'rotate-180')} />
              </button>
              
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className={clsx(
                    'absolute right-0 mt-2 w-64 rounded-lg shadow-xl border z-50 overflow-hidden animate-fade-in',
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  )}>
                    <div className={clsx('px-4 py-3', darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-primary-50 to-primary-100')}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md">
                          {getInitials()}
                        </div>
                        <div>
                          <p className={clsx('text-sm font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>{adminName}</p>
                          <p className={clsx('text-xs truncate max-w-[180px]', darkMode ? 'text-gray-400' : 'text-gray-500')}>{adminEmail}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={clsx('px-4 py-3 border-t border-b', darkMode ? 'border-gray-700' : 'border-gray-100')}>
                      <p className={clsx('text-xs font-semibold mb-2', darkMode ? 'text-gray-400' : 'text-gray-500')}>SYSTEM STATUS</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><FiServer size={12} /><span className="text-xs">Server</span></div>
                          <div className="flex items-center gap-1">
                            <div className={clsx('w-2 h-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-gray-400')} />
                            <span className={clsx('text-xs', isConnected ? 'text-green-500' : 'text-gray-400')}>{isConnected ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><FiActivity size={12} /><span className="text-xs">WhatsApp</span></div>
                          <div className="flex items-center gap-1">
                            <div className={clsx('w-2 h-2 rounded-full', getWhatsAppStatusColor())} />
                            <span className={clsx('text-xs', 
                              isDefaultConnected() ? 'text-green-500' : 
                              doesDefaultHaveQR() ? 'text-yellow-500' : 
                              'text-red-500'
                            )}>
                              {isDefaultConnected() ? 'Online' : doesDefaultHaveQR() ? 'QR Ready' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><FiSmartphone size={12} /><span className="text-xs">Devices</span></div>
                          <span className="text-xs font-medium">{connectedDevicesCount} connected</span>
                        </div>
                      </div>
                    </div>

                    <button onClick={handleLogout} className={clsx(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2',
                      darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                    )}>
                      <FiLogOut size={14} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fadeIn 0.2s ease-out}`}</style>
    </header>
  );
};

export default Header;