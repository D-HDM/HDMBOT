import React from 'react';
import { FiMessageCircle, FiUser, FiClock } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTime, truncate } from '../../utils/helpers';
import clsx from 'clsx';

const RecentActivity = ({ activities = [] }) => {
  const { darkMode } = useTheme();

  return (
    <div className={clsx('rounded-xl shadow-sm border', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
      <div className={clsx('p-4 border-b', darkMode ? 'border-gray-700' : 'border-gray-200')}>
        <h3 className={clsx('font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <FiMessageCircle className="mx-auto text-gray-400 dark:text-gray-600 mb-2" size={32} />
            <p className={clsx('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>No recent activity</p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <div key={index} className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <FiUser className="text-primary-600 dark:text-primary-400" size={18} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={clsx('text-sm font-medium', darkMode ? 'text-white' : 'text-gray-800')}>
                    {activity.from || 'Unknown'}
                  </p>
                  <span className={clsx('text-xs flex items-center gap-1', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                    <FiClock size={10} />
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <p className={clsx('text-sm mt-0.5', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                  {truncate(activity.body, 40)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;