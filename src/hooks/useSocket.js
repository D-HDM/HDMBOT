import { useEffect, useState } from 'react';
import { initSocket, getSocket } from '../services/socket';

export const useSocket = (eventName, handler) => {
  const socket = getSocket();
  
  useEffect(() => {
    if (!socket) return;
    socket.on(eventName, handler);
    return () => socket.off(eventName, handler);
  }, [socket, eventName, handler]);
};

export const useSocketEmit = () => {
  const socket = getSocket();
  return (event, data, callback) => {
    if (socket) socket.emit(event, data, callback);
  };
};

export const useSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return isConnected;
};