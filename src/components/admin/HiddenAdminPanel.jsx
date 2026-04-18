import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  FiServer, FiActivity, FiRefreshCw, FiPower, FiRotateCw,
  FiDatabase, FiClock, FiWifi, FiWifiOff, FiAlertCircle,
  FiCheckCircle, FiX, FiZap, FiUsers, FiMessageSquare,
  FiFileText, FiTerminal, FiTrash2, FiShield, FiLock,
  FiUnlock, FiMail, FiKey, FiLogIn, FiEye, FiEyeOff,
  FiHardDrive, FiPlay, FiSmartphone, FiLogOut, FiRadio
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Admin credentials
const ADMIN_EMAIL = 'davismcintyre5@gmail.com';
const ADMIN_PASSWORD = 'Hdm@2002';
const ADMIN_HASH = 'hashdm';

const HiddenAdminPanel = () => {
  const { darkMode } = useTheme();
  const { socket, isConnected, whatsappReady } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Panel state
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Admin panel data
  const [serverStats, setServerStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmAction, setConfirmAction] = useState(null);
  const [accessMethod, setAccessMethod] = useState(null);
  
  // Devices state
  const [sessions, setSessions] = useState({});
  const [deletingSession, setDeletingSession] = useState(null);
  const [refreshingDevices, setRefreshingDevices] = useState(false);

  // ============================================
  // TRIGGER LOGIN (called by all access methods)
  // ============================================
  const triggerLogin = (method) => {
    console.log('🔐 Admin login triggered via:', method);
    setAccessMethod(method);
    setShowLoginModal(true);
    setLoginError('');
    setEmail('');
    setPassword('');
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    setIsVisible(true);
    toast.success('Admin access granted', { icon: '🔓', duration: 2000 });
    sessionStorage.setItem('hdm_admin_auth', 'true');
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    setIsVisible(false);
    sessionStorage.removeItem('hdm_admin_auth');
    toast('Admin panel locked', { icon: '🔒' });
  };

  // Check for existing auth on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('hdm_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      // Panel visibility will be controlled by user clicking the hidden trigger or using shortcut
    }
  }, []);

  // ============================================
  // EXPOSE GLOBAL UNLOCK FUNCTION (for header click pattern)
  // ============================================
  useEffect(() => {
    window.__hdm_unlock = () => triggerLogin('click_pattern');
    window.__hdm_trigger_admin = () => triggerLogin('console');
    console.log('🔧 Admin unlock functions exposed: window.__hdm_unlock() and window.__hdm_trigger_admin()');
    return () => {
      delete window.__hdm_unlock;
      delete window.__hdm_trigger_admin;
    };
  }, []);

  // ============================================
  // URL ACCESS (hash or query param)
  // ============================================
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const params = new URLSearchParams(location.search);
    
    if (hash === ADMIN_HASH || 
        params.get('access') === ADMIN_HASH || 
        params.get('admin') === ADMIN_HASH) {
      triggerLogin('url');
      // Clean URL without reload
      navigate(location.pathname, { replace: true });
    }
  }, [location]);

  // ============================================
  // KEYBOARD SHORTCUTS (Ctrl+Shift+A or Ctrl+Alt+H)
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Debug log (remove in production)
      if (e.ctrlKey && e.shiftKey) {
        console.log('🔑 Key combo:', { ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, key: e.key });
      }
      
      // Ctrl+Shift+A
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        e.stopPropagation();
        triggerLogin('key_combo_ctrl_shift_a');
      }
      
      // Ctrl+Alt+H (alternative)
      if (e.ctrlKey && e.altKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        e.stopPropagation();
        triggerLogin('key_combo_ctrl_alt_h');
      }
      
      // Escape to hide panel
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // ============================================
  // LOGIN HANDLER
  // ============================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!email || !password) {
      setLoginError('Email and password are required');
      return;
    }
    
    setLoginLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      handleAuthSuccess();
    } else {
      setLoginError('Invalid email or password');
    }
    
    setLoginLoading(false);
  };

  // ============================================
  // FETCH SESSIONS (DEVICES)
  // ============================================
  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions', {
        headers: { 'X-API-Key': ADMIN_HASH }
      });
      setSessions(res.data?.sessions || {});
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const refreshDevices = async () => {
    setRefreshingDevices(true);
    await fetchSessions();
    setRefreshingDevices(false);
    toast.success('Devices refreshed');
  };

  // ============================================
  // DELETE SPECIFIC SESSION
  // ============================================
  const handleDeleteSession = async (sessionId) => {
    try {
      if (socket) {
        socket.emit('hdm:disconnect_session', { 
          sessionId, 
          logout: true 
        }, (response) => {
          if (response?.success) {
            toast.success(`Session "${sessionId}" deleted`);
            fetchSessions();
          } else {
            toast.error(`Failed to delete session "${sessionId}"`);
          }
        });
      }
      
      await api.delete(`/admin/sessions/${sessionId}`, {
        headers: { 'X-API-Key': ADMIN_HASH }
      }).catch(() => {});
      
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session');
    } finally {
      setDeletingSession(null);
    }
  };

  // ============================================
  // FETCH SERVER STATS
  // ============================================
  const fetchServerStats = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const adminKey = ADMIN_HASH;
      
      let statsData = null;
      try {
        const adminRes = await api.get('/admin/status', {
          headers: { 'X-API-Key': adminKey }
        });
        statsData = adminRes.data;
      } catch (err) {
        const healthRes = await api.get('/health');
        statsData = healthRes.data;
      }
      
      const analyticsRes = await api.get('/analytics/dashboard').catch(() => ({ data: { stats: {} } }));
      
      setServerStats({
        ...statsData,
        analytics: analyticsRes.data?.stats || {}
      });
    } catch (err) {
      console.error('Failed to fetch stats');
      toast.error('Failed to fetch server statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await api.get('/logs/visits', {
        headers: { 'X-API-Key': ADMIN_HASH }
      });
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs');
    }
  };

  useEffect(() => {
    if (isVisible && isAuthenticated) {
      fetchServerStats();
      fetchLogs();
      fetchSessions();
      
      const interval = setInterval(() => {
        fetchServerStats();
        fetchLogs();
        fetchSessions();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, isAuthenticated]);

  // ============================================
  // SERVER ACTIONS
  // ============================================
  const handleStartServer = async () => {
    toast.success('Please start the server manually using "npm run dev" or "npm start"');
  };

  const handleRestartServer = async () => {
    try {
      await api.post('/admin/restart', {}, {
        headers: { 'X-API-Key': ADMIN_HASH }
      });
      toast.success('Server restart initiated');
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      toast.error('Failed to restart server');
    }
  };

  const handleStopServer = async () => {
    try {
      await api.post('/admin/stop', {}, {
        headers: { 'X-API-Key': ADMIN_HASH }
      });
      toast.success('Server stopped');
    } catch (err) {
      toast.error('Failed to stop server');
    }
  };

  const handleClearSessions = async () => {
    try {
      await api.delete('/admin/sessions', {
        headers: { 'X-API-Key': ADMIN_HASH }
      });
      toast.success('All sessions cleared');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to clear sessions');
    }
  };

  const handleResetWhatsApp = async () => {
    try {
      await api.delete('/admin/sessions', {
        headers: { 'X-API-Key': ADMIN_HASH }
      });
      toast.success('WhatsApp session cleared. Reconnecting...');
      if (socket) {
        socket.emit('hdm:disconnect_wa');
        setTimeout(() => {
          socket.emit('hdm:connect');
        }, 1000);
      }
      fetchSessions();
    } catch (err) {
      toast.error('Failed to reset WhatsApp session');
    }
  };

  const handleReloadCommands = () => {
    if (socket) {
      socket.emit('hdm:reload_commands');
      toast.success('Commands reloaded');
    }
  };

  const handleReloadRules = () => {
    if (socket) {
      socket.emit('hdm:reload_rules');
      toast.success('Rules reloaded');
    }
  };

  const handleClearCache = () => {
    if (socket) {
      socket.emit('hdm:clear_cache');
      toast.success('Cache cleared');
    }
  };

  // ============================================
  // FORMATTERS
  // ============================================
  const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSessionStatusColor = (session) => {
    if (session.connected) return 'text-green-500';
    if (session.hasQR || session.qr) return 'text-yellow-500';
    if (session.initializing) return 'text-blue-500';
    return 'text-red-500';
  };

  const getSessionStatusText = (session) => {
    if (session.connected) return 'Connected';
    if (session.hasQR || session.qr) return 'QR Ready';
    if (session.initializing) return 'Initializing';
    return 'Disconnected';
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={clsx(
                'w-full max-w-md rounded-2xl shadow-2xl border p-6',
                darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <FiShield className="text-primary-500" size={24} />
                  </div>
                  <div>
                    <h2 className={clsx('text-xl font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
                      Admin Access
                    </h2>
                    <p className={clsx('text-xs', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                      Secure authentication required
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className={clsx(
                    'p-1.5 rounded-lg transition-colors',
                    darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  )}
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-1.5', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={clsx(
                        'w-full pl-10 pr-3 py-2.5 rounded-lg border outline-none transition-colors',
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:border-primary-500'
                          : 'bg-white border-gray-300 text-gray-800 focus:border-primary-500'
                      )}
                      placeholder="admin@example.com"
                      autoComplete="email"
                      disabled={loginLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={clsx('block text-sm font-medium mb-1.5', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={clsx(
                        'w-full pl-10 pr-10 py-2.5 rounded-lg border outline-none transition-colors',
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:border-primary-500'
                          : 'bg-white border-gray-300 text-gray-800 focus:border-primary-500'
                      )}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={loginLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
                
                {loginError && (
                  <div className={clsx(
                    'p-3 rounded-lg text-sm flex items-center gap-2',
                    darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                  )}>
                    <FiAlertCircle size={16} />
                    {loginError}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loginLoading}
                  className={clsx(
                    'w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
                    darkMode
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-primary-500 hover:bg-primary-600 text-white'
                  )}
                >
                  {loginLoading ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={18} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FiLogIn size={18} />
                      Authenticate
                    </>
                  )}
                </button>
              </form>
              
              <p className={clsx(
                'text-center text-xs mt-4',
                darkMode ? 'text-gray-500' : 'text-gray-400'
              )}>
                Press Escape to cancel
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {isVisible && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={clsx(
              'fixed bottom-4 right-4 z-[100] w-[600px] max-h-[85vh] rounded-2xl shadow-2xl border overflow-hidden',
              darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            {/* Header */}
            <div className={clsx(
              'flex items-center justify-between p-4 border-b',
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            )}>
              <div className="flex items-center gap-2">
                <FiShield className="text-primary-500" size={20} />
                <h3 className={clsx('font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
                  Admin Console
                </h3>
                <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-500 rounded-full">
                  {accessMethod?.replace(/_/g, ' ') || 'Secure'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { fetchServerStats(); fetchLogs(); fetchSessions(); }}
                  className={clsx(
                    'p-1.5 rounded-lg transition-colors',
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  )}
                  title="Refresh All"
                >
                  <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleLock}
                  className={clsx(
                    'p-1.5 rounded-lg transition-colors',
                    darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-200 text-red-500'
                  )}
                  title="Lock Panel"
                >
                  <FiLock size={16} />
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className={clsx(
                    'p-1.5 rounded-lg transition-colors',
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  )}
                  title="Minimize"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Access Method Indicator */}
            <div className={clsx(
              'px-4 py-1.5 text-xs border-b flex items-center justify-between',
              darkMode ? 'border-gray-700 bg-gray-800/50 text-gray-400' : 'border-gray-200 bg-gray-50/50 text-gray-500'
            )}>
              <span>Access: {accessMethod || 'authenticated'}</span>
              <div className="flex items-center gap-3">
                <span className="cursor-help" title="Press Ctrl+Shift+A to open admin login">⌨️ Ctrl+Shift+A</span>
              </div>
            </div>

            {/* Tabs */}
            <div className={clsx('flex border-b', darkMode ? 'border-gray-700' : 'border-gray-200')}>
              {[
                { id: 'overview', label: 'Overview', icon: FiActivity },
                { id: 'devices', label: 'Devices', icon: FiSmartphone },
                { id: 'actions', label: 'Actions', icon: FiZap },
                { id: 'logs', label: 'Logs', icon: FiFileText },
                { id: 'terminal', label: 'Terminal', icon: FiTerminal }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
                    activeTab === tab.id
                      ? darkMode
                        ? 'text-primary-400 border-b-2 border-primary-400'
                        : 'text-primary-600 border-b-2 border-primary-600'
                      : darkMode
                        ? 'text-gray-500 hover:text-gray-300'
                        : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Overview Tab */}
              {activeTab === 'overview' && serverStats && (
                <div className="space-y-4">
                  {/* Status Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className={clsx('p-3 rounded-lg', darkMode ? 'bg-gray-800' : 'bg-gray-50')}>
                      <div className="flex items-center gap-2 mb-1">
                        {isConnected ? <FiWifi className="text-green-500" size={14} /> : <FiWifiOff className="text-red-500" size={14} />}
                        <span className={clsx('text-xs font-medium', darkMode ? 'text-gray-400' : 'text-gray-600')}>Socket</span>
                      </div>
                      <p className={clsx('text-base font-bold', isConnected ? 'text-green-500' : 'text-red-500')}>
                        {isConnected ? 'Connected' : 'Offline'}
                      </p>
                    </div>
                    
                    <div className={clsx('p-3 rounded-lg', darkMode ? 'bg-gray-800' : 'bg-gray-50')}>
                      <div className="flex items-center gap-2 mb-1">
                        {whatsappReady ? <FiCheckCircle className="text-green-500" size={14} /> : <FiAlertCircle className="text-yellow-500" size={14} />}
                        <span className={clsx('text-xs font-medium', darkMode ? 'text-gray-400' : 'text-gray-600')}>WhatsApp</span>
                      </div>
                      <p className={clsx('text-base font-bold', whatsappReady ? 'text-green-500' : 'text-yellow-500')}>
                        {whatsappReady ? 'Connected' : 'Offline'}
                      </p>
                    </div>
                    
                    <div className={clsx('p-3 rounded-lg', darkMode ? 'bg-gray-800' : 'bg-gray-50')}>
                      <div className="flex items-center gap-2 mb-1">
                        <FiDatabase className="text-blue-500" size={14} />
                        <span className={clsx('text-xs font-medium', darkMode ? 'text-gray-400' : 'text-gray-600')}>Database</span>
                      </div>
                      <p className={clsx('text-base font-bold', serverStats.database?.connected ? 'text-green-500' : 'text-red-500')}>
                        {serverStats.database?.connected ? 'Connected' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  {/* Server Info */}
                  <div className="space-y-2">
                    <h4 className={clsx('text-sm font-semibold', darkMode ? 'text-gray-300' : 'text-gray-700')}>Server Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Status</span><span className="text-green-500">{serverStats.status || 'Healthy'}</span></div>
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Environment</span><span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{serverStats.environment || 'dev'}</span></div>
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Uptime</span><span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{formatUptime(serverStats.uptime || 0)}</span></div>
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Node</span><span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{serverStats.server?.nodeVersion || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Platform</span><span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{serverStats.server?.platform || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Port</span><span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{serverStats.server?.port || '5000'}</span></div>
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="space-y-2">
                    <h4 className={clsx('text-sm font-semibold', darkMode ? 'text-gray-300' : 'text-gray-700')}>Memory Usage</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Heap Used</span><span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{formatBytes(serverStats.server?.memory?.heapUsed)}</span></div>
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Heap Total</span><span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{formatBytes(serverStats.server?.memory?.heapTotal)}</span></div>
                      <div className="flex justify-between"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>RSS</span><span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{formatBytes(serverStats.server?.memory?.rss)}</span></div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(serverStats.server?.memory?.heapUsed / serverStats.server?.memory?.heapTotal) * 100}%` }} />
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"><p className="text-lg font-bold text-blue-600 dark:text-blue-400">{serverStats?.analytics?.totalMessages || 0}</p><p className="text-xs text-gray-500">Messages</p></div>
                    <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20"><p className="text-lg font-bold text-green-600 dark:text-green-400">{serverStats?.analytics?.activeRules || 0}</p><p className="text-xs text-gray-500">Rules</p></div>
                    <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20"><p className="text-lg font-bold text-purple-600 dark:text-purple-400">{serverStats?.analytics?.totalCommands || 0}</p><p className="text-xs text-gray-500">Commands</p></div>
                    <div className="text-center p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20"><p className="text-lg font-bold text-orange-600 dark:text-orange-400">{logs.length}</p><p className="text-xs text-gray-500">Requests</p></div>
                  </div>
                </div>
              )}

              {/* Devices Tab */}
              {activeTab === 'devices' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={clsx('text-sm font-semibold', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                      Connected Devices & Sessions
                    </h4>
                    <button
                      onClick={refreshDevices}
                      disabled={refreshingDevices}
                      className={clsx(
                        'p-1.5 rounded-lg transition-colors',
                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                      )}
                    >
                      <FiRefreshCw size={14} className={refreshingDevices ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {Object.keys(sessions).length === 0 ? (
                    <div className={clsx(
                      'text-center py-8 rounded-lg',
                      darkMode ? 'bg-gray-800' : 'bg-gray-50'
                    )}>
                      <FiSmartphone className={clsx('mx-auto text-3xl mb-2', darkMode ? 'text-gray-600' : 'text-gray-400')} />
                      <p className={clsx('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                        No active sessions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(sessions).map(([sessionId, session]) => (
                        <div
                          key={sessionId}
                          className={clsx(
                            'p-3 rounded-lg border flex items-center justify-between',
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={clsx(
                                'w-2 h-2 rounded-full',
                                session.connected ? 'bg-green-500 animate-pulse' : 
                                session.hasQR ? 'bg-yellow-500' : 'bg-red-500'
                              )} />
                              <span className={clsx('font-medium', darkMode ? 'text-white' : 'text-gray-800')}>
                                {session.name || sessionId}
                              </span>
                              <span className={clsx(
                                'text-xs px-2 py-0.5 rounded-full',
                                getSessionStatusColor(session)
                              )}>
                                {getSessionStatusText(session)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              {session.phone && (
                                <span className={clsx('text-xs', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                                  📱 {session.phone}
                                </span>
                              )}
                              {session.saved && (
                                <span className={clsx('text-xs', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                                  💾 Saved
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setDeletingSession(sessionId);
                              handleDeleteSession(sessionId);
                            }}
                            disabled={deletingSession === sessionId}
                            className={clsx(
                              'p-2 rounded-lg transition-colors',
                              darkMode 
                                ? 'text-red-400 hover:bg-red-900/30' 
                                : 'text-red-500 hover:bg-red-50'
                            )}
                            title={`Delete session "${sessionId}"`}
                          >
                            {deletingSession === sessionId ? (
                              <FiRefreshCw size={16} className="animate-spin" />
                            ) : (
                              <FiTrash2 size={16} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className={clsx('text-xs font-medium mb-2', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                      Quick Actions
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setConfirmAction('clear')} className={clsx('p-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2', darkMode ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100')}>
                        <FiTrash2 size={14} />Clear All
                      </button>
                      <button onClick={() => setConfirmAction('reset_wa')} className={clsx('p-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2', darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100')}>
                        <FiRefreshCw size={14} />Reset WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <h4 className={clsx('text-sm font-semibold mb-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>Server Control</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setConfirmAction('start')} className={clsx('p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2', darkMode ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')}><FiPlay size={20} />Start</button>
                    <button onClick={() => setConfirmAction('restart')} className={clsx('p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2', darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100')}><FiRotateCw size={20} />Restart</button>
                    <button onClick={() => setConfirmAction('stop')} className={clsx('p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2', darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100')}><FiPower size={20} />Stop</button>
                    <button onClick={() => setConfirmAction('clear')} className={clsx('p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2', darkMode ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100')}><FiTrash2 size={20} />Clear Sessions</button>
                  </div>

                  <h4 className={clsx('text-sm font-semibold mb-2 mt-4', darkMode ? 'text-gray-300' : 'text-gray-700')}>Bot Control</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleReloadCommands} className={clsx('p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2', darkMode ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-600 hover:bg-purple-100')}><FiTerminal size={20} />Reload Commands</button>
                    <button onClick={handleReloadRules} className={clsx('p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2', darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100')}><FiFileText size={20} />Reload Rules</button>
                    <button onClick={handleClearCache} className={clsx('p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2 col-span-2', darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}><FiHardDrive size={20} />Clear Cache</button>
                  </div>
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={clsx('text-sm font-semibold', darkMode ? 'text-gray-300' : 'text-gray-700')}>Recent Request Logs</h4>
                    <button onClick={fetchLogs} className="text-xs text-primary-500 hover:text-primary-600">Refresh</button>
                  </div>
                  <div className={clsx('rounded-lg overflow-hidden', darkMode ? 'bg-gray-800' : 'bg-gray-50')}>
                    <div className="max-h-[300px] overflow-y-auto">
                      {logs.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">No logs available</p>
                      ) : (
                        logs.map((log, i) => (
                          <div key={i} className={clsx('p-2 text-xs border-b last:border-b-0', darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-100')}>
                            <div className="flex items-center gap-2">
                              <span className={clsx('font-mono font-bold', log.method === 'GET' ? 'text-blue-500' : log.method === 'POST' ? 'text-green-500' : log.method === 'DELETE' ? 'text-red-500' : 'text-yellow-500')}>{log.method}</span>
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{log.path}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-gray-500"><span>{log.ip}</span><span>•</span><span>{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Terminal Tab */}
              {activeTab === 'terminal' && (
                <div className="space-y-3">
                  <h4 className={clsx('text-sm font-semibold', darkMode ? 'text-gray-300' : 'text-gray-700')}>Quick Commands</h4>
                  <div className="space-y-2">
                    {['.reload', '.setprefix !', '.mode private', '.mode public', '.alwaysonline on', '.listadmins', '.bugmenu', '.status'].map((cmd, i) => (
                      <div key={i} className={clsx('p-2.5 rounded-lg flex items-center justify-between', darkMode ? 'bg-gray-800' : 'bg-gray-50')}>
                        <code className="text-primary-500 font-mono">{cmd}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={clsx('p-3 border-t text-center text-xs', darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400')}>
              HDM Admin Console v2.0 • Secured
            </div>

            {/* Confirmation Dialog */}
            <AnimatePresence>
              {confirmAction && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[101]">
                  <div className={clsx('p-4 rounded-lg w-[280px]', darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200')}>
                    <h5 className="font-semibold mb-2 flex items-center gap-2"><FiAlertCircle className="text-yellow-500" />Confirm Action</h5>
                    <p className="text-sm mb-4">
                      {confirmAction === 'start' && 'Start server?'}
                      {confirmAction === 'restart' && 'Restart server? All connections will be dropped.'}
                      {confirmAction === 'stop' && 'Stop server? WhatsApp will disconnect.'}
                      {confirmAction === 'clear' && 'Clear all WhatsApp sessions? You will need to scan QR again.'}
                      {confirmAction === 'reset_wa' && 'Reset WhatsApp session? This will clear all saved credentials.'}
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setConfirmAction(null)} className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700">Cancel</button>
                      <button onClick={() => {
                        if (confirmAction === 'start') handleStartServer();
                        if (confirmAction === 'restart') handleRestartServer();
                        if (confirmAction === 'stop') handleStopServer();
                        if (confirmAction === 'clear') handleClearSessions();
                        if (confirmAction === 'reset_wa') handleResetWhatsApp();
                        setConfirmAction(null);
                      }} className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">Confirm</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HiddenAdminPanel;