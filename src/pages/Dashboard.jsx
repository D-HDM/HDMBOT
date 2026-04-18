import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { analyticsAPI, messageAPI, ruleAPI, commandAPI } from '../services/api';
import StatsCards from '../components/dashboard/StatsCards';
import ConnectionStatus from '../components/dashboard/ConnectionStatus';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';
import CommandsOverview from '../components/dashboard/CommandsOverview';
import { FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Dashboard = () => {
  const { darkMode } = useTheme();
  const { socket, whatsappReady } = useSocket();
  const { getUserName } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const adminName = getUserName();
  
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeChats: 0,
    activeRules: 0,
    responseRate: 98,
    incomingToday: 0,
    outgoingToday: 0,
  });
  
  const [commandsStats, setCommandsStats] = useState({
    totalCommands: 32,
    activeCommands: 32,
    totalTriggered: 0,
    customCommands: 0,
    builtInCommands: 32,
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [connectedDevicesCount, setConnectedDevicesCount] = useState(0);

  // Fetch commands data
  const fetchCommandsData = useCallback(async () => {
    try {
      const commandsRes = await commandAPI.getAll();
      
      let commands = [];
      if (commandsRes.data?.data) {
        commands = commandsRes.data.data;
      } else if (commandsRes.data) {
        commands = commandsRes.data;
      } else if (Array.isArray(commandsRes)) {
        commands = commandsRes;
      }
      
      if (commands.length > 0) {
        const activeCommands = commands.filter(c => c.enabled !== false).length;
        const totalTriggered = commands.reduce((sum, c) => sum + (c.timesUsed || 0), 0);
        const customCommands = commands.filter(c => !c.isBuiltIn).length;
        const builtInCommands = commands.filter(c => c.isBuiltIn).length;
        
        setCommandsStats({
          totalCommands: commands.length,
          activeCommands,
          totalTriggered,
          customCommands,
          builtInCommands,
        });
      }
    } catch (err) {
      console.error('Failed to fetch commands:', err);
    }
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      await fetchCommandsData();
      
      const [statsRes, messagesRes, rulesRes] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => ({ data: { stats: {} } })),
        messageAPI.getAll(1, 10).catch(() => ({ data: { data: [] } })),
        ruleAPI.getAll().catch(() => ({ data: { data: [] } })),
      ]);
      
      const dashStats = statsRes.data?.stats || {};
      const messages = messagesRes.data?.data || [];
      
      const uniqueChats = new Set();
      messages.forEach(msg => {
        const chatId = msg.direction === 'incoming' ? msg.from : msg.to;
        if (chatId) uniqueChats.add(chatId);
      });
      
      const today = new Date().toDateString();
      const todayMessages = messages.filter(msg => 
        new Date(msg.timestamp).toDateString() === today
      );
      const incomingToday = todayMessages.filter(m => m.direction === 'incoming').length;
      const outgoingToday = todayMessages.filter(m => m.direction === 'outgoing').length;
      
      setStats({
        totalMessages: dashStats.totalMessages || messages.length || 0,
        activeChats: uniqueChats.size || 0,
        activeRules: rulesRes.data?.data?.filter(r => r.enabled).length || 0,
        responseRate: dashStats.responseRate || 98,
        incomingToday: dashStats.incoming || incomingToday || 0,
        outgoingToday: dashStats.outgoing || outgoingToday || 0,
      });
      
      setRecentActivity(messages.slice(0, 10));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchCommandsData]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      setRecentActivity(prev => [msg, ...prev].slice(0, 10));
      setStats(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        incomingToday: msg.direction === 'incoming' ? prev.incomingToday + 1 : prev.incomingToday,
        outgoingToday: msg.direction === 'outgoing' ? prev.outgoingToday + 1 : prev.outgoingToday,
      }));
    };
    
    const handleMessageSent = () => {
      setStats(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        outgoingToday: prev.outgoingToday + 1,
      }));
    };
    
    const handleCommandsReloaded = () => {
      fetchCommandsData();
    };
    
    const handleCommandUsed = () => {
      setCommandsStats(prev => ({
        ...prev,
        totalTriggered: prev.totalTriggered + 1,
      }));
    };
    
    const handleSessionsStatus = (status) => {
      if (status) {
        const sessionArray = Object.values(status);
        const connected = sessionArray.filter(s => s.connected === true).length;
        setConnectedDevicesCount(connected);
      }
    };
    
    socket.on('hdm:new_message', handleNewMessage);
    socket.on('hdm:message_sent', handleMessageSent);
    socket.on('hdm:commands_reloaded', handleCommandsReloaded);
    socket.on('hdm:command_used', handleCommandUsed);
    socket.on('hdm:sessions_status', handleSessionsStatus);
    
    // Get initial sessions status
    socket.emit('hdm:get_sessions_status', (status) => {
      if (status) {
        const sessionArray = Object.values(status);
        const connected = sessionArray.filter(s => s.connected === true).length;
        setConnectedDevicesCount(connected);
      }
    });
    
    return () => {
      socket.off('hdm:new_message', handleNewMessage);
      socket.off('hdm:message_sent', handleMessageSent);
      socket.off('hdm:commands_reloaded', handleCommandsReloaded);
      socket.off('hdm:command_used', handleCommandUsed);
      socket.off('hdm:sessions_status', handleSessionsStatus);
    };
  }, [socket, fetchCommandsData]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={clsx('text-2xl md:text-3xl font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
            Dashboard
          </h1>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            {getGreeting()}, <span className="font-medium text-primary-500">{adminName}</span>! Here's what's happening with your bot.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* WhatsApp Status with Device Count */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className={clsx(
                'w-2 h-2 rounded-full',
                whatsappReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
              <span className={clsx('text-xs font-medium', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                {whatsappReady ? 'WhatsApp Online' : 'WhatsApp Offline'}
              </span>
            </div>
            
            {/* Device Count Badge */}
            {connectedDevicesCount > 0 && (
              <span className={clsx(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
              )}>
                {connectedDevicesCount} Device{connectedDevicesCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
              darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            )}
          >
            <FiRefreshCw className={clsx(refreshing && 'animate-spin')} size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} commandsStats={commandsStats} loading={loading} />

      {/* Connection Status & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConnectionStatus />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Commands Overview */}
      <CommandsOverview stats={commandsStats} loading={loading} />

      {/* Recent Activity */}
      <RecentActivity activities={recentActivity} loading={loading} />
    </div>
  );
};

export default Dashboard;