import React, { useState } from 'react';
import { FiLink, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const PairingCodeForm = ({ onSuccess }) => {
  const { darkMode } = useTheme();
  const { pairWithCode, whatsappReady, connectionStatus } = useSocket();
  const [pairingCode, setPairingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cleanCode = pairingCode.trim().replace(/\D/g, '');
    if (cleanCode.length < 8 || cleanCode.length > 12) {
      toast.error('Please enter a valid 8-12 digit pairing code');
      return;
    }
    
    if (isLoading || whatsappReady) return;
    
    setIsLoading(true);
    setStatus(null);
    
    try {
      const result = await pairWithCode(cleanCode);
      setStatus('success');
      toast.success('Pairing initiated! Check your WhatsApp');
      onSuccess?.(result);
      setPairingCode('');
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      setStatus('error');
      toast.error(err.message || 'Pairing failed. Please try again.');
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (whatsappReady) {
    return (
      <div className={clsx('text-center p-3 rounded-lg', darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600')}>
        <FiCheckCircle className="inline mr-2" size={16} />
        WhatsApp is already connected
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={clsx('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
          Enter Pairing Code
        </label>
        <div className="relative">
          <input
            type="text"
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="e.g., 12345678"
            className={clsx(
              'w-full px-4 py-2.5 rounded-lg border outline-none transition-colors',
              status === 'success' && 'border-green-500 ring-1 ring-green-500',
              status === 'error' && 'border-red-500 ring-1 ring-red-500',
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500'
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-primary-500'
            )}
            disabled={isLoading}
            autoComplete="off"
          />
          {status === 'success' && (
            <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
          )}
          {status === 'error' && (
            <FiAlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />
          )}
        </div>
        <p className={clsx('text-xs mt-1', darkMode ? 'text-gray-500' : 'text-gray-400')}>
          Get pairing code from WhatsApp: Settings → Linked Devices → Link with phone number
        </p>
      </div>
      
      <button
        type="submit"
        disabled={!pairingCode.trim() || isLoading || whatsappReady}
        className={clsx(
          'w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
          pairingCode.trim() && !isLoading && !whatsappReady
            ? 'bg-primary-500 hover:bg-primary-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <FiLoader className="animate-spin" size={16} />
            Pairing...
          </>
        ) : (
          <>
            <FiLink size={16} />
            Pair Device
          </>
        )}
      </button>
    </form>
  );
};

export default PairingCodeForm;