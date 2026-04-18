import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiEye, FiEyeOff } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

const QRCodeDisplay = ({ qrData, qrRaw, onRefresh, onShowQR, isLoading, isQRReady }) => {
  const { darkMode } = useTheme();
  const [showQR, setShowQR] = useState(true);

  // Use external API for large QR strings
  const getQrImageUrl = (data) => {
    return `https://quickchart.io/qr?text=${encodeURIComponent(data)}&size=256&margin=1&ecLevel=L`;
  };

  // Determine what to display
  let imageSrc = null;
  if (qrRaw) {
    imageSrc = getQrImageUrl(qrRaw);
  } else if (qrData && typeof qrData === 'string' && qrData.startsWith('data:image')) {
    imageSrc = qrData;
  }

  const hasQR = !!(imageSrc);

  return (
    <div className="flex flex-col items-center">
      {/* Show QR Button - appears when QR is ready but hidden */}
      {isQRReady && !showQR && (
        <button
          onClick={() => setShowQR(true)}
          className="mb-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm flex items-center gap-2"
        >
          <FiEye size={16} />
          Show QR Code
        </button>
      )}

      {/* QR Code Display */}
      {(showQR && hasQR) ? (
        <div className={clsx(
          'p-4 rounded-2xl transition-all',
          darkMode ? 'bg-white' : 'bg-white'
        )}>
          <img
            src={imageSrc}
            alt="WhatsApp QR Code"
            className="w-64 h-64"
          />
        </div>
      ) : (isQRReady && !showQR) ? (
        <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer" onClick={() => setShowQR(true)}>
          <div className="text-center">
            <FiEyeOff size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-400 text-sm">QR Code Hidden</p>
            <p className="text-gray-500 text-xs mt-1">Click "Show QR Code" to display</p>
          </div>
        </div>
      ) : (
        <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">
              {isLoading ? 'Generating QR code...' : 'Click refresh to generate QR code'}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <FiRefreshCw className={clsx(isLoading && 'animate-spin')} size={16} />
          {isLoading ? 'Generating...' : 'Refresh QR'}
        </button>
        
        {hasQR && showQR && (
          <button
            onClick={() => setShowQR(false)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm flex items-center gap-2"
          >
            <FiEyeOff size={16} />
            Hide QR
          </button>
        )}
      </div>

      <p className={clsx('text-xs mt-3 text-center', darkMode ? 'text-gray-400' : 'text-gray-500')}>
        Open WhatsApp on your phone, tap Menu or Settings and select WhatsApp Web.
        Point your phone at this screen to capture the code.
      </p>
    </div>
  );
};

export default QRCodeDisplay;