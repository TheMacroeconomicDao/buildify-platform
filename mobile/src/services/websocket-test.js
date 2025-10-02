import {store} from '../redux/store/dev';
import {notifyInfo, notifySuccess, notifyWarning, notifyError} from './notify';

class WebSocketTestService {
  constructor() {
    this.isConnected = false;
    this.testMode = true;
  }

  /**
   * Инициализация тестового WebSocket соединения
   */
  initialize(config) {
    console.log('WebSocket Test Service initialized with config:', config);
    this.isConnected = true;

    // Обновляем Redux состояние
    store.dispatch({
      type: 'WEBSOCKET_CONNECTED',
    });

    // Симулируем подключение через 1 секунду
    setTimeout(() => {
      console.log('WebSocket Test Service connected');
      // Убираем автоматические уведомления - будем тестировать только через кнопки
      // this.simulateTestNotifications();
    }, 1000);
  }

  /**
   * Симуляция тестовых уведомлений
   */
  simulateTestNotifications() {
    // Симулируем уведомление о верификации через 3 секунды
    setTimeout(() => {
      this.handleUserNotification({
        type: 'verification_status_changed',
        title: 'Test: Verification Rejected',
        message: 'This is a test notification about verification rejection',
        data: {
          user_id: 3,
          old_status: 0,
          new_status: 2,
          old_status_label: 'Under Review',
          new_status_label: 'Rejected',
          verification_comment: 'Test rejection reason',
          verified_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }, 3000);

    // Симулируем уведомление о загрузке лицензии через 6 секунд
    setTimeout(() => {
      this.handleUserNotification({
        type: 'license_uploaded',
        title: 'Test: License Uploaded',
        message: 'This is a test notification about license upload',
        data: {
          user_id: 3,
          license_file_path: '/storage/licenses/test.pdf',
          verification_status: 0,
          uploaded_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }, 6000);
  }

  /**
   * Подписка на канал пользователя (тестовая версия)
   */
  subscribeToUserChannel(userId) {
    console.log(`Test: Subscribed to user channel: user.${userId}`);
    return {test: true};
  }

  /**
   * Подписка на канал заказа (тестовая версия)
   */
  subscribeToOrderChannel(orderId) {
    console.log(`Test: Subscribed to order channel: order.${orderId}`);
    return {test: true};
  }

  /**
   * Подписка на административный канал (тестовая версия)
   */
  subscribeToAdminChannel() {
    console.log('Test: Subscribed to admin channel');
    return {test: true};
  }

  /**
   * Обработка пользовательских уведомлений (копия из основного сервиса)
   */
  handleUserNotification(data) {
    console.log('Test: Received user notification:', data);
    console.log('Test: About to show notification with type:', data.type);

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
        console.log(
          'Test: Processing verification_status_changed, new_status:',
          data.data?.new_status,
        );
        if (data.data?.new_status === 1) {
          // Approved
          console.log(
            'Test: Showing success notification for approved verification',
          );
          notifySuccess(title, message);
        } else if (data.data?.new_status === 2) {
          // Rejected
          console.log(
            'Test: Showing warning notification for rejected verification',
          );
          notifyWarning(title, message);
        } else {
          console.log(
            'Test: Showing info notification for other verification status',
          );
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
        console.log('Test: Processing license_uploaded notification');
        console.log(
          'Test: License uploaded, new verification_status:',
          data.data?.verification_status,
        );
        notifySuccess(title, message);
        // When uploading license, status should reset to "Under Review" (0)
        // Используем статус из данных уведомления или по умолчанию 0
        const newStatus = data.data?.verification_status ?? 0;
        store.dispatch({
          type: 'VERIFICATION_STATUS_UPDATED',
          payload: {
            oldStatus: data.data?.old_status || 2, // Используем переданный старый статус
            newStatus: newStatus, // Используем статус из backend (должен быть 0)
            comment: null, // Очищаем комментарий при загрузке новой лицензии
            verifiedAt: null,
          },
        });
        console.log('Test: Dispatched VERIFICATION_STATUS_UPDATED:', {
          oldStatus: data.data?.old_status || 2,
          newStatus: newStatus,
          comment: null,
        });
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
   * Отписка от канала (тестовая версия)
   */
  unsubscribeFromChannel(channelName) {
    console.log(`Test: Unsubscribed from channel: ${channelName}`);
  }

  /**
   * Отписка от всех каналов (тестовая версия)
   */
  unsubscribeFromAllChannels() {
    console.log('Test: Unsubscribed from all channels');
  }

  /**
   * Отключение WebSocket (тестовая версия)
   */
  disconnect() {
    console.log('Test: WebSocket disconnected');
    this.isConnected = false;

    // Обновляем Redux состояние
    store.dispatch({
      type: 'WEBSOCKET_DISCONNECTED',
    });
  }

  /**
   * Проверка состояния соединения
   */
  isConnectedToWebSocket() {
    return this.isConnected;
  }

  /**
   * Ручная отправка тестового уведомления
   */
  sendTestVerificationRejected() {
    console.log('Test: sendTestVerificationRejected called');
    this.handleUserNotification({
      type: 'verification_status_changed',
      title: 'Verification Rejected',
      message:
        'Unfortunately, your verification was rejected. Reason: Document is unreadable, please upload a better quality photo',
      data: {
        user_id: 3,
        old_status: 0,
        new_status: 2,
        old_status_label: 'Under Review',
        new_status_label: 'Rejected',
        verification_comment:
          'Document is unreadable, please upload a better quality photo',
        verified_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Ручная отправка тестового уведомления об одобрении
   */
  sendTestVerificationApproved() {
    console.log('Test: sendTestVerificationApproved called');
    this.handleUserNotification({
      type: 'verification_status_changed',
      title: 'Verification Approved!',
      message:
        'Congratulations! Your verification has been successfully completed. You can now accept orders',
      data: {
        user_id: 3,
        old_status: 0,
        new_status: 1,
        old_status_label: 'Under Review',
        new_status_label: 'Approved',
        verification_comment: null,
        verified_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// Экспортируем singleton instance
export const webSocketTestService = new WebSocketTestService();
export default webSocketTestService;
