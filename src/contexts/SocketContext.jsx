import React, { createContext, useContext, useEffect, useState } from 'react'
import { initSocket, disconnectSocket } from '../services/socket'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within SocketProvider')
  return context
}

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [whatsappReady, setWhatsappReady] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [qrCode, setQrCode] = useState(null)
  const [qrRaw, setQrRaw] = useState(null)

  // Request current QR from backend (for page refresh)
  const requestCurrentQR = () => {
    if (socket && isConnected) {
      console.log('📱 Emitting hdm:get_qr to backend...')
      socket.emit('hdm:get_qr', (response) => {
        console.log('📱 get_qr response:', response)
        if (response?.qr) {
          console.log('✅ QR loaded from backend, length:', response.qr.length)
          setQrRaw(response.qr)
          setQrCode(null)
          setConnectionStatus('qr')
        } else {
          console.log('❌ No QR in response from backend')
        }
      })
    } else {
      console.log('❌ Socket not ready for QR request, socket:', !!socket, 'connected:', isConnected)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      const s = initSocket()
      setSocket(s)

      s.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
      })
      s.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      s.on('hdm:status', (status) => {
        console.log('hdm:status', status)
        setWhatsappReady(status.connected)
        setPhoneNumber(status.phone)
        setConnectionStatus(status.connected ? 'connected' : 'disconnected')
      })

      s.on('hdm:ready', (data) => {
        console.log('hdm:ready', data)
        setWhatsappReady(true)
        setPhoneNumber(data.phone)
        setConnectionStatus('connected')
        setQrCode(null)
        setQrRaw(null)
      })

      s.on('hdm:qr', (qr) => {
        console.log('hdm:qr received, length:', qr?.length)
        setQrCode(qr)
        setQrRaw(null)
        setConnectionStatus('qr')
      })

      s.on('hdm:qr_raw', (raw) => {
        console.log('hdm:qr_raw received, length:', raw?.length || raw?.qr?.length)
        if (typeof raw === 'string') {
          setQrRaw(raw)
        } else if (raw?.qr) {
          setQrRaw(raw.qr)
        }
        setQrCode(null)
        setConnectionStatus('qr')
      })

      s.on('hdm:disconnected', () => {
        console.log('hdm:disconnected')
        setWhatsappReady(false)
        setConnectionStatus('disconnected')
        setQrCode(null)
        setQrRaw(null)
      })

      s.on('hdm:auth_failure', (data) => {
        console.log('hdm:auth_failure', data)
        setWhatsappReady(false)
        setConnectionStatus('disconnected')
        setQrCode(null)
        setQrRaw(null)
      })

      return () => disconnectSocket()
    }
  }, [isAuthenticated])

  const connectWhatsApp = () => {
    console.log('Emitting hdm:connect')
    socket?.emit('hdm:connect')
  }
  
  const disconnectWhatsApp = () => {
    console.log('Emitting hdm:disconnect_wa')
    socket?.emit('hdm:disconnect_wa')
  }

  const sendMessage = (to, message) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject('Socket not connected')
      socket.emit('hdm:send_message', { to, message }, (res) => {
        if (res?.success) resolve(res)
        else reject(res?.error || 'Send failed')
      })
    })
  }

  const value = {
    socket,
    isConnected,
    whatsappReady,
    phoneNumber,
    connectionStatus,
    qrCode,
    qrRaw,
    connectWhatsApp,
    disconnectWhatsApp,
    sendMessage,
    requestCurrentQR,  // EXPOSED for QrPage
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}