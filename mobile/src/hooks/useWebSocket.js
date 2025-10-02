import {useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';
// Import robustly to avoid undefined due to interop
import webSocketServiceDefault, * as webSocketModule from '../services/websocket';
// import {webSocketTestService as webSocketServiceDefault} from '../services/websocket-test';
const webSocketService =
  (webSocketModule && webSocketModule.webSocketService) ||
  webSocketServiceDefault;
import config from '../config';

export const useWebSocket = () => {
  const auth = useSelector(state => state.auth);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Инициализируем WebSocket только если пользователь авторизован
    if (auth.logged && auth.token && !isInitialized.current) {
      console.log('Initializing WebSocket connection...');

      const wsConfig = {
        key: config.pusher?.key || 'app-key',
        cluster: config.pusher?.cluster || 'mt1',
        host: config.pusher?.host,
        port: config.pusher?.port,
        scheme: config.pusher?.scheme,
        baseURL: config.apiUrl,
        token: auth.token,
      };

      if (
        !webSocketService ||
        typeof webSocketService.initialize !== 'function'
      ) {
        console.warn('[WebSocket] Service is not ready');
        return;
      }
      webSocketService.initialize(wsConfig);

      // Подписываемся на канал пользователя
      if (auth.userData?.id) {
        webSocketService.subscribeToUserChannel(auth.userData.id);
      }

      // Подписываемся на административный канал если пользователь админ
      if (auth.userData?.type === 99) {
        // Admin type
        webSocketService.subscribeToAdminChannel();
      }

      isInitialized.current = true;
    }

    // Отключаемся при выходе пользователя
    if (!auth.logged && isInitialized.current) {
      console.log('User logged out, disconnecting WebSocket...');
      webSocketService?.disconnect?.();
      isInitialized.current = false;
    }

    // Cleanup при размонтировании компонента
    return () => {
      if (!auth.logged) {
        webSocketService?.disconnect?.();
        isInitialized.current = false;
      }
    };
  }, [auth.logged, auth.token, auth.userData?.id, auth.userData?.type]);

  return {
    isConnected: webSocketService?.isConnectedToWebSocket?.() || false,
    subscribeToOrderChannel: webSocketService?.subscribeToOrderChannel
      ? webSocketService.subscribeToOrderChannel.bind(webSocketService)
      : () => {},
    unsubscribeFromChannel: webSocketService?.unsubscribeFromChannel
      ? webSocketService.unsubscribeFromChannel.bind(webSocketService)
      : () => {},
  };
};
