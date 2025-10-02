import React from 'react';
import {useWebSocket} from '../hooks/useWebSocket';

const WebSocketProvider = ({children}) => {
  // Инициализируем WebSocket соединение
  useWebSocket();

  // Просто рендерим детей, WebSocket работает в фоне
  return children;
};

export default WebSocketProvider;
