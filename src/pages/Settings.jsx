import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FiShield, FiDatabase, FiLogOut, FiRefreshCw, FiTrash2, 
  FiDownload, FiUpload, FiCheckCircle, FiAlertCircle, FiSmartphone,
  FiServer, FiActivity, FiClock, FiInfo, FiSettings, FiZap, FiCpu,
  FiMessageSquare, FiCommand, FiTerminal, FiFileText
} from 'react-icons/fi';
import { whatsappAPI, ruleAPI, commandAPI, settingsAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import clsx from 'clsx';

const Settings = () => {
  const { whatsappReady, phoneNumber, isConnected } = useSocket();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({});
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [backupRestore, setBackupRestore] = useState({ exporting: false, importing: false });
  
  const fileInputRef = useRef(null);

  useEffect(() => { 
    fetchSystemInfo(); 
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const [healthRes, rulesRes, settingsRes, commandsRes] = await Promise.all([
        fetch('/health').then(res => res.json()).catch(() => ({})),
        ruleAPI.getAll().catch(() => ({ data: { data: [] } })),
        settingsAPI.getAll().catch(() => ({ data: { data: {} } })),
        commandAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);
      
      setSystemInfo({
        status: healthRes.status || 'unknown',
        bot: healthRes.bot || 'HDM',
        timestamp: healthRes.timestamp,
        rulesCount: rulesRes.data?.data?.length || 0,
        commandsCount: commandsRes.data?.data?.length || 0,
        nodeVersion: 'v18+',
        uptime: healthRes.uptime || 0,
      });
    } catch (err) {
      console.error('Failed to fetch system info:', err);
      setSystemInfo({
        status: 'unknown',
        bot: 'HDM',
        rulesCount: 0,
        commandsCount: 0,
        uptime: 0,
      });
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    try {
      const res = await whatsappAPI.reconnect();
      if (res.data.success) {
        toast.success('Reconnection initiated');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(res.data.error || 'Failed to reconnect');
      }
    } catch (err) {
      toast.error('Reconnect failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await whatsappAPI.disconnect();
      if (res.data.success) {
        toast.success('Logged out successfully');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(res.data.error || 'Failed to logout');
      }
    } catch (err) {
      toast.error('Logout failed: ' + err.message);
    } finally {
      setLoading(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleClearAllRules = async () => {
    setLoading(true);
    try {
      const rulesRes = await ruleAPI.getAll();
      if (rulesRes.data.success) {
        for (const rule of rulesRes.data.data) {
          await ruleAPI.delete(rule._id);
        }
      }
      toast.success('All rules cleared successfully');
      fetchSystemInfo();
    } catch (err) {
      toast.error('Failed to clear data: ' + err.message);
    } finally {
      setLoading(false);
      setShowClearDataConfirm(false);
    }
  };

  // ============================================
  // FULL BACKUP EXPORT (Rules + Commands + Settings)
  // ============================================
  const handleExportBackup = async () => {
    setBackupRestore(prev => ({ ...prev, exporting: true }));
    try {
      // Fetch all data in parallel
      const [rulesRes, commandsRes, settingsRes] = await Promise.all([
        ruleAPI.getAll(),
        commandAPI.getAll(),
        settingsAPI.getAll()
      ]);
      
      const backupData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        bot: 'HDM',
        counts: {
          rules: rulesRes.data?.data?.length || 0,
          commands: commandsRes.data?.data?.length || 0
        },
        rules: rulesRes.data?.data || [],
        commands: commandsRes.data?.data || [],
        settings: settingsRes.data?.data || {}
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hdm-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`✅ Backup exported: ${backupData.counts.rules} rules, ${backupData.counts.commands} commands`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export backup: ' + err.message);
    } finally {
      setBackupRestore(prev => ({ ...prev, exporting: false }));
    }
  };

  // ============================================
  // BACKUP IMPORT (Restore rules, commands, and optionally settings)
  // ============================================
  const handleImportBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Ask user what to restore
    const shouldImportRules = window.confirm('Import rules from backup?');
    const shouldImportCommands = window.confirm('Import commands from backup?');
    
    if (!shouldImportRules && !shouldImportCommands) {
      toast('Nothing selected to import', { icon: 'ℹ️' });
      event.target.value = '';
      return;
    }

    setBackupRestore(prev => ({ ...prev, importing: true }));
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        let rulesImported = 0;
        let commandsImported = 0;
        
        // Import rules
        if (shouldImportRules && backupData.rules && backupData.rules.length > 0) {
          for (const rule of backupData.rules) {
            const { _id, createdAt, updatedAt, timesTriggered, __v, ...ruleData } = rule;
            try {
              await ruleAPI.create(ruleData);
              rulesImported++;
            } catch (err) {
              console.warn('Rule import failed:', rule.name);
            }
          }
        }
        
        // Import commands
        if (shouldImportCommands && backupData.commands && backupData.commands.length > 0) {
          for (const cmd of backupData.commands) {
            const { _id, createdAt, updatedAt, timesUsed, __v, ...cmdData } = cmd;
            try {
              await commandAPI.create(cmdData);
              commandsImported++;
            } catch (err) {
              console.warn('Command import failed:', cmd.name);
            }
          }
        }
        
        let successMsg = '';
        if (rulesImported > 0) successMsg += `${rulesImported} rules`;
        if (commandsImported > 0) {
          if (successMsg) successMsg += ', ';
          successMsg += `${commandsImported} commands`;
        }
        
        if (successMsg) {
          toast.success(`✅ Imported ${successMsg}`);
          fetchSystemInfo();
          // Notify handler to reload
          const { socket } = require('../contexts/SocketContext').useSocket();
          if (socket) {
            if (rulesImported > 0) socket.emit('hdm:reload_rules');
            if (commandsImported > 0) socket.emit('hdm:reload_commands');
          }
        } else {
          toast.error('No items were imported');
        }
      } catch (err) {
        toast.error('Failed to import backup: Invalid JSON format');
      } finally {
        setBackupRestore(prev => ({ ...prev, importing: false }));
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const InfoRow = ({ label, value, icon: Icon, status }) => (
    <div className={clsx(
      'flex items-center justify-between py-3 px-2 rounded-lg transition-colors',
      darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
    )}>
      <div className="flex items-center gap-3">
        <div className={clsx('p-1.5 rounded-lg', darkMode ? 'bg-gray-700' : 'bg-gray-100')}>
          <Icon className={clsx(
            'text-base',
            status === 'success' ? 'text-green-500' : 
            status === 'error' ? 'text-red-500' : 
            'text-gray-500 dark:text-gray-400'
          )} />
        </div>
        <span className={clsx('text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-600')}>
          {label}
        </span>
      </div>
      <span className={clsx(
        'text-sm font-medium',
        status === 'success' ? 'text-green-600 dark:text-green-400' :
        status === 'error' ? 'text-red-600 dark:text-red-400' :
        'text-gray-700 dark:text-gray-300'
      )}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={clsx('text-2xl md:text-3xl font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
            Settings
          </h1>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            Manage your HDM WhatsApp Bot configuration
          </p>
        </div>
        <button
          onClick={fetchSystemInfo}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
            darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Connection Actions */}
      <div className={clsx('rounded-xl shadow-sm border p-5', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
        <div className="flex items-center gap-2 mb-4">
          <div className={clsx('p-2 rounded-lg', darkMode ? 'bg-primary-900/30' : 'bg-primary-50')}>
            <FiShield className="text-primary-500" size={18} />
          </div>
          <h3 className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
            Connection Management
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={handleReconnect} disabled={loading} className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50',
            darkMode ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
          )}>
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
            Reconnect
          </button>
          
          <button onClick={() => setShowLogoutConfirm(true)} disabled={loading} className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50',
            darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          )}>
            <FiLogOut size={16} />
            Logout
          </button>
          
          <button onClick={() => setShowClearDataConfirm(true)} disabled={loading} className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50',
            darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
          )}>
            <FiTrash2 size={16} />
            Clear All Rules
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className={clsx('rounded-xl shadow-sm border p-5', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
        <div className="flex items-center gap-2 mb-4">
          <div className={clsx('p-2 rounded-lg', darkMode ? 'bg-green-900/30' : 'bg-green-50')}>
            <FiDatabase className="text-green-500" size={18} />
          </div>
          <h3 className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
            Backup & Restore
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportBackup} disabled={backupRestore.exporting} className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50',
            darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
          )}>
            <FiDownload size={16} />
            {backupRestore.exporting ? 'Exporting...' : 'Export Full Backup'}
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} disabled={backupRestore.importing} className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50',
            darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
          )}>
            <FiUpload size={16} />
            {backupRestore.importing ? 'Importing...' : 'Import Backup'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".json" 
            onChange={handleImportBackup} 
            className="hidden" 
          />
        </div>
        <p className={clsx('text-xs mt-3', darkMode ? 'text-gray-500' : 'text-gray-400')}>
          Full backup includes all rules, commands, and settings. You can choose what to restore when importing.
        </p>
      </div>

      {/* System Information */}
      <div className={clsx('rounded-xl shadow-sm border overflow-hidden', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
        <div className={clsx('p-4 border-b', darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50')}>
          <div className="flex items-center gap-2">
            <FiServer className="text-primary-500" size={18} />
            <h3 className={clsx('font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>System Information</h3>
          </div>
        </div>
        
        <div className="p-2">
          <InfoRow label="WhatsApp Status" value={whatsappReady ? 'Connected' : 'Disconnected'} icon={whatsappReady ? FiCheckCircle : FiAlertCircle} status={whatsappReady ? 'success' : 'error'} />
          <InfoRow label="Phone Number" value={whatsappReady ? phoneNumber?.split(':')[0] || 'Connected' : 'Not connected'} icon={FiSmartphone} status={whatsappReady ? 'success' : 'warning'} />
          <InfoRow label="Server Connection" value={isConnected ? 'Connected' : 'Disconnected'} icon={FiActivity} status={isConnected ? 'success' : 'error'} />
          <InfoRow label="Auto-Reply Rules" value={systemInfo.rulesCount || 0} icon={FiFileText} />
          <InfoRow label="Commands" value={systemInfo.commandsCount || 0} icon={FiTerminal} />
          <InfoRow label="System Uptime" value={formatUptime(systemInfo.uptime || 0)} icon={FiClock} />
        </div>
      </div>

      {/* About Section */}
      <div className={clsx('rounded-xl shadow-sm border p-5', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
        <div className="flex items-center gap-2 mb-4">
          <div className={clsx('p-2 rounded-lg', darkMode ? 'bg-purple-900/30' : 'bg-purple-50')}>
            <FiInfo className="text-purple-500" size={18} />
          </div>
          <h3 className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>About HDM</h3>
        </div>
        <div className={clsx('space-y-2 text-sm', darkMode ? 'text-gray-300' : 'text-gray-600')}>
          <p><strong>Version:</strong> 2.0.0</p>
          <p><strong>Framework:</strong> React + Express + WhatsApp Web.js</p>
          <p><strong>License:</strong> Pro Edition</p>
          <p><strong>Repository:</strong> github.com/Davismcintyre5/HDM-BOT</p>
        </div>
        <div className={clsx('mt-6 p-4 rounded-lg text-center', darkMode ? 'bg-gray-700/50' : 'bg-gray-50')}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <FiCpu className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={14} />
            <p className={clsx('text-xs', darkMode ? 'text-gray-400' : 'text-gray-500')}>
              © 2026 HDM Pro Edition. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} title="Logout from WhatsApp?" message="Are you sure you want to logout? You will need to scan QR code again to reconnect." confirmText="Logout" cancelText="Cancel" />
      <ConfirmDialog isOpen={showClearDataConfirm} onClose={() => setShowClearDataConfirm(false)} onConfirm={handleClearAllRules} title="Clear All Rules?" message="This will delete all your auto-reply rules. This action cannot be undone." confirmText="Clear All" cancelText="Cancel" />
    </div>
  );
};

export default Settings;