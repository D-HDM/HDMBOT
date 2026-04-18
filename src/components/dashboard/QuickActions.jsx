import React from 'react';
import { FiSend, FiRefreshCw, FiPlus, FiSmartphone } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const QuickActions = () => {
  const navigate = useNavigate();
  const { connectWhatsApp, whatsappReady } = useSocket();
  const { darkMode } = useTheme();

  const actions = [
    {
      icon: FiSend,
      label: 'Send Message',
      onClick: () => navigate('/messages'),
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      icon: FiSmartphone,
      label: 'Connect WA',
      onClick: () => {
        if (!whatsappReady) {
          connectWhatsApp();
          toast.success('QR code generated');
          navigate('/qr');
        } else {
          toast.success('WhatsApp already connected');
        }
      },
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      icon: FiRefreshCw,
      label: 'Sync Now',
      onClick: () => toast.success('Syncing...'),
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
    },
    {
      icon: FiPlus,
      label: 'New Rule',
      onClick: () => navigate('/automation'),
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className={clsx('rounded-xl shadow-sm border p-4', darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
      <h3 className={clsx('font-semibold mb-3', darkMode ? 'text-white' : 'text-gray-800')}>Quick Actions</h3>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className={clsx('p-2 rounded-full', action.bg)}>
                <Icon className={action.color} size={18} />
              </div>
              <span className={clsx('text-xs font-medium', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;