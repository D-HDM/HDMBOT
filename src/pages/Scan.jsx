import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import {
  FiWifi, FiWifiOff, FiRefreshCw, FiPower, FiServer,
  FiActivity, FiDatabase, FiClock, FiHardDrive,
  FiCheckCircle, FiAlertCircle, FiX, FiPlay, FiStopCircle,
  FiTerminal, FiFileText, FiTrash2, FiEye, FiEyeOff
} from 'react-icons/fi';
import QRCodeDisplay from '../components/whatsapp/QRCodeDisplay';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Scan = () => {
  const { darkMode } = useTheme();
  const { 
    socket, 
    isConnected: socketConnected, 
    whatsappReady, 
    phoneNumber, 
    connectionStatus,
    qrCode,
    qrRaw,
    connectWhatsApp,
    disconnectWhatsApp
  } = useSocket();
  
  const [loading, setLoading] = useState(false);
  const [serverStats, setServerStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showEnv, setShowEnv] = useState(false);
  const [manualQr, setManualQr] = useState('');
  const logsEndRef = useRef(null);

  // Fetch server stats
  const fetchServerStats = async () => {
    try {
      const [healthRes, analyticsRes] = await Promise.all([
        api.get('/health'),
        api.get('/analytics/dashboard').catch(() => ({ data: { stats: {} } }))
      ]);
      setServerStats({
        ...healthRes.data,
        analytics: analyticsRes.data?.stats || {}
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const res = await api.get('/logs/visits', {
        headers: { 'X-API-Key': 'hashdm' }
      });
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  useEffect(() => {
    fetchServerStats();
    const interval = setInterval(fetchServerStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showLogs) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [showLogs]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleConnect = async () => {
    setLoading(true);
    connectWhatsApp();
    toast.success('Requesting QR code...');
    setTimeout(() => setLoading(false), 2000);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    disconnectWhatsApp();
    toast.success('Disconnecting...');
    setTimeout(() => setLoading(false), 2000);
  };

  const handleRefreshQR = () => {
    if (!whatsappReady) {
      handleConnect();
    } else {
      toast('WhatsApp already connected');
    }
  };

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

  const getStatusColor = () => {
    if (whatsappReady) return 'text-green-500';
    if (connectionStatus === 'qr') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (whatsappReady) return 'Connected';
    if (connectionStatus === 'qr') return 'Waiting for QR Scan';
    if (connectionStatus === 'connecting') return 'Connecting...';
    return 'Disconnected';
  };

  return (
    <div className={clsx('min-h-screen p-4 md:p-6', darkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={clsx('text-2xl md:text-3xl font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
            WhatsApp Connection
          </h1>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            Scan QR code to connect WhatsApp • View server status and logs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - QR Code & Connection */}
          <div className="space-y-6">
            {/* Connection Status Card */}
            <div className={clsx('rounded-xl shadow-sm border p-6', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
                  Connection Status
                </h2>
                <div className="flex items-center gap-2">
                  <div className={clsx('w-2 h-2 rounded-full animate-pulse', getStatusColor())} />
                  <span className={clsx('text-sm font-medium', getStatusColor())}>
                    {getStatusText()}
                  </span>
                </div>
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center mb-4">
                {!whatsappReady ? (
                  <QRCodeDisplay
                    qrData={qrCode}
                    qrRaw={qrRaw}
                    onRefresh={handleRefreshQR}
                    isLoading={loading}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                      <FiCheckCircle className="text-green-500" size={32} />
                    </div>
                    <p className={clsx('text-lg font-medium', darkMode ? 'text-white' : 'text-gray-800')}>
                      WhatsApp Connected!
                    </p>
                    <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                      Phone: {phoneNumber || 'Unknown'}
                    </p>
                  </div>
                )}
              </div>

              {/* Manual QR Input (for pairing code) */}
              <div className="mb-4">
                <label className={clsx('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                  Or enter pairing code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualQr}
                    onChange={(e) => setManualQr(e.target.value)}
                    placeholder="e.g., 12345678"
                    className={clsx(
                      'flex-1 px-3 py-2 rounded-lg border outline-none',
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    )}
                  />
                  <button
                    onClick={() => toast('Pairing code feature coming soon')}
                    className={clsx(
                      'px-4 py-2 rounded-lg font-medium',
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    Pair
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleConnect}
                  disabled={loading || whatsappReady}
                  className={clsx(
                    'flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
                    whatsappReady
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-500 hover:bg-primary-600 text-white'
                  )}
                >
                  <FiPlay size={16} />
                  Connect WhatsApp
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={loading || !whatsappReady}
                  className={clsx(
                    'flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
                    !whatsappReady
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  )}
                >
                  <FiStopCircle size={16} />
                  Disconnect
                </button>
                <button
                  onClick={handleRefreshQR}
                  disabled={loading}
                  className={clsx(
                    'px-4 py-2.5 rounded-lg font-medium transition-colors',
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  )}
                >
                  <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Socket Status */}
            <div className={clsx('rounded-xl shadow-sm border p-4', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {socketConnected ? (
                    <FiWifi className="text-green-500" size={16} />
                  ) : (
                    <FiWifiOff className="text-red-500" size={16} />
                  )}
                  <span className={clsx('text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                    Socket Connection
                  </span>
                </div>
                <span className={clsx('text-sm', socketConnected ? 'text-green-500' : 'text-red-500')}>
                  {socketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Server Stats & Logs */}
          <div className="space-y-6">
            {/* Server Stats */}
            <div className={clsx('rounded-xl shadow-sm border p-5', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={clsx('text-lg font-semibold flex items-center gap-2', darkMode ? 'text-white' : 'text-gray-800')}>
                  <FiServer size={18} />
                  Server Status
                </h2>
                <button
                  onClick={fetchServerStats}
                  className={clsx('p-1.5 rounded-lg', darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                >
                  <FiRefreshCw size={14} />
                </button>
              </div>

              {serverStats && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={clsx('p-3 rounded-lg', darkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                      <p className={clsx('text-xs', darkMode ? 'text-gray-400' : 'text-gray-500')}>Uptime</p>
                      <p className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
                        {formatUptime(serverStats.uptime || 0)}
                      </p>
                    </div>
                    <div className={clsx('p-3 rounded-lg', darkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                      <p className={clsx('text-xs', darkMode ? 'text-gray-400' : 'text-gray-500')}>Database</p>
                      <p className={clsx('text-lg font-semibold', serverStats.database?.connected ? 'text-green-500' : 'text-red-500')}>
                        {serverStats.database?.connected ? 'Connected' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Environment</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{serverStats.environment || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Node Version</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{serverStats.server?.nodeVersion || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Platform</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{serverStats.server?.platform || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Memory (Heap)</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {formatBytes(serverStats.server?.memory?.heapUsed)} / {formatBytes(serverStats.server?.memory?.heapTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-500">{serverStats.analytics?.totalMessages || 0}</p>
                      <p className="text-xs text-gray-500">Messages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-500">{serverStats.analytics?.activeRules || 0}</p>
                      <p className="text-xs text-gray-500">Rules</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-500">{serverStats.analytics?.totalCommands || 0}</p>
                      <p className="text-xs text-gray-500">Commands</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Environment Info */}
            <div className={clsx('rounded-xl shadow-sm border p-5', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
                  Environment
                </h2>
                <button
                  onClick={() => setShowEnv(!showEnv)}
                  className={clsx('p-1.5 rounded-lg', darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                >
                  {showEnv ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>

              {showEnv && (
                <div className="space-y-1 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>VITE_API_URL</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {import.meta.env.VITE_API_URL || 'http://localhost:5000'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>MODE</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {import.meta.env.MODE || 'development'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>DEV</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {import.meta.env.DEV ? 'true' : 'false'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>PROD</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {import.meta.env.PROD ? 'true' : 'false'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Server Logs */}
            <div className={clsx('rounded-xl shadow-sm border p-5', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={clsx('text-lg font-semibold flex items-center gap-2', darkMode ? 'text-white' : 'text-gray-800')}>
                  <FiFileText size={18} />
                  Server Logs
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchLogs}
                    className={clsx('p-1.5 rounded-lg', darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                  >
                    <FiRefreshCw size={14} />
                  </button>
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className={clsx('p-1.5 rounded-lg', darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                  >
                    {showLogs ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </div>

              {showLogs && (
                <div className={clsx('rounded-lg overflow-hidden', darkMode ? 'bg-gray-900' : 'bg-gray-50')}>
                  <div className="max-h-[300px] overflow-y-auto">
                    {logs.length === 0 ? (
                      <p className="text-center py-8 text-gray-500 text-sm">No logs available</p>
                    ) : (
                      logs.map((log, i) => (
                        <div
                          key={i}
                          className={clsx(
                            'p-2 text-xs border-b last:border-b-0 font-mono',
                            darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
                          )}
                        >
                          <span className={clsx(
                            log.method === 'GET' ? 'text-blue-500' :
                            log.method === 'POST' ? 'text-green-500' :
                            log.method === 'DELETE' ? 'text-red-500' : 'text-yellow-500'
                          )}>
                            {log.method}
                          </span>
                          <span className="mx-2">{log.path}</span>
                          <span className="text-gray-500">{log.ip}</span>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scan;