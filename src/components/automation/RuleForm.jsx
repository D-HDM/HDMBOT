import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

const RuleForm = ({ rule = null, onSave, onCancel }) => {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'keyword',
    triggerValue: '',
    caseSensitive: false,
    response: '',
    priority: 50,
    enabled: true,
    groupOnly: false,
    privateOnly: false,
    onlyFrom: '',
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        triggerType: rule.trigger?.type || 'keyword',
        triggerValue: rule.trigger?.value || '',
        caseSensitive: rule.trigger?.caseSensitive || false,
        response: rule.response || '',
        priority: rule.priority || 50,
        enabled: rule.enabled !== false,
        groupOnly: rule.conditions?.groupOnly || false,
        privateOnly: rule.conditions?.privateOnly || false,
        onlyFrom: rule.conditions?.onlyFrom?.join(',') || '',
      });
    }
  }, [rule]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      enabled: formData.enabled,
      trigger: {
        type: formData.triggerType,
        value: formData.triggerValue,
        caseSensitive: formData.caseSensitive,
      },
      response: formData.response,
      priority: parseInt(formData.priority),
      conditions: {
        groupOnly: formData.groupOnly,
        privateOnly: formData.privateOnly,
        onlyFrom: formData.onlyFrom ? formData.onlyFrom.split(',').map(s => s.trim()).filter(Boolean) : [],
      },
    };

    onSave(payload);
  };

  const inputClass = clsx(
    'w-full px-3 py-2 rounded-lg border outline-none transition-colors',
    darkMode
      ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-primary-500'
      : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-primary-500'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={clsx(
        'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-xl',
        darkMode ? 'bg-gray-900' : 'bg-white'
      )}>
        <div className={clsx(
          'flex items-center justify-between p-4 border-b',
          darkMode ? 'border-gray-800' : 'border-gray-200'
        )}>
          <h3 className={clsx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>
            {rule ? 'Edit Rule' : 'Create New Rule'}
          </h3>
          <button
            onClick={onCancel}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            )}
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className={clsx('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Rule Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={inputClass}
              placeholder="e.g., Welcome Message"
              required
            />
          </div>

          {/* Trigger Type */}
          <div>
            <label className={clsx('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Trigger Type
            </label>
            <select
              value={formData.triggerType}
              onChange={(e) => handleChange('triggerType', e.target.value)}
              className={inputClass}
            >
              <option value="keyword">Keyword Match</option>
              <option value="regex">Regex Pattern</option>
              <option value="always">Always (Every Message)</option>
            </select>
          </div>

          {/* Trigger Value */}
          <div>
            <label className={clsx('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Trigger Value
            </label>
            <input
              type="text"
              value={formData.triggerValue}
              onChange={(e) => handleChange('triggerValue', e.target.value)}
              className={inputClass}
              placeholder={formData.triggerType === 'regex' ? 'e.g., ^Hello' : 'e.g., hello'}
              required={formData.triggerType !== 'always'}
              disabled={formData.triggerType === 'always'}
            />
          </div>

          {/* Case Sensitive */}
          {formData.triggerType !== 'always' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="caseSensitive"
                checked={formData.caseSensitive}
                onChange={(e) => handleChange('caseSensitive', e.target.checked)}
                className="w-4 h-4 text-primary-500 rounded"
              />
              <label htmlFor="caseSensitive" className={clsx('text-sm', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                Case Sensitive
              </label>
            </div>
          )}

          {/* Response */}
          <div>
            <label className={clsx('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Auto-Reply Message
            </label>
            <textarea
              value={formData.response}
              onChange={(e) => handleChange('response', e.target.value)}
              className={inputClass}
              rows="3"
              placeholder="Type the response message..."
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className={clsx('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Priority (1-100)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Conditions */}
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <p className={clsx('text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-700')}>Conditions</p>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.groupOnly}
                  onChange={(e) => handleChange('groupOnly', e.target.checked)}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <span className={clsx('text-sm', darkMode ? 'text-gray-300' : 'text-gray-700')}>Groups Only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.privateOnly}
                  onChange={(e) => handleChange('privateOnly', e.target.checked)}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <span className={clsx('text-sm', darkMode ? 'text-gray-300' : 'text-gray-700')}>Private Chats Only</span>
              </label>
            </div>

            <div>
              <label className={clsx('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                Only From Numbers (comma-separated)
              </label>
              <input
                type="text"
                value={formData.onlyFrom}
                onChange={(e) => handleChange('onlyFrom', e.target.value)}
                className={inputClass}
                placeholder="254712345678, 254723456789"
              />
            </div>
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="w-4 h-4 text-primary-500 rounded"
            />
            <label htmlFor="enabled" className={clsx('text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Enable Rule
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <FiSave size={16} />
              {rule ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RuleForm;