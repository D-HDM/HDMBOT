import React, { useState } from 'react';
import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import RuleCard from './RuleCard';
import clsx from 'clsx';

const RulesList = ({ rules = [], onAdd, onEdit, onDelete, onToggle }) => {
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState(null); // null = all, true = enabled, false = disabled

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rule.trigger?.value?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEnabled === null || rule.enabled === filterEnabled;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={clsx(
              'w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none',
              darkMode
                ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border border-gray-200 text-gray-800 placeholder-gray-500'
            )}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFilterEnabled(null)}
              className={clsx(
                'px-3 py-2 text-sm font-medium transition-colors',
                filterEnabled === null
                  ? 'bg-primary-500 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilterEnabled(true)}
              className={clsx(
                'px-3 py-2 text-sm font-medium transition-colors border-l border-r border-gray-200 dark:border-gray-700',
                filterEnabled === true
                  ? 'bg-primary-500 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              Active
            </button>
            <button
              onClick={() => setFilterEnabled(false)}
              className={clsx(
                'px-3 py-2 text-sm font-medium transition-colors',
                filterEnabled === false
                  ? 'bg-primary-500 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              Disabled
            </button>
          </div>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <FiPlus size={16} />
            New Rule
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      {filteredRules.length === 0 ? (
        <div className={clsx(
          'text-center py-12 rounded-xl border',
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            {searchTerm ? 'No rules match your search' : 'No rules created yet'}
          </p>
          <button
            onClick={onAdd}
            className="mt-3 text-primary-500 hover:text-primary-600 font-medium text-sm"
          >
            Create your first rule
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredRules.map(rule => (
            <RuleCard
              key={rule._id}
              rule={rule}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RulesList;