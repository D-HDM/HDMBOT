import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { analyticsAPI, messageAPI, ruleAPI } from '../services/api';
import StatsCards from '../components/dashboard/StatsCards';
import ConnectionStatus from '../components/dashboard/ConnectionStatus';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';
import { FiRefreshCw, FiTrendingUp, FiUsers, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Dashboard = () => {
  const { darkMode } = useTheme();
  const { socket, whatsappReady } = useSocket();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeChats: 0,
    activeRules: 0,
    responseRate: 98,
    incomingToday: 0,
    outgoingToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, messagesRes, rulesRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        messageAPI.getAll(1, 10),
        ruleAPI.getAll(),
      ]);
      
      const dashStats = statsRes.data?.stats || {};
      const messages = messagesRes.data?.data || [];
      
      // Calculate active chats (unique conversations)
      const uniqueChats = new Set();
      messages.forEach(msg => {
        const chatId = msg.direction === 'incoming' ? msg.from : msg.to;
        if (chatId) uniqueChats.add(chatId);
      });
      
      setStats({
        totalMessages: dashStats.totalMessages || 0,
        activeChats: uniqueChats.size || 0,
        activeRules: rulesRes.data?.data?.filter(r => r.enabled).length || 0,
        responseRate: 98,
        incomingToday: dashStats.incoming || 0,
        outgoingToday: dashStats.outgoing || 0,
      });
      
      setRecentActivity(messages);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for new messages via socket
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
    
    socket.on('hdm:new_message', handleNewMessage);
    return () => socket.off('hdm:new_message', handleNewMessage);
  }, [socket]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={clsx('text-2xl md:text-3xl font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
            Dashboard
          </h1>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            Welcome back! Here's what's happening with your bot.
          </p>
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

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Connection Status & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConnectionStatus />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={recentActivity} loading={loading} />
    </div>
  );
};

export default Dashboard;