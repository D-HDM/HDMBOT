import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { analyticsAPI } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { FiBarChart2, FiTrendingUp, FiMessageSquare, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const COLORS = ['#667eea', '#48bb78', '#ed8936', '#f56565', '#9f7aea', '#38b2ac'];

const Analytics = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState(7); // days
  const [stats, setStats] = useState({
    totalMessages: 0,
    incoming: 0,
    outgoing: 0,
    activeRules: 0,
    commandsUsed: 0,
    responseRate: 0,
    avgResponseTime: 0,
  });
  const [dailyData, setDailyData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const [dashboardRes, messagesRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getMessages(dateRange),
      ]);
      
      const dashStats = dashboardRes.data?.stats || {};
      const daily = messagesRes.data?.data || [];
      
      // Process daily data
      const processedDaily = [];
      const today = new Date();
      for (let i = dateRange - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = daily.find(d => d._id?.date === dateStr) || { incoming: 0, outgoing: 0 };
        processedDaily.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          incoming: dayData.incoming || 0,
          outgoing: dayData.outgoing || 0,
          total: (dayData.incoming || 0) + (dayData.outgoing || 0),
        });
      }
      
      setDailyData(processedDaily);
      
      // Calculate response rate
      const totalIncoming = dashStats.incoming || 0;
      const totalOutgoing = dashStats.outgoing || 0;
      const responseRate = totalIncoming > 0 ? Math.round((totalOutgoing / totalIncoming) * 100) : 0;
      
      setStats({
        totalMessages: dashStats.totalMessages || 0,
        incoming: totalIncoming,
        outgoing: totalOutgoing,
        activeRules: dashStats.activeRules || 0,
        commandsUsed: dashStats.totalCommands || 0,
        responseRate: Math.min(responseRate, 100),
        avgResponseTime: dashStats.avgResponseTime || 2.3,
      });
      
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      toast.error('Could not load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const pieData = [
    { name: 'Incoming', value: stats.incoming, color: '#48bb78' },
    { name: 'Outgoing', value: stats.outgoing, color: '#667eea' },
  ].filter(d => d.value > 0);

  const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
    <div className={clsx(
      'p-4 rounded-xl border',
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className={clsx('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>{title}</p>
          <p className={clsx('text-2xl font-bold mt-1', darkMode ? 'text-white' : 'text-gray-800')}>
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div className={clsx('p-2 rounded-lg', `bg-${color}-100 dark:bg-${color}-900/30`)}>
          <Icon className={`text-${color}-500`} size={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={clsx('text-2xl md:text-3xl font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
            Analytics
          </h1>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            Insights and performance metrics for your bot
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm border outline-none',
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'
            )}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
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

      {loading ? (
        <div className="text-center py-12">
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Messages" value={stats.totalMessages} icon={FiMessageSquare} color="blue" />
            <StatCard title="Incoming" value={stats.incoming} icon={FiTrendingUp} color="green" />
            <StatCard title="Outgoing" value={stats.outgoing} icon={FiTrendingUp} color="purple" />
            <StatCard title="Response Rate" value={stats.responseRate} icon={FiBarChart2} color="orange" suffix="%" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Area Chart */}
            <div className={clsx(
              'p-4 rounded-xl border',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}>
              <h3 className={clsx('text-lg font-semibold mb-4 flex items-center gap-2', darkMode ? 'text-white' : 'text-gray-800')}>
                <FiCalendar size={18} />
                Daily Message Volume
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1f2937' : '#fff', 
                      border: 'none', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Area type="monotone" dataKey="incoming" stackId="1" stroke="#48bb78" fill="#48bb78" fillOpacity={0.3} name="Incoming" />
                  <Area type="monotone" dataKey="outgoing" stackId="1" stroke="#667eea" fill="#667eea" fillOpacity={0.3} name="Outgoing" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Message Distribution Pie Chart */}
            <div className={clsx(
              'p-4 rounded-xl border',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}>
              <h3 className={clsx('text-lg font-semibold mb-4', darkMode ? 'text-white' : 'text-gray-800')}>
                Message Distribution
              </h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#fff', 
                        border: 'none', 
                        borderRadius: '8px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px]">
                  <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={clsx(
              'p-4 rounded-xl border text-center',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}>
              <p className={clsx('text-3xl font-bold text-primary-500', darkMode ? 'text-primary-400' : 'text-primary-600')}>
                {stats.activeRules}
              </p>
              <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>Active Rules</p>
            </div>
            <div className={clsx(
              'p-4 rounded-xl border text-center',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}>
              <p className={clsx('text-3xl font-bold text-green-500')}>
                {stats.commandsUsed}
              </p>
              <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>Commands Used</p>
            </div>
            <div className={clsx(
              'p-4 rounded-xl border text-center',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}>
              <p className={clsx('text-3xl font-bold text-purple-500')}>
                {stats.responseRate}%
              </p>
              <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>Response Rate</p>
            </div>
            <div className={clsx(
              'p-4 rounded-xl border text-center',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}>
              <p className={clsx('text-3xl font-bold text-orange-500')}>
                {stats.avgResponseTime}s
              </p>
              <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>Avg Response</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;