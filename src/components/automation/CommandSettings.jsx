import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiX, FiCode, FiTerminal } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

const CommandSettings = ({ commands = [], onAdd, onEdit, onDelete, onToggle }) => {
  const { darkMode } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingCommand, setEditingCommand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    response: '',
    aliases: '',
    category: 'general',
    adminOnly: false,
    enabled: true,
  });

  const categories = [
    { value: 'general', label: 'General', icon: '📋' },
    { value: 'ai', label: 'AI Commands', icon: '🤖' },
    { value: 'bug', label: 'Bug Menu', icon: '🐛' },
    { value: 'settings', label: 'Bot Settings', icon: '⚙️' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      response: '',
      aliases: '',
      category: 'general',
      adminOnly: false,
      enabled: true,
    });
    setEditingCommand(null);
    setShowForm(false);
  };

  const handleEdit = (cmd) => {
    setEditingCommand(cmd);
    setFormData({
      name: cmd.name || '',
      description: cmd.description || '',
      response: cmd.response || '',
      aliases: cmd.aliases?.join(', ') || '',
      category: cmd.category || 'general',
      adminOnly: cmd.adminOnly || false,
      enabled: cmd.enabled !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      aliases: formData.aliases ? formData.aliases.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    if (editingCommand) {
      onEdit(editingCommand._id, payload);
    } else {
      onAdd(payload);
    }
    resetForm();
  };

  const inputClass = clsx(
    'w-full px-3 py-2 rounded-lg border outline-none transition-colors text-sm',
    darkMode
      ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-primary-500'
      : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-primary-500'
  );

  // Group commands by category
  const groupedCommands = commands.reduce((acc, cmd) => {
    const cat = cmd.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
          <FiTerminal className="inline mr-2" size={20} />
          Custom Commands
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"
        >
          <FiPlus size={14} />
          Add Command
        </button>
      </div>

      {/* Command Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={clsx(
            'w-full max-w-md rounded-xl shadow-xl max-h-[90vh] overflow-y-auto',
            darkMode ? 'bg-gray-900' : 'bg-white'
          )}>
            <div className={clsx(
              'flex items-center justify-between p-4 border-b sticky top-0',
              darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
            )}>
              <h4 className={clsx('font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
                {editingCommand ? 'Edit Command' : 'New Command'}
              </h4>
              <button onClick={resetForm} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className={clsx('block text-xs font-medium mb-1', darkMode ? 'text-gray-400' : 'text-gray-600')}>
                  Command Name (without dot)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  className={inputClass}
                  placeholder="e.g., ping"
                  required
                />
                <p className="text-xs text-gray-500 mt-0.5">Users will type: .{formData.name || 'ping'}</p>
              </div>
              
              <div>
                <label className={clsx('block text-xs font-medium mb-1', darkMode ? 'text-gray-400' : 'text-gray-600')}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={inputClass}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={clsx('block text-xs font-medium mb-1', darkMode ? 'text-gray-400' : 'text-gray-600')}>
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={inputClass}
                  placeholder="Shows in .menu and .help"
                />
              </div>
              
              <div>
                <label className={clsx('block text-xs font-medium mb-1', darkMode ? 'text-gray-400' : 'text-gray-600')}>
                  Response Message
                </label>
                <textarea
                  value={formData.response}
                  onChange={(e) => setFormData({...formData, response: e.target.value})}
                  className={inputClass}
                  rows="3"
                  placeholder="The message the bot will reply with..."
                  required
                />
              </div>
              
              <div>
                <label className={clsx('block text-xs font-medium mb-1', darkMode ? 'text-gray-400' : 'text-gray-600')}>
                  Aliases (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.aliases}
                  onChange={(e) => setFormData({...formData, aliases: e.target.value})}
                  className={inputClass}
                  placeholder="p, test"
                />
                <p className="text-xs text-gray-500 mt-0.5">Alternative names for this command</p>
              </div>
              
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.adminOnly}
                    onChange={(e) => setFormData({...formData, adminOnly: e.target.checked})}
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <span className={clsx('text-sm', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                    Admin Only
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <span className={clsx('text-sm', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                    Enabled
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={resetForm} className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium">
                  {editingCommand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commands List - Grouped by Category */}
      {commands.length === 0 ? (
        <div className={clsx(
          'text-center py-8 rounded-xl border border-dashed',
          darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
        )}>
          <FiCode className={clsx('mx-auto text-3xl mb-2', darkMode ? 'text-gray-600' : 'text-gray-400')} />
          <p className={clsx('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            No custom commands yet
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-primary-500 hover:text-primary-600 text-sm font-medium"
          >
            Create your first command
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedCommands).map(([category, cmds]) => {
            const catInfo = categories.find(c => c.value === category) || { label: category, icon: '📁' };
            return (
              <div key={category} className="space-y-2">
                <h4 className={clsx('text-sm font-medium flex items-center gap-2', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                  {catInfo.icon} {catInfo.label}
                  <span className="text-xs text-gray-400">({cmds.filter(c => c.enabled).length}/{cmds.length} active)</span>
                </h4>
                <div className="space-y-2">
                  {cmds.map(cmd => (
                    <div key={cmd._id} className={clsx(
                      'p-3 rounded-lg border flex items-center justify-between',
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
                      !cmd.enabled && 'opacity-60'
                    )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx('font-mono text-sm font-medium', darkMode ? 'text-primary-400' : 'text-primary-600')}>
                            .{cmd.name}
                          </span>
                          {cmd.aliases?.length > 0 && (
                            <span className="text-xs text-gray-400">
                              ({cmd.aliases.map(a => `.${a}`).join(', ')})
                            </span>
                          )}
                          {cmd.adminOnly && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                              Admin
                            </span>
                          )}
                          {!cmd.enabled && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className={clsx('text-xs mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                          {cmd.description || 'No description'}
                        </p>
                        <p className={clsx('text-xs mt-1 truncate', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                          Response: {cmd.response?.substring(0, 40)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => onToggle(cmd)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={cmd.enabled ? 'Disable' : 'Enable'}
                        >
                          {cmd.enabled ? (
                            <FiToggleRight className="text-green-500" size={18} />
                          ) : (
                            <FiToggleLeft className="text-gray-400" size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(cmd)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(cmd._id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Preview of how .menu will show */}
      <div className={clsx(
        'mt-6 p-4 rounded-xl border',
        darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
      )}>
        <p className={clsx('text-xs font-medium mb-2', darkMode ? 'text-gray-400' : 'text-gray-500')}>
          📱 Preview: How .menu will display
        </p>
        <div className={clsx(
          'p-3 rounded-lg font-mono text-sm',
          darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'
        )}>
          <p className="font-bold mb-2">📱 *HDM BOT COMMANDS MENU*</p>
          <p className="text-gray-400 text-xs mb-1">─────────────────</p>
          
          {Object.entries(groupedCommands).map(([category, cmds]) => {
            if (cmds.filter(c => c.enabled).length === 0) return null;
            const catInfo = categories.find(c => c.value === category) || { label: category, icon: '📁' };
            return (
              <div key={category} className="mb-2">
                <p className="font-medium text-primary-500 text-xs">{catInfo.icon} *{catInfo.label}:*</p>
                {cmds.filter(c => c.enabled).map(cmd => (
                  <p key={cmd._id} className="ml-2 text-xs">
                    .{cmd.name} - {cmd.description || 'No description'}
                  </p>
                ))}
              </div>
            );
          })}
          
          <p className="text-gray-400 text-xs mt-2">─────────────────</p>
          <p className="text-gray-400 text-xs italic">_HDM WhatsApp Bot_</p>
        </div>
      </div>
    </div>
  );
};

export default CommandSettings;