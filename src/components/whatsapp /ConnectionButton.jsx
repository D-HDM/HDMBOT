import React from 'react';
import { FiWifi, FiWifiOff, FiLoader } from 'react-icons/fi';
import { useSocket } from '../../contexts/SocketContext';
import clsx from 'clsx';

const ConnectionButton = ({ className = '' }) => {
  const { whatsappReady, connectionStatus, connectWhatsApp, disconnectWhatsApp } = useSocket();

  const handleClick = () => {
    if (whatsappReady) {
      disconnectWhatsApp();
    } else {
      connectWhatsApp();
    }
  };

  const getButtonContent = () => {
    if (connectionStatus === 'connecting') {
      return (
        <>
          <FiLoader className="animate-spin" size={16} />
          Connecting...
        </>
      );
    }
    if (whatsappReady) {
      return (
        <>
          <FiWifi size={16} />
          Connected
        </>
      );
    }
    return (
      <>
        <FiWifiOff size={16} />
        Connect WhatsApp
      </>
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={connectionStatus === 'connecting'}
      className={clsx(
        'px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors',
        whatsappReady
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-primary-500 hover:bg-primary-600 text-white',
        connectionStatus === 'connecting' && 'opacity-70 cursor-not-allowed',
        className
      )}
    >
      {getButtonContent()}
    </button>
  );
};

export default ConnectionButton;