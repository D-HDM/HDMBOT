import React from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertCircle, 
  FiWifi, 
  FiWifiOff, 
  FiServer,
  FiPhone,
  FiActivity,
  FiClock
} from 'react-icons/fi';
import clsx from 'clsx';

const ConnectionStatus = () => {
  const { whatsappReady, phoneNumber, isConnected, connectionStatus } = useSocket();
  const { darkMode } = useTheme();

  const statusItems = [
    {
      label: 'WhatsApp Session',
      value: whatsappReady ? 'Connected' : 'Disconnected',
      icon: whatsappReady ? FiCheckCircle : FiXCircle,
      iconColor: whatsappReady ? 'text-green-500' : 'text-red-500',
      valueColor: whatsappReady ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      detail: whatsappReady ? 'Active' : 'Offline',
    },
    {
      label: 'Phone Number',
      value: whatsappReady ? phoneNumber || 'Loading...' : 'Not connected',
      icon: FiPhone,
      iconColor: 'text-blue-500 dark:text-blue-400',
      valueColor: 'text-gray-700 dark:text-gray-300',
      isMono: true,
    },
    {
      label: 'Connection Status',
      value: whatsappReady ? 'Active' : connectionStatus === 'qr' ? 'Waiting for QR' : 'Offline',
      icon: FiActivity,
      iconColor: whatsappReady ? 'text-green-500' : connectionStatus === 'qr' ? 'text-yellow-500' : 'text-red-500',
      valueColor: whatsappReady ? 'text-green-600 dark:text-green-400' : connectionStatus === 'qr' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400',
      pulse: whatsappReady,
    },
    {
      label: 'Server Connection',
      value: isConnected ? 'Connected' : 'Disconnected',
      icon: FiServer,
      iconColor: isConnected ? 'text-green-500' : 'text-red-500',
      valueColor: isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      pulse: isConnected,
    },
  ];

  return (
    <div className={clsx(
      'rounded-xl shadow-sm border h-full',
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    )}>
      {/* Header */}
      <div className={clsx(
        'flex items-center justify-between p-4 border-b',
        darkMode ? 'border-gray-700' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-2">
          <div className={clsx(
            'p-2 rounded-lg',
            darkMode ? 'bg-primary-900/30' : 'bg-primary-50'
          )}>
            <FiWifi className={clsx(
              'text-lg',
              whatsappReady ? 'text-green-500' : 'text-gray-400'
            )} />
          </div>
          <div>
            <h3 className={clsx(
              'font-semibold',
              darkMode ? 'text-white' : 'text-gray-800'
            )}>
              Connection Status
            </h3>
            <p className={clsx(
              'text-xs',
              darkMode ? 'text-gray-400' : 'text-gray-500'
            )}>
              {whatsappReady ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
            </p>
          </div>
        </div>
        
        {/* Overall Status Badge */}
        <div className={clsx(
          'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5',
          whatsappReady 
            ? darkMode ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200'
            : darkMode ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-700 border border-red-200'
        )}>
          <span className={clsx(
            'w-1.5 h-1.5 rounded-full',
            whatsappReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          )} />
          {whatsappReady ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Status Items */}
      <div className="p-4 space-y-1">
        {statusItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={clsx(
                'flex items-center justify-between py-3 px-2 rounded-lg transition-colors',
                darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'p-1.5 rounded-lg',
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                )}>
                  <Icon className={clsx('text-base', item.iconColor)} />
                </div>
                <span className={clsx(
                  'text-sm font-medium',
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                )}>
                  {item.label}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {item.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
                <span className={clsx(
                  'text-sm font-medium',
                  item.isMono ? 'font-mono' : '',
                  item.valueColor
                )}>
                  {item.value}
                </span>
                {item.detail && (
                  <span className={clsx(
                    'text-xs',
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    • {item.detail}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with additional info */}
      <div className={clsx(
        'p-4 border-t',
        darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiClock className={clsx(
              'text-sm',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )} />
            <span className={clsx(
              'text-xs',
              darkMode ? 'text-gray-400' : 'text-gray-500'
            )}>
              Last checked
            </span>
          </div>
          <span className={clsx(
            'text-xs font-mono',
            darkMode ? 'text-gray-300' : 'text-gray-600'
          )}>
            {new Date().toLocaleTimeString()}
          </span>
        </div>
        
        {/* Connection quality indicator */}
        {whatsappReady && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
            <span className={clsx(
              'text-xs font-medium',
              darkMode ? 'text-green-400' : 'text-green-600'
            )}>
              Excellent
            </span>
          </div>
        )}
        
        {/* Disconnected message */}
        {!whatsappReady && (
          <div className={clsx(
            'mt-3 p-2 rounded-lg text-xs flex items-start gap-2',
            darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
          )}>
            <FiAlertCircle className={clsx(
              'text-sm flex-shrink-0 mt-0.5',
              darkMode ? 'text-yellow-500' : 'text-yellow-600'
            )} />
            <span className={darkMode ? 'text-yellow-400' : 'text-yellow-700'}>
              {connectionStatus === 'qr' 
                ? 'Scan QR code in the QR page to connect WhatsApp.' 
                : 'Click "Connect WA" in Quick Actions to start.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;