import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import { ruleAPI, commandAPI } from '../services/api';
import RulesList from '../components/automation/RulesList';
import RuleForm from '../components/automation/RuleForm';
import CommandSettings from '../components/automation/CommandSettings';
import { 
  FiDownload, FiUpload, FiFileText, FiTerminal, 
  FiZap, FiRefreshCw, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Automation = () => {
  const { darkMode } = useTheme();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [exporting, setExporting] = useState({ rules: false, commands: false });
  const [syncStatus, setSyncStatus] = useState({ commands: false, rules: false });
  
  const ruleFileInputRef = useRef(null);
  const commandFileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, commandsRes] = await Promise.all([
        ruleAPI.getAll(),
        commandAPI.getAll(),
      ]);
      setRules(rulesRes.data?.data || []);
      setCommands(commandsRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for socket events about command/rule reloads
  useEffect(() => {
    if (!socket) return;

    const handleCommandsReloaded = () => {
      setSyncStatus(prev => ({ ...prev, commands: true }));
      fetchData();
      toast.success('Commands synced with handler', { icon: '🔄' });
      setTimeout(() => setSyncStatus(prev => ({ ...prev, commands: false })), 3000);
    };

    const handleRulesReloaded = () => {
      setSyncStatus(prev => ({ ...prev, rules: true }));
      fetchData();
      toast.success('Rules synced with handler', { icon: '🔄' });
      setTimeout(() => setSyncStatus(prev => ({ ...prev, rules: false })), 3000);
    };

    socket.on('hdm:commands_reloaded', handleCommandsReloaded);
    socket.on('hdm:rules_reloaded', handleRulesReloaded);

    return () => {
      socket.off('hdm:commands_reloaded', handleCommandsReloaded);
      socket.off('hdm:rules_reloaded', handleRulesReloaded);
    };
  }, [socket]);

  // ============================================
  // RULE HANDLERS
  // ============================================
  const handleCreateRule = async (data) => {
    try {
      const res = await ruleAPI.create(data);
      if (res.data.success) {
        toast.success('Rule created');
        fetchData();
        setShowRuleForm(false);
        // Auto-reload rules in handler
        socket?.emit('hdm:reload_rules');
      }
    } catch (err) {
      toast.error('Failed to create rule');
    }
  };

  const handleUpdateRule = async (id, data) => {
    try {
      const res = await ruleAPI.update(id, data);
      if (res.data.success) {
        toast.success('Rule updated');
        fetchData();
        setShowRuleForm(false);
        setEditingRule(null);
        socket?.emit('hdm:reload_rules');
      }
    } catch (err) {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await ruleAPI.delete(id);
      toast.success('Rule deleted');
      fetchData();
      socket?.emit('hdm:reload_rules');
    } catch (err) {
      toast.error('Failed to delete rule');
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      await ruleAPI.toggle(rule._id);
      fetchData();
      socket?.emit('hdm:reload_rules');
      toast.success(`Rule ${rule.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      toast.error('Failed to toggle rule');
    }
  };

  // ============================================
  // COMMAND HANDLERS
  // ============================================
  const handleCreateCommand = async (data) => {
    try {
      await commandAPI.create(data);
      toast.success('Command created');
      fetchData();
      socket?.emit('hdm:reload_commands');
    } catch (err) {
      toast.error('Failed to create command');
    }
  };

const handleUpdateCommand = async (id, data) => {
  try {
    await commandAPI.update(id, data);
    toast.success('Command updated');
    fetchData();
    socket?.emit('hdm:reload_commands');
  } catch (err) {
    toast.error('Failed to update command');
  }
};

  const handleDeleteCommand = async (id) => {
    if (!window.confirm('Delete this command?')) return;
    try {
      await commandAPI.delete(id);
      toast.success('Command deleted');
      fetchData();
      socket?.emit('hdm:reload_commands');
    } catch (err) {
      toast.error('Failed to delete command');
    }
  };

  const handleToggleCommand = async (cmd) => {
    try {
      await commandAPI.update(cmd._id, { ...cmd, enabled: !cmd.enabled });
      fetchData();
      socket?.emit('hdm:reload_commands');
      toast.success(`Command ${cmd.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      toast.error('Failed to toggle command');
    }
  };

  // ============================================
  // SYNC HANDLERS
  // ============================================
  const handleSyncCommands = () => {
    socket?.emit('hdm:reload_commands');
    toast.success('Syncing commands with handler...');
  };

  const handleSyncRules = () => {
    socket?.emit('hdm:reload_rules');
    toast.success('Syncing rules with handler...');
  };

  // ============================================
  // IMPORT/EXPORT
  // ============================================
  const handleExportRules = () => {
    if (rules.length === 0) {
      toast.error('No rules to export');
      return;
    }
    setExporting(prev => ({ ...prev, rules: true }));
    
    const exportData = {
      type: 'hdm_rules',
      version: '1.0',
      exportDate: new Date().toISOString(),
      count: rules.length,
      data: rules.map(({ _id, createdAt, updatedAt, timesTriggered, ...rule }) => rule),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hdm-rules-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${rules.length} rules`);
    setExporting(prev => ({ ...prev, rules: false }));
  };

  const handleImportRules = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        const rulesToImport = importData.data || importData;
        
        if (!Array.isArray(rulesToImport)) throw new Error('Invalid format');

        let imported = 0;
        for (const rule of rulesToImport) {
          try {
            const { _id, timesTriggered, createdAt, updatedAt, ...ruleData } = rule;
            await ruleAPI.create(ruleData);
            imported++;
          } catch (err) {}
        }

        if (imported > 0) {
          toast.success(`Imported ${imported} rules`);
          fetchData();
          socket?.emit('hdm:reload_rules');
        } else {
          toast.error('No rules imported');
        }
      } catch (err) {
        toast.error('Invalid JSON file');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExportCommands = () => {
    if (commands.length === 0) {
      toast.error('No commands to export');
      return;
    }
    setExporting(prev => ({ ...prev, commands: true }));
    
    const exportData = {
      type: 'hdm_commands',
      version: '1.0',
      exportDate: new Date().toISOString(),
      count: commands.length,
      data: commands.map(({ _id, createdAt, updatedAt, timesUsed, ...cmd }) => cmd),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hdm-commands-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${commands.length} commands`);
    setExporting(prev => ({ ...prev, commands: false }));
  };

  const handleImportCommands = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        const commandsToImport = importData.data || importData;
        
        if (!Array.isArray(commandsToImport)) throw new Error('Invalid format');

        let imported = 0;
        for (const cmd of commandsToImport) {
          try {
            const { _id, timesUsed, createdAt, updatedAt, ...cmdData } = cmd;
            await commandAPI.create(cmdData);
            imported++;
          } catch (err) {}
        }

        if (imported > 0) {
          toast.success(`Imported ${imported} commands`);
          fetchData();
          socket?.emit('hdm:reload_commands');
        } else {
          toast.error('No commands imported');
        }
      } catch (err) {
        toast.error('Invalid JSON file');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={clsx('text-2xl md:text-3xl font-bold', darkMode ? 'text-white' : 'text-gray-800')}>
            Automation
          </h1>
          <p className={clsx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            Manage auto-reply rules and custom commands
          </p>
        </div>
        
        {/* Sync Status Indicators */}
        <div className="flex gap-2">
          {syncStatus.commands && (
            <div className="flex items-center gap-1 text-green-500 text-sm">
              <FiCheckCircle size={14} />
              Commands synced
            </div>
          )}
          {syncStatus.rules && (
            <div className="flex items-center gap-1 text-green-500 text-sm">
              <FiCheckCircle size={14} />
              Rules synced
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('rules')}
          className={clsx(
            'px-4 py-2 font-medium text-sm transition-colors relative flex items-center gap-2',
            activeTab === 'rules'
              ? 'text-primary-500'
              : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <FiFileText size={14} />
          Auto-Reply Rules
          <span className={clsx(
            'text-xs px-1.5 py-0.5 rounded-full',
            darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
          )}>
            {rules.filter(r => r.enabled).length}/{rules.length}
          </span>
          {activeTab === 'rules' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('commands')}
          className={clsx(
            'px-4 py-2 font-medium text-sm transition-colors relative flex items-center gap-2',
            activeTab === 'commands'
              ? 'text-primary-500'
              : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <FiTerminal size={14} />
          Commands
          <span className={clsx(
            'text-xs px-1.5 py-0.5 rounded-full',
            darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
          )}>
            {commands.filter(c => c.enabled).length}/{commands.length}
          </span>
          {activeTab === 'commands' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Rules Actions */}
              <div className="flex flex-wrap gap-2 justify-end">
                <button onClick={handleSyncRules} className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}>
                  <FiRefreshCw size={14} /> Sync with Handler
                </button>
                <button onClick={handleExportRules} disabled={rules.length === 0} className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
                  rules.length === 0 && 'opacity-50 cursor-not-allowed'
                )}>
                  <FiDownload size={14} /> Export
                </button>
                <button onClick={() => ruleFileInputRef.current?.click()} className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}>
                  <FiUpload size={14} /> Import
                </button>
                <input type="file" ref={ruleFileInputRef} accept=".json" onChange={handleImportRules} className="hidden" />
              </div>
              <RulesList
                rules={rules}
                onAdd={() => { setEditingRule(null); setShowRuleForm(true); }}
                onEdit={(rule) => { setEditingRule(rule); setShowRuleForm(true); }}
                onDelete={handleDeleteRule}
                onToggle={handleToggleRule}
              />
            </div>
          )}
          
          {activeTab === 'commands' && (
            <div className="space-y-4">
              {/* Commands Actions */}
              <div className="flex flex-wrap gap-2 justify-end">
                <button onClick={handleSyncCommands} className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}>
                  <FiRefreshCw size={14} /> Sync with Handler
                </button>
                <button onClick={handleExportCommands} disabled={commands.length === 0} className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
                  commands.length === 0 && 'opacity-50 cursor-not-allowed'
                )}>
                  <FiDownload size={14} /> Export
                </button>
                <button onClick={() => commandFileInputRef.current?.click()} className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}>
                  <FiUpload size={14} /> Import
                </button>
                <input type="file" ref={commandFileInputRef} accept=".json" onChange={handleImportCommands} className="hidden" />
              </div>
              <CommandSettings
                commands={commands}
                onAdd={handleCreateCommand}
                onEdit={handleUpdateCommand}
                onDelete={handleDeleteCommand}
                onToggle={handleToggleCommand}
              />
            </div>
          )}
        </>
      )}

      {/* Rule Form Modal */}
      {showRuleForm && (
        <RuleForm
          rule={editingRule}
          onSave={editingRule ? (data) => handleUpdateRule(editingRule._id, data) : handleCreateRule}
          onCancel={() => { setShowRuleForm(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
};

export default Automation;