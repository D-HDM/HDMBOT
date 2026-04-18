import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import QRCodeDisplay from '../components/whatsapp/QRCodeDisplay';
import PairingCodeForm from '../components/whatsapp/PairingCodeForm';
import ConnectionButton from '../components/whatsapp/ConnectionButton';
import { FiArrowLeft, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const QrPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { 
    qrCode, 
    qrRaw, 
    connectionStatus, 
    whatsappReady, 
    connectWhatsApp,
    socket,
    isConnected,
    requestCurrentQR
  } = useSocket();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isQRReady, setIsQRReady] = useState(false);
  const [hasRequestedQR, setHasRequestedQR] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if QR is already available from props
  useEffect(() => {
    if ((qrCode || qrRaw) && connectionStatus === 'qr') {
      console.log('✅ QR already available in props');
      setIsQRReady(true);
      setHasRequestedQR(true);
    }
  }, [qrCode, qrRaw, connectionStatus]);

  // Request current QR from backend on page load
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⏳ Socket not ready yet');
      return;
    }
    
    if (whatsappReady) {
      console.log('✅ Already connected, no QR needed');
      return;
    }
    
    if (!hasRequestedQR && !qrRaw && !qrCode) {
      console.log('📱 Requesting existing QR from backend...');
      setHasRequestedQR(true);
      
      // Request QR from backend
      socket.emit('hdm:get_qr', (response) => {
        console.log('📱 get_qr response:', response);
        if (response && response.qr) {
          console.log('✅ QR received from backend, length:', response.qr.length);
          setIsQRReady(true);
          toast.success('QR code retrieved!');
        } else {
          console.log('❌ No QR available from backend');
          // If no QR, try to request one after a delay
          setTimeout(() => {
            if (!qrRaw && !qrCode && !whatsappReady) {
              console.log('🔄 No QR found, please click "Connect WhatsApp"');
              toast('Click "Connect WhatsApp" to generate QR code');
            }
          }, 2000);
        }
      });
    }
  }, [socket, isConnected, whatsappReady, hasRequestedQR, qrRaw, qrCode, retryCount]);

  // Listen for QR updates from backend
  useEffect(() => {
    if (!socket) return;
    
    const handleQR = (qr) => {
      console.log('📱 QR image received from backend');
      setIsQRReady(true);
    };
    
    const handleQRRaw = (data) => {
      console.log('📱 Raw QR received from backend', data);
      setIsQRReady(true);
    };
    
    socket.on('hdm:qr', handleQR);
    socket.on('hdm:qr_raw', handleQRRaw);
    
    return () => {
      socket.off('hdm:qr', handleQR);
      socket.off('hdm:qr_raw', handleQRRaw);
    };
  }, [socket]);

  useEffect(() => {
    if (whatsappReady) {
      toast.success('WhatsApp is connected!');
      navigate('/dashboard');
    }
  }, [whatsappReady, navigate]);

  const handleRefreshQR = async () => {
    setIsLoading(true);
    setIsQRReady(false);
    setHasRequestedQR(false);
    try {
      connectWhatsApp();
      toast.success('Requesting QR code...');
      // Retry getting QR after connection request
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 2000);
    } catch (err) {
      toast.error('Failed to generate QR code');
    } finally {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const handleShowExistingQR = () => {
    if (qrCode || qrRaw) {
      setIsQRReady(true);
      toast.success('Showing existing QR code');
    } else {
      toast.error('No QR code available. Please refresh.');
      setHasRequestedQR(false);
      setRetryCount(prev => prev + 1);
    }
  };

  const handlePairingCode = (code) => {
    toast.success(`Pairing code ${code} submitted (if supported)`);
  };

  const hasQR = !!(qrCode || qrRaw);
  const isConnecting = connectionStatus === 'qr' || connectionStatus === 'connecting';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className={clsx(
        'w-full max-w-md rounded-2xl shadow-xl p-6',
        darkMode ? 'bg-gray-800' : 'bg-white'
      )}>
        <button
          onClick={() => navigate('/dashboard')}
          className={clsx(
            'flex items-center gap-1 text-sm mb-4',
            darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <FiArrowLeft size={16} />
          Back to Dashboard
        </button>

        <h2 className={clsx('text-2xl font-bold text-center mb-2', darkMode ? 'text-white' : 'text-gray-800')}>
          Connect WhatsApp
        </h2>
        <p className={clsx('text-center text-sm mb-6', darkMode ? 'text-gray-400' : 'text-gray-500')}>
          Scan the QR code with WhatsApp to link your device
        </p>

        {connectionStatus === 'connected' || whatsappReady ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full" />
            </div>
            <h3 className={clsx('text-xl font-semibold mb-2', darkMode ? 'text-white' : 'text-gray-800')}>
              Connected!
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              WhatsApp is ready. Redirecting...
            </p>
          </div>
        ) : (
          <>
            {/* Show existing QR button when backend has QR but not displayed */}
            {hasQR && !isQRReady && (
              <div className="mb-4 flex justify-center">
                <button
                  onClick={handleShowExistingQR}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <FiEye size={16} />
                  Show Existing QR Code
                </button>
              </div>
            )}

            {/* QR Code Display */}
            <QRCodeDisplay
              qrData={qrCode}
              qrRaw={qrRaw}
              onRefresh={handleRefreshQR}
              onShowQR={handleShowExistingQR}
              isLoading={isLoading}
              isQRReady={isQRReady}
            />
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className={clsx('text-sm font-medium mb-3 text-center', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                — OR Use Pairing Code —
              </p>
              <PairingCodeForm onSuccess={handlePairingCode} />
            </div>

            <div className="mt-4 text-center">
              <ConnectionButton className="w-full justify-center" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QrPage;