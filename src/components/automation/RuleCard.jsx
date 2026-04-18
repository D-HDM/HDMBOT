import React from 'react';
import { FiToggleLeft, FiToggleRight, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

const RuleCard = ({ rule, onToggle, onEdit, onDelete }) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={clsx(
        'p-4 rounded-xl border transition-all',
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        !rule.enabled && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={clsx('font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>{rule.name}</h4>
            <span
              className={clsx(
                'text-xs px-2 py-0.5 rounded-full',
                rule.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              )}
            >
              {rule.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            Trigger: <span className="font-mono">{rule.trigger?.value || 'N/A'}</span>
          </p>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-300' : 'text-gray-600')}>
            Response: {rule.response?.substring(0, 40)}...
          </p>
          <p className={clsx('text-xs mt-2', darkMode ? 'text-gray-500' : 'text-gray-400')}>
            Triggered {rule.timesTriggered || 0} times
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onToggle(rule)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {rule.enabled ? (
              <FiToggleRight className="text-green-500" size={20} />
            ) : (
              <FiToggleLeft className="text-gray-400" size={20} />
            )}
          </button>
          <button
            onClick={() => onEdit(rule)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(rule)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleCard;