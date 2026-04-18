import React from 'react';
import { FiMessageSquare, FiUsers, FiZap, FiTrendingUp, FiTerminal } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

const StatsCards = ({ stats, commandsStats }) => {
  const { darkMode } = useTheme();

  const cards = [
    {
      title: 'Total Messages',
      value: stats?.totalMessages?.toLocaleString() || '0',
      icon: FiMessageSquare,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'Active Chats',
      value: stats?.activeChats?.toLocaleString() || '0',
      icon: FiUsers,
      color: 'green',
      change: '+5%',
    },
    {
      title: 'Auto-reply Rules',
      value: stats?.activeRules?.toLocaleString() || '0',
      icon: FiZap,
      color: 'purple',
      change: 'Active',
    },
    {
      title: 'Response Rate',
      value: `${stats?.responseRate || 98}%`,
      icon: FiTrendingUp,
      color: 'orange',
      change: '+2%',
    },
    {
      title: 'Total Commands',
      value: commandsStats?.totalCommands?.toLocaleString() || '32',
      icon: FiTerminal,
      color: 'cyan',
      change: `${commandsStats?.activeCommands || 32} active`,
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'text-orange-600 dark:text-orange-400',
      badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      icon: 'text-cyan-600 dark:text-cyan-400',
      badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    },
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const colors = colorClasses[card.color];
        
        return (
          <div
            key={card.title}
            className={clsx(
              'p-3 rounded-xl border transition-all hover:shadow-md',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <p className={clsx(
                'text-[10px] font-medium uppercase tracking-wider',
                darkMode ? 'text-gray-400' : 'text-gray-500'
              )}>
                {card.title}
              </p>
              <div className={clsx('p-1.5 rounded-lg', colors.bg)}>
                <Icon className={colors.icon} size={14} />
              </div>
            </div>
            
            <p className={clsx(
              'text-xl font-bold',
              darkMode ? 'text-white' : 'text-gray-800'
            )}>
              {card.value}
            </p>
            
            <div className="flex items-center gap-1 mt-1">
              <span className={clsx(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                colors.badge
              )}>
                {card.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;