// src/components/devices/DeviceManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FiPlus, FiTrash2, FiWifi, FiWifiOff, FiRefreshCw, 
  FiSmartphone, FiCamera, FiMessageSquare, FiSend,
  FiEye, FiEyeOff, FiShare2, FiPower, FiLoader,
  FiCheckCircle, FiAlertCircle, FiFolder, FiFolderPlus
} from 'react-icons/fi';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const DeviceManager = () => {
  const { darkMode } = useTheme();
  const { socket, isConnected } = useSocket();
  const [sessions, setSessions] = useState({});
  const [newSessionId, setNewSessionId] = useState('');
  const [loading, setLoading] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [showQR, setShowQR] = useState({});
  const [qrData, setQrData] = useState({});
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track previous sessions to detect deletions
  const prevSessionsRef = useRef({});

  // Normalize session ID (remove session- prefix)
  const normalizeSessionId = (id) => {
    if (!id) return id;
    if (id.startsWith('session-')) {
      return id.substring(8);
    }
    return id;
  };

  // Get display name for session
  const getDisplayName = (sessionId) => {
    return normalizeSessionId(sessionId);
  };

  const fetchSessionsStatus = async () => {
    if (socket && isConnected) {
      socket.emit('hdm:get_sessions_status', (status) => {
        // Normalize session keys for display
        const normalizedStatus = {};
        Object.entries(status).forEach(([key, value]) => {
          const normalizedKey = normalizeSessionId(key);
          normalizedStatus[normalizedKey] = {
            ...value,
            originalId: key,
            displayName: normalizedKey
          };
        });
        
        // Check for deleted sessions
        const prevSessions = prevSessionsRef.current;
        const currentSessionIds = new Set(Object.keys(normalizedStatus));
        const prevSessionIds = new Set(Object.keys(prevSessions));
        
        // Find deleted sessions
        const deletedSessions = [...prevSessionIds].filter(id => !currentSessionIds.has(id));
        
        if (deletedSessions.length > 0) {
          console.log('🗑️ Detected deleted sessions:', deletedSessions);
          deletedSessions.forEach(sessionId => {
            // Clear any UI state for deleted session
            setShowQR(prev => {
              const newState = { ...prev };
              delete newState[sessionId];
              return newState;
            });
            setQrData(prev => {
              const newState = { ...prev };
              delete newState[sessionId];
              return newState;
            });
            if (selectedSession === sessionId) {
              setSelectedSession(null);
            }
          });
          toast.success(`Removed ${deletedSessions.length} deleted session(s)`, { duration: 2000 });
        }
        
        // Update reference
        prevSessionsRef.current = normalizedStatus;
        setSessions(normalizedStatus);
      });
    }
  };

  // Manual refresh with loading indicator
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchSessionsStatus();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Sessions refreshed');
  };

  useEffect(() => {
    fetchSessionsStatus();
    const interval = setInterval(fetchSessionsStatus, 5000);
    return () => clearInterval(interval);
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket) return;
    
    const handleQR = ({ sessionId, qr }) => {
      const normalizedId = normalizeSessionId(sessionId);
      setQrData(prev => ({ ...prev, [normalizedId]: qr }));
      setShowQR(prev => ({ ...prev, [normalizedId]: true }));
      toast.success(`QR Code ready for session: ${normalizedId}`, { duration: 3000 });
    };
    
    const handleStatusUpdate = ({ sessionId, status, phone }) => {
      fetchSessionsStatus();
      const normalizedId = normalizeSessionId(sessionId);
      if (status === 'connected') {
        toast.success(`Session "${normalizedId}" connected! Phone: ${phone}`);
        setShowQR(prev => ({ ...prev, [normalizedId]: false }));
      }
    };
    
    socket.on('hdm:qr_raw', handleQR);
    socket.on('hdm:status_update', handleStatusUpdate);
    
    return () => {
      socket.off('hdm:qr_raw', handleQR);
      socket.off('hdm:status_update', handleStatusUpdate);
    };
  }, [socket]);

  const handleAddSession = async () => {
    let sessionId = newSessionId.trim().toLowerCase();
    if (!sessionId) {
      toast.error('Please enter a session ID');
      return;
    }
    
    // Remove 'session-' prefix if user typed it
    if (sessionId.startsWith('session-')) {
      sessionId = sessionId.substring(8);
    }
    
    // Remove any spaces or special characters
    sessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    if (!sessionId) {
      toast.error('Invalid session ID. Use letters, numbers, underscore, or hyphen.');
      return;
    }
    
    // Check if session already exists
    if (sessions[sessionId]?.connected) {
      toast.error(`Session "${sessionId}" is already connected`);
      return;
    }
    
    setLoading(prev => ({ ...prev, [sessionId]: true }));
    socket.emit('hdm:connect_session', { sessionId }, (response) => {
      if (response.success) {
        toast.success(`Session "${sessionId}" created! Scan QR code to connect.`);
        setNewSessionId('');
        fetchSessionsStatus();
      } else {
        toast.error(`Failed: ${response.error}`);
      }
      setLoading(prev => ({ ...prev, [sessionId]: false }));
    });
  };

  const handleRemoveSession = (sessionId) => {
    const displayName = getDisplayName(sessionId);
    if (window.confirm(`Remove session "${displayName}"? This will disconnect WhatsApp and delete saved authentication.`)) {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }));
      socket.emit('hdm:disconnect_session', { sessionId }, (response) => {
        if (response.success) {
          toast.success(`Session "${displayName}" removed`);
          // Clear UI state immediately
          setShowQR(prev => {
            const newState = { ...prev };
            delete newState[sessionId];
            return newState;
          });
          setQrData(prev => {
            const newState = { ...prev };
            delete newState[sessionId];
            return newState;
          });
          if (selectedSession === sessionId) {
            setSelectedSession(null);
          }
          fetchSessionsStatus();
        } else {
          toast.error(`Failed to remove: ${response.error}`);
        }
        setActionLoading(prev => ({ ...prev, [sessionId]: false }));
      });
    }
  };

  const handleToggleConnection = (sessionId, currentlyConnected) => {
    const displayName = getDisplayName(sessionId);
    setActionLoading(prev => ({ ...prev, [sessionId]: true }));
    if (currentlyConnected) {
      socket.emit('hdm:disconnect_session', { sessionId }, (response) => {
        if (response.success) {
          toast.success(`Session "${displayName}" disconnected`);
          fetchSessionsStatus();
        } else {
          toast.error(`Failed to disconnect: ${response.error}`);
        }
        setActionLoading(prev => ({ ...prev, [sessionId]: false }));
      });
    } else {
      socket.emit('hdm:connect_session', { sessionId }, (response) => {
        if (response.success) {
          toast.success(`Connecting session "${displayName}"...`);
          fetchSessionsStatus();
        } else {
          toast.error(`Failed to connect: ${response.error}`);
        }
        setActionLoading(prev => ({ ...prev, [sessionId]: false }));
      });
    }
  };

  const handleViewQR = (sessionId) => {
    if (qrData[sessionId]) {
      setShowQR(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
    } else {
      toast.error('No QR code available for this session. Please reconnect.');
    }
  };

  const handleShareQR = (sessionId) => {
    if (qrData[sessionId]) {
      const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData[sessionId])}&size=256&margin=1`;
      if (navigator.share) {
        navigator.share({
          title: `WhatsApp QR Code for ${getDisplayName(sessionId)}`,
          text: 'Scan this QR code to connect to WhatsApp bot',
          url: qrUrl,
        }).catch(() => {
          navigator.clipboard.writeText(qrUrl);
          toast.success('QR link copied to clipboard!');
        });
      } else {
        navigator.clipboard.writeText(qrUrl);
        toast.success('QR link copied to clipboard!');
      }
    } else {
      toast.error('No QR code available to share');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedSession || !messageInput.trim()) return;
    const parts = messageInput.trim().split(/\s+/);
    if (parts.length < 2) {
      toast.error('Format: [phone] [message]');
      return;
    }
    const to = parts[0];
    const msg = parts.slice(1).join(' ');
    setSending(true);
    socket.emit('hdm:send_message_session', {
      sessionId: selectedSession,
      to,
      message: msg
    }, (response) => {
      if (response.success) {
        toast.success('Message sent!');
        setMessageInput('');
      } else {
        toast.error(`Failed: ${response.error}`);
      }
      setSending(false);
    });
  };

  const getStatusIcon = (data) => {
    if (data.connected) return <FiWifi className="text-green-500" size={18} />;
    if (data.hasQR) return <FiCamera className="text-yellow-500 animate-pulse" size={18} />;
    return <FiWifiOff className="text-red-500" size={18} />;
  };

  const getStatusText = (data) => {
    if (data.connected) return `Connected: ${data.phone}`;
    if (data.hasQR) return 'Waiting for QR scan';
    return 'Not connected';
  };

  const sessionCount = Object.keys(sessions).length;

  return (
    <div className={clsx('p-6 rounded-xl', darkMode ? 'bg-gray-800' : 'bg-white')}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={clsx('text-xl font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
            Multi-Device Manager
          </h2>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            Manage multiple WhatsApp sessions • {sessionCount} active session(s)
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className={clsx('p-2 rounded-lg', darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
          title="Refresh"
        >
          <FiRefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {/* Add new session */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newSessionId}
          onChange={(e) => setNewSessionId(e.target.value.toLowerCase())}
          placeholder="Session ID (e.g., bot1, user123)"
          className={clsx(
            'flex-1 px-4 py-2.5 rounded-lg border outline-none transition-colors',
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500' 
              : 'bg-white border-gray-300 text-gray-800 focus:border-primary-500'
          )}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSession()}
        />
        <button
          onClick={handleAddSession}
          disabled={loading[newSessionId]}
          className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <FiPlus size={18} />
          Add Session
        </button>
      </div>
      
      {/* Sessions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {sessionCount === 0 ? (
          <div className={clsx('col-span-2 text-center py-12 rounded-lg', darkMode ? 'bg-gray-700/50' : 'bg-gray-50')}>
            <FiFolder className="mx-auto mb-3 text-gray-400" size={48} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No active sessions</p>
            <p className="text-sm mt-1 text-gray-500">Add a session above to get started</p>
          </div>
        ) : (
          Object.entries(sessions).map(([sessionId, data]) => {
            const displayName = getDisplayName(sessionId);
            const isConnecting = actionLoading[sessionId];
            const hasQRCode = qrData[sessionId];
            const isShowingQR = showQR[sessionId];
            
            return (
              <div
                key={sessionId}
                className={clsx(
                  'rounded-lg border transition-all',
                  selectedSession === sessionId 
                    ? 'border-primary-500 ring-2 ring-primary-500/20' 
                    : darkMode ? 'border-gray-700' : 'border-gray-200',
                  darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                )}
              >
                {/* Session Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(data)}
                      <span className={clsx('font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
                        {displayName}
                      </span>
                      {data.connected && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
                          Online
                        </span>
                      )}
                      {data.hasQR && !data.connected && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full animate-pulse">
                          Awaiting QR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Delete Button */}
                      <button
                        onClick={() => handleRemoveSession(sessionId)}
                        disabled={isConnecting}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Session"
                      >
                        {isConnecting ? <FiLoader className="animate-spin" size={14} /> : <FiTrash2 size={14} />}
                      </button>
                    </div>
                  </div>
                  
                  <p className={clsx('text-xs', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                    {getStatusText(data)}
                  </p>
                </div>
                
                {/* Session Actions */}
                <div className="p-3 grid grid-cols-4 gap-2">
                  {/* Start/Stop Toggle */}
                  <button
                    onClick={() => handleToggleConnection(sessionId, data.connected)}
                    disabled={isConnecting}
                    className={clsx(
                      'py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors',
                      data.connected
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-500 hover:bg-green-500/30',
                      'disabled:opacity-50'
                    )}
                    title={data.connected ? 'Disconnect' : 'Connect'}
                  >
                    {isConnecting ? (
                      <FiLoader className="animate-spin" size={12} />
                    ) : (
                      <FiPower size={12} />
                    )}
                    <span>{data.connected ? 'Stop' : 'Start'}</span>
                  </button>
                  
                  {/* View QR Button */}
                  <button
                    onClick={() => handleViewQR(sessionId)}
                    disabled={!hasQRCode && !data.hasQR}
                    className="py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 disabled:opacity-50"
                    title={hasQRCode ? 'View QR Code' : 'No QR available'}
                  >
                    <FiEye size={12} />
                    <span>{isShowingQR ? 'Hide QR' : 'View QR'}</span>
                  </button>
                  
                  {/* Share QR Button */}
                  <button
                    onClick={() => handleShareQR(sessionId)}
                    disabled={!hasQRCode}
                    className="py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 disabled:opacity-50"
                    title="Share QR Code"
                  >
                    <FiShare2 size={12} />
                    <span>Share</span>
                  </button>
                  
                  {/* Select for Messaging */}
                  <button
                    onClick={() => setSelectedSession(sessionId)}
                    className={clsx(
                      'py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors',
                      selectedSession === sessionId
                        ? 'bg-primary-500 text-white'
                        : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    )}
                    title="Select to send message"
                  >
                    <FiMessageSquare size={12} />
                    <span>Message</span>
                  </button>
                </div>
                
                {/* QR Code Display */}
                {hasQRCode && isShowingQR && !data.connected && (
                  <div className="px-4 pb-4 flex justify-center">
                    <div className="p-2 bg-white rounded-lg">
                      <QRCode value={hasQRCode} size={120} level="L" />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Message sender for selected session */}
      {selectedSession && sessions[selectedSession]?.connected && (
        <div className={clsx(
          'rounded-lg border p-4',
          darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiMessageSquare className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={18} />
              <h3 className={clsx('font-medium', darkMode ? 'text-white' : 'text-gray-800')}>
                Send Message from: {getDisplayName(selectedSession)}
              </h3>
            </div>
            <button
              onClick={() => setSelectedSession(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="e.g., 254712345678 Hello world!"
              className={clsx(
                'flex-1 px-4 py-2 rounded-lg border outline-none transition-colors',
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-primary-500' 
                  : 'bg-white border-gray-300 text-gray-800 focus:border-primary-500'
              )}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <FiSend size={16} />
              Send
            </button>
          </div>
          <p className={clsx('text-xs mt-2', darkMode ? 'text-gray-500' : 'text-gray-400')}>
            Format: [phone_number] [message] (e.g., 254712345678 Hello)
          </p>
        </div>
      )}
    </div>
  );
};

export default DeviceManager;