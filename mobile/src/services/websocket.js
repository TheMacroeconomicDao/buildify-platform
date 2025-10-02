import Pusher from 'pusher-js/react-native';
import {store} from '../redux/store/dev';
import {notifyInfo, notifySuccess, notifyWarning, notifyError} from './notify';

class WebSocketService {
  constructor() {
    this.pusher = null;
    this.channels = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Инициализация WebSocket соединения
   */
  initialize(config) {
    try {
      const pusherConfig = {
        authEndpoint: `${config.baseURL}/api/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/json',
          },
        },
        enabledTransports: ['ws', 'wss'],
      };

      // Always provide a cluster to satisfy Pusher option requirements
      // (safe no-op for local wsHost usage)
      pusherConfig.cluster = config.cluster || 'mt1';

      // Если есть host, используем локальный Soketi
      if (config.host) {
        pusherConfig.wsHost = config.host;
        pusherConfig.wsPort = config.port || 6001;
        pusherConfig.wssPort = config.port || 6001;
        pusherConfig.forceTLS = config.scheme === 'https';
        pusherConfig.enabledTransports = ['ws'];
      }

      this.pusher = new Pusher(config.key, pusherConfig);

      this.setupEventListeners();
      console.log('WebSocket service initialized');
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Настройка базовых слушателей событий
   */
  setupEventListeners() {
    if (!this.pusher) return;

    this.pusher.connection.bind('connected', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    });

    this.pusher.connection.bind('error', error => {
      console.error('WebSocket error:', error);
      this.handleConnectionError();
    });
  }

  /**
   * Обработка ошибок соединения
   */
  handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

      setTimeout(() => {
        console.log(
          `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        );
        this.reconnect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Переподключение
   */
  reconnect() {
    if (this.pusher) {
      this.pusher.connect();
    }
  }

  /**
   * Подписка на канал пользователя
   */
  subscribeToUserChannel(userId) {
    if (!this.pusher || !userId) return;

    const channelName = `private-user.${userId}`;

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);

    // Слушаем уведомления
    channel.bind('notification', data => {
      this.handleUserNotification(data);
    });

    console.log(`Subscribed to user channel: ${channelName}`);
    return channel;
  }

  /**
   * Подписка на канал заказа
   */
  subscribeToOrderChannel(orderId) {
    if (!this.pusher || !orderId) return;

    const channelName = `private-order.${orderId}`;

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);

    // Слушаем обновления заказа
    channel.bind('order.updated', data => {
      this.handleOrderUpdate(data);
    });

    console.log(`Subscribed to order channel: ${channelName}`);
    return channel;
  }

  /**
   * Подписка на административный канал
   */
  subscribeToAdminChannel() {
    if (!this.pusher) return;

    const channelName = 'private-admin';

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);

    // Слушаем административные уведомления
    channel.bind('notification', data => {
      this.handleAdminNotification(data);
    });

    console.log(`Subscribed to admin channel: ${channelName}`);
    return channel;
  }

  /**
   * Обработка пользовательских уведомлений
   */
  handleUserNotification(data) {
    console.log('Received user notification:', data);

    const {type, title, message} = data;

    // Показываем уведомление в зависимости от типа
    switch (type) {
      case 'order_status_changed':
        notifyInfo(title, message);
        // Обновляем данные заказов в Redux
        this.updateOrdersInStore();
        break;

      case 'executor_assigned':
      case 'mediator_assigned':
        notifySuccess(title, message);
        this.updateOrdersInStore();
        break;

      case 'payment_success':
        notifySuccess(title, message);
        break;

      case 'payment_failed':
        notifyError(title, message);
        break;

      case 'verification_status_changed':
        if (data.data?.new_status === 1) {
          // Approved
          notifySuccess(title, message);
        } else if (data.data?.new_status === 2) {
          // Rejected
          notifyWarning(title, message);
        } else {
          notifyInfo(title, message);
        }
        // Обновляем данные пользователя
        this.updateUserDataInStore();
        // Диспатчим специальное действие для обновления статуса верификации
        store.dispatch({
          type: 'VERIFICATION_STATUS_UPDATED',
          payload: {
            oldStatus: data.data?.old_status,
            newStatus: data.data?.new_status,
            comment: data.data?.verification_comment,
            verifiedAt: data.data?.verified_at,
          },
        });
        break;

      case 'license_uploaded':
        notifySuccess(title, message);
        // Обновляем данные пользователя для отображения нового статуса
        this.updateUserDataInStore();
        break;

      default:
        notifyInfo(title, message);
    }

    // Увеличиваем счетчик непрочитанных уведомлений
    this.incrementNotificationCount();
  }

  /**
   * Обработка обновлений заказа
   */
  handleOrderUpdate(data) {
    console.log('Received order update:', data);

    // Обновляем данные заказа в Redux store
    if (data.order) {
      store.dispatch({
        type: 'UPDATE_ORDER',
        payload: data.order,
      });
    }

    // Показываем уведомление если есть
    if (data.title && data.message) {
      notifyInfo(data.title, data.message);
    }
  }

  /**
   * Обработка административных уведомлений
   */
  handleAdminNotification(data) {
    console.log('Received admin notification:', data);

    const {type, title, message} = data;

    // Показываем уведомление
    switch (type) {
      case 'new_user':
      case 'new_order':
        notifyInfo(title, message);
        break;

      case 'new_complaint':
        notifyWarning(title, message);
        break;

      case 'new_license_verification':
        notifyInfo(title, message);
        // Можно добавить обновление списка лицензий для проверки
        break;

      case 'verification_completed':
        if (data.data?.new_status === 1) {
          // Approved
          notifySuccess(title, message);
        } else if (data.data?.new_status === 2) {
          // Rejected
          notifyWarning(title, message);
        } else {
          notifyInfo(title, message);
        }
        break;

      default:
        notifyInfo(title, message);
    }
  }

  /**
   * Обновление данных заказов в store
   */
  updateOrdersInStore() {
    // Диспатчим действие для обновления заказов
    store.dispatch({
      type: 'REFRESH_ORDERS_REQUESTED',
    });
  }

  /**
   * Обновление данных пользователя в store
   */
  updateUserDataInStore() {
    // Диспатчим действие для обновления данных пользователя
    store.dispatch({
      type: 'REFRESH_USER_DATA_REQUESTED',
    });
  }

  /**
   * Увеличение счетчика уведомлений
   */
  incrementNotificationCount() {
    store.dispatch({
      type: 'INCREMENT_NOTIFICATION_COUNT',
    });
  }

  /**
   * Отписка от канала
   */
  unsubscribeFromChannel(channelName) {
    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName);
      this.pusher?.unsubscribe(channelName);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Отписка от всех каналов
   */
  unsubscribeFromAllChannels() {
    this.channels.forEach((channel, channelName) => {
      this.pusher?.unsubscribe(channelName);
    });
    this.channels.clear();
    console.log('Unsubscribed from all channels');
  }

  /**
   * Отключение WebSocket
   */
  disconnect() {
    if (this.pusher) {
      this.unsubscribeFromAllChannels();
      this.pusher.disconnect();
      this.pusher = null;
      this.isConnected = false;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Проверка состояния соединения
   */
  isConnectedToWebSocket() {
    return this.isConnected && this.pusher?.connection?.state === 'connected';
  }
}

// Экспортируем singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
