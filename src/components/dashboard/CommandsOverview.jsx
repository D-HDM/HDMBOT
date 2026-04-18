import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FiTerminal, 
  FiCheckCircle, 
  FiZap, 
  FiCode, 
  FiBox,
  FiActivity,
  FiTrendingUp,
  FiAlertCircle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const CommandsOverview = ({ stats, loading }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const {
    totalCommands = 32,  // Default to 32 built-in commands
    activeCommands = 32,
    totalTriggered = 0,
    customCommands = 0,
    builtInCommands = 32,
  } = stats || {};

  const commandCards = [
    {
      title: 'Total Commands',
      value: totalCommands,
      icon: FiTerminal,
      color: 'blue',
      description: 'All available commands',
    },
    {
      title: 'Active Commands',
      value: activeCommands,
      icon: FiCheckCircle,
      color: 'green',
      description: 'Currently enabled',
    },
    {
      title: 'Times Triggered',
      value: totalTriggered.toLocaleString(),
      icon: FiZap,
      color: 'yellow',
      description: 'Total command usage',
    },
    {
      title: 'Custom Commands',
      value: customCommands,
      icon: FiCode,
      color: 'purple',
      description: 'User-created',
    },
    {
      title: 'Built-in Commands',
      value: builtInCommands,
      icon: FiBox,
      color: 'indigo',
      description: 'System commands',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      value: 'text-blue-700 dark:text-blue-300',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      value: 'text-green-700 dark:text-green-300',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      value: 'text-yellow-700 dark:text-yellow-300',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-700 dark:text-purple-300',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'text-indigo-600 dark:text-indigo-400',
      value: 'text-indigo-700 dark:text-indigo-300',
    },
  };

  const handleNavigateToCommands = () => {
    navigate('/automation');
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className={clsx(
        'rounded-xl border p-6',
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-40 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no commands
  if (totalCommands === 0 && !loading) {
    return (
      <div className={clsx(
        'rounded-xl border p-6',
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            )}>
              <FiTerminal className="text-gray-400" size={20} />
            </div>
            <div>
              <h3 className={clsx('font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
                Commands Overview
              </h3>
              <p className={clsx('text-xs', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                No commands loaded yet
              </p>
            </div>
          </div>
          <button
            onClick={handleNavigateToCommands}
            className={clsx(
              'text-sm font-medium flex items-center gap-1',
              darkMode ? 'text-primary-400' : 'text-primary-600'
            )}
          >
            Add Commands
            <FiTrendingUp size={14} />
          </button>
        </div>
        <div className="text-center py-8">
          <FiAlertCircle className={clsx('mx-auto text-3xl mb-2', darkMode ? 'text-gray-600' : 'text-gray-400')} />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            No commands found. Add custom commands or reload the handler.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    )}>
      {/* Header */}
      <div className={clsx(
        'px-5 py-4 border-b flex items-center justify-between',
        darkMode ? 'border-gray-700' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            darkMode ? 'bg-primary-900/30' : 'bg-primary-50'
          )}>
            <FiTerminal className="text-primary-500" size={20} />
          </div>
          <div>
            <h3 className={clsx('font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
              Commands Overview
            </h3>
            <p className={clsx('text-xs', darkMode ? 'text-gray-400' : 'text-gray-500')}>
              Command usage and statistics
            </p>
          </div>
        </div>
        <button
          onClick={handleNavigateToCommands}
          className={clsx(
            'text-sm font-medium flex items-center gap-1 transition-colors',
            darkMode
              ? 'text-primary-400 hover:text-primary-300'
              : 'text-primary-600 hover:text-primary-700'
          )}
        >
          <span>Manage Commands</span>
          <FiTrendingUp size={14} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {commandCards.map((card, index) => {
            const Icon = card.icon;
            const colors = colorClasses[card.color];
            
            return (
              <div
                key={index}
                className={clsx(
                  'rounded-lg p-3 transition-all',
                  darkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    colors.bg
                  )}>
                    <Icon className={colors.icon} size={16} />
                  </div>
                  <span className={clsx(
                    'text-xl font-bold',
                    colors.value
                  )}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </span>
                </div>
                <p className={clsx(
                  'text-xs font-medium mb-0.5',
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {card.title}
                </p>
                <p className={clsx(
                  'text-[10px]',
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiActivity className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={12} />
              <span className={clsx('text-xs font-medium', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                Command Activation Rate
              </span>
            </div>
            <span className={clsx('text-xs font-semibold', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              {activeCommands}/{totalCommands} active
            </span>
          </div>
          <div className={clsx(
            'w-full h-2 rounded-full overflow-hidden',
            darkMode ? 'bg-gray-700' : 'bg-gray-200'
          )}>
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
              style={{ 
                width: totalCommands > 0 
                  ? `${Math.round((activeCommands / totalCommands) * 100)}%` 
                  : '0%' 
              }}
            />
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className={clsx(
            'rounded-lg p-3',
            darkMode ? 'bg-gray-900/30' : 'bg-gray-50'
          )}>
            <p className={clsx('text-[10px] uppercase tracking-wider mb-1', darkMode ? 'text-gray-500' : 'text-gray-400')}>
              Avg Usage per Command
            </p>
            <p className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
              {activeCommands > 0 
                ? Math.round(totalTriggered / activeCommands).toLocaleString() 
                : '0'}
            </p>
          </div>
          <div className={clsx(
            'rounded-lg p-3',
            darkMode ? 'bg-gray-900/30' : 'bg-gray-50'
          )}>
            <p className={clsx('text-[10px] uppercase tracking-wider mb-1', darkMode ? 'text-gray-500' : 'text-gray-400')}>
              Custom Ratio
            </p>
            <p className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
              {totalCommands > 0 
                ? `${Math.round((customCommands / totalCommands) * 100)}%` 
                : '0%'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandsOverview;