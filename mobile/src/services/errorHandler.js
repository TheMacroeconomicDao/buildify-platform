import {notifyError, notifyWarning, showConfirm} from './notify';
import {useTranslation} from 'react-i18next';

/**
 * Централизованный сервис для обработки ошибок от бэкенда
 * Интегрируется с системой уведомлений для показа ошибок пользователю
 */

// Мапа кодов ошибок на типы уведомлений
const ERROR_SEVERITY_MAP = {
  400: 'error', // Bad Request
  401: 'warning', // Unauthorized
  403: 'warning', // Forbidden
  404: 'error', // Not Found
  422: 'error', // Validation Error
  429: 'warning', // Too Many Requests
  500: 'error', // Internal Server Error
  502: 'error', // Bad Gateway
  503: 'warning', // Service Unavailable
  504: 'error', // Gateway Timeout
};

// Стандартные сообщения для различных типов ошибок
const DEFAULT_ERROR_MESSAGES = {
  network: 'Проблема с подключением к интернету',
  timeout: 'Превышено время ожидания запроса',
  unauthorized: 'Необходимо войти в систему',
  forbidden: 'Недостаточно прав для выполнения операции',
  validation: 'Проверьте правильность введенных данных',
  server: 'Произошла ошибка на сервере',
  unknown: 'Произошла неизвестная ошибка',
};

/**
 * Основная функция для обработки ошибок от бэкенда
 * @param {Object} error - объект ошибки
 * @param {Object} options - дополнительные опции
 * @param {boolean} options.showNotification - показывать ли уведомление (по умолчанию true)
 * @param {boolean} options.logError - логировать ли ошибку в консоль (по умолчанию true)
 * @param {Function} options.onError - callback функция для дополнительной обработки
 * @param {Function} setErrors - функция для установки ошибок в форме (опционально)
 * @returns {Object} - объект с информацией об ошибке
 */
export const handleBackendError = (error, options = {}, setErrors = null) => {
  const {showNotification = true, logError = true, onError = null} = options;

  if (logError) {
    console.error('Backend Error:', error);
  }

  const errorInfo = parseError(error);

  // Показываем уведомление если требуется
  if (showNotification) {
    showErrorNotification(errorInfo);
  }

  // Устанавливаем ошибки в форме если передана функция setErrors
  if (setErrors && errorInfo.formErrors.length > 0) {
    setErrors(errorInfo.formErrors);
  }

  // Вызываем callback если передан
  if (onError && typeof onError === 'function') {
    onError(errorInfo);
  }

  return errorInfo;
};

/**
 * Парсит объект ошибки и извлекает полезную информацию
 * @param {Object} error - объект ошибки
 * @returns {Object} - структурированная информация об ошибке
 */
const parseError = error => {
  const errorInfo = {
    type: 'unknown',
    status: null,
    message: DEFAULT_ERROR_MESSAGES.unknown,
    originalError: error,
    formErrors: [],
    severity: 'error',
  };

  // Обработка нового формата API ошибок
  if (error?.success === false) {
    errorInfo.type = 'api';
    errorInfo.status = error.status || error.code;

    // Ошибки валидации в поле errors
    if (error.errors) {
      errorInfo.type = 'validation';
      errorInfo.severity = 'error';
      errorInfo.message = 'Ошибки валидации данных';

      try {
        const validationErrors = error.errors;
        errorInfo.formErrors = Object.entries(validationErrors).map(
          ([path, messages]) => ({
            path,
            message: Array.isArray(messages) ? messages[0] : messages,
          }),
        );
      } catch (e) {
        console.error('Failed to parse error.errors:', e);
        errorInfo.formErrors = [
          {
            path: 'api',
            message: error.message || DEFAULT_ERROR_MESSAGES.validation,
          },
        ];
      }
    }
    // Прямое сообщение об ошибке
    else if (error.message) {
      if (typeof error.message === 'object') {
        // Объект с ошибками валидации
        errorInfo.type = 'validation';
        try {
          errorInfo.formErrors = Object.entries(error.message).map(
            ([path, messages]) => ({
              path,
              message: Array.isArray(messages) ? messages[0] : messages,
            }),
          );
          errorInfo.message = 'Ошибки валидации данных';
        } catch (e) {
          console.error('Failed to parse error.message object:', e);
          errorInfo.formErrors = [
            {path: 'api', message: DEFAULT_ERROR_MESSAGES.validation},
          ];
          errorInfo.message = DEFAULT_ERROR_MESSAGES.validation;
        }
      } else {
        // Строковое сообщение
        errorInfo.message = error.message;
        errorInfo.formErrors = [{path: 'api', message: error.message}];
      }
    }
    // Сообщение в структуре result
    else if (error.result?.message) {
      errorInfo.message = error.result.message;
      errorInfo.formErrors = [{path: 'api', message: error.result.message}];
    }
  }

  // Обработка HTTP ошибок
  else if (error.response) {
    errorInfo.type = 'http';
    errorInfo.status = error.response.status;
    errorInfo.severity = ERROR_SEVERITY_MAP[error.response.status] || 'error';

    const responseData = error.response.data;

    if (responseData?.errors) {
      errorInfo.type = 'validation';
      errorInfo.formErrors = Object.entries(responseData.errors).map(
        ([path, messages]) => ({
          path,
          message: Array.isArray(messages) ? messages[0] : messages,
        }),
      );
      errorInfo.message = 'Ошибки валидации данных';
    } else if (responseData?.error) {
      errorInfo.message = responseData.error;
      errorInfo.formErrors = [{path: 'api', message: responseData.error}];
    } else if (responseData?.message) {
      if (typeof responseData.message === 'object') {
        errorInfo.type = 'validation';
        errorInfo.formErrors = Object.entries(responseData.message).map(
          ([path, messages]) => ({
            path,
            message: Array.isArray(messages) ? messages[0] : messages,
          }),
        );
        errorInfo.message = 'Ошибки валидации данных';
      } else {
        errorInfo.message = responseData.message;
        errorInfo.formErrors = [{path: 'api', message: responseData.message}];
      }
    } else {
      errorInfo.message = getDefaultMessageForStatus(error.response.status);
      errorInfo.formErrors = [{path: 'api', message: errorInfo.message}];
    }
  }

  // Обработка сетевых ошибок
  else if (
    error.message?.includes('Network Error') ||
    error.message?.includes('timeout') ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED'
  ) {
    errorInfo.type = 'network';
    errorInfo.severity = 'warning';

    if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
      errorInfo.message = DEFAULT_ERROR_MESSAGES.timeout;
    } else {
      errorInfo.message = DEFAULT_ERROR_MESSAGES.network;
    }

    errorInfo.formErrors = [{path: 'api', message: errorInfo.message}];
  }

  // Обработка ошибок с JSON методом (устаревший формат)
  else if (error.json && typeof error.json === 'function') {
    errorInfo.type = 'legacy';
    // Для legacy формата мы не можем синхронно получить данные
    // Возвращаем базовую информацию, а детали будут обработаны асинхронно
    errorInfo.message = error.message || DEFAULT_ERROR_MESSAGES.unknown;
    errorInfo.formErrors = [{path: 'api', message: errorInfo.message}];
  }

  // Простая ошибка с сообщением
  else if (error.message) {
    errorInfo.message = error.message;
    errorInfo.formErrors = [{path: 'api', message: error.message}];
  }

  return errorInfo;
};

/**
 * Показывает уведомление об ошибке пользователю
 * @param {Object} errorInfo - информация об ошибке
 */
const showErrorNotification = errorInfo => {
  const title = getErrorTitle(errorInfo.type, errorInfo.status);

  if (errorInfo.severity === 'warning') {
    notifyWarning(title, errorInfo.message, {
      autoClose: 4000, // Предупреждения показываем дольше
    });
  } else {
    notifyError(title, errorInfo.message, {
      autoClose: 5000, // Ошибки показываем еще дольше
    });
  }
};

/**
 * Получает заголовок для уведомления в зависимости от типа ошибки
 * @param {string} type - тип ошибки
 * @param {number} status - HTTP статус
 * @returns {string} - заголовок уведомления
 */
const getErrorTitle = (type, status) => {
  switch (type) {
    case 'network':
      return 'Проблема с сетью';
    case 'validation':
      return 'Ошибка валидации';
    case 'http':
      if (status === 401) return 'Требуется авторизация';
      if (status === 403) return 'Доступ запрещен';
      if (status === 404) return 'Не найдено';
      if (status === 429) return 'Слишком много запросов';
      if (status >= 500) return 'Ошибка сервера';
      return 'Ошибка запроса';
    case 'api':
      return 'Ошибка API';
    default:
      return 'Ошибка';
  }
};

/**
 * Получает стандартное сообщение для HTTP статуса
 * @param {number} status - HTTP статус
 * @returns {string} - сообщение об ошибке
 */
const getDefaultMessageForStatus = status => {
  switch (status) {
    case 400:
      return 'Некорректный запрос';
    case 401:
      return DEFAULT_ERROR_MESSAGES.unauthorized;
    case 403:
      return DEFAULT_ERROR_MESSAGES.forbidden;
    case 404:
      return 'Запрашиваемый ресурс не найден';
    case 422:
      return DEFAULT_ERROR_MESSAGES.validation;
    case 429:
      return 'Слишком много запросов, попробуйте позже';
    case 500:
      return DEFAULT_ERROR_MESSAGES.server;
    case 502:
      return 'Сервер временно недоступен';
    case 503:
      return 'Сервис временно недоступен';
    case 504:
      return 'Превышено время ожидания сервера';
    default:
      return DEFAULT_ERROR_MESSAGES.unknown;
  }
};

/**
 * Обертка для handleErrorResponse с интеграцией в notification систему
 * @param {Object} error - объект ошибки
 * @param {Function} setErrors - функция для установки ошибок в форме
 * @param {Object} options - дополнительные опции
 */
export const handleErrorResponseWithNotifications = (
  error,
  setErrors,
  options = {},
) => {
  return handleBackendError(error, options, setErrors);
};

/**
 * Функция для обработки legacy ошибок с JSON методом
 * @param {Object} error - объект ошибки
 * @param {Function} setErrors - функция для установки ошибок в форме
 * @param {Object} options - дополнительные опции
 */
export const handleLegacyJsonError = async (error, setErrors, options = {}) => {
  if (!error.json || typeof error.json !== 'function') {
    return handleBackendError(error, options, setErrors);
  }

  try {
    const data = await error.json();
    console.log('Legacy error data from json():', data);

    const legacyError = {
      success: false,
      message: data.message,
      errors: data.errors,
      error: data.error,
      status: error.status,
    };

    return handleBackendError(legacyError, options, setErrors);
  } catch (jsonError) {
    console.error('Failed to parse legacy error response as JSON:', jsonError);

    const fallbackError = {
      success: false,
      message: error.message || DEFAULT_ERROR_MESSAGES.unknown,
      status: error.status,
    };

    return handleBackendError(fallbackError, options, setErrors);
  }
};

/**
 * Обрабатывает ошибки подписки и показывает соответствующий диалог
 * @param {Object} error - объект ошибки
 * @param {Object} navigation - объект навигации React Navigation
 * @param {Function} t - функция перевода
 * @param {Function} subscriptionsService - сервис для обновления данных подписки (опционально)
 * @returns {boolean} - true если ошибка была обработана как ошибка подписки
 */
export const handleSubscriptionError = (
  error,
  navigation,
  t,
  subscriptionsService = null,
) => {
  // Пробуем разные способы извлечения данных об ошибке
  const status = error.response?.status || error.status;
  const errorData = error.response?.data || error.data;

  // Дополнительные попытки извлечения сообщения об ошибке
  let errorMessage = errorData?.error || errorData?.message;

  // Если не нашли в стандартных местах, пробуем другие варианты
  if (!errorMessage) {
    // Проверяем в config.data (иногда ответ может быть там)
    if (error.config?.data) {
      try {
        const configData = JSON.parse(error.config.data);
        errorMessage = configData?.error || configData?.message;
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }

    // Проверяем в request._response (для React Native)
    if (error.request?._response) {
      try {
        const responseData = JSON.parse(error.request._response);
        errorMessage = responseData?.error || responseData?.message;
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }

    // Последняя попытка - общее сообщение
    if (!errorMessage) {
      errorMessage = error.message;
    }
  }

  if (status === 403) {
    const isSubscriptionError =
      errorMessage === 'Subscription required to respond to orders' ||
      errorMessage === 'Subscription expired' ||
      errorMessage === 'Subscription required to take orders' ||
      errorMessage ===
        'Order response limit reached for current subscription. Upgrade your plan to respond to more orders.' ||
      errorMessage?.includes('Order response limit reached') ||
      errorMessage?.includes('Subscription');

    if (isSubscriptionError) {
      // Более информативные сообщения об ошибках подписки
      let title, message;

      if (errorMessage?.includes('Order response limit reached')) {
        title = t('Response Limit Reached');
        message = t(
          'You have reached your response limit for the current subscription period. Upgrade your plan to respond to more orders.',
        );
      } else if (errorMessage === 'Subscription expired') {
        title = t('Subscription Expired');
        message = t(
          'Your subscription has expired and you cannot respond to orders. Please renew your subscription to continue working.',
        );
      } else if (
        errorMessage === 'Subscription required to respond to orders'
      ) {
        title = t('Subscription Required');
        message = t(
          'You need an active subscription to respond to orders. Without a subscription, you cannot send proposals to customers.',
        );
      } else if (errorMessage === 'Subscription required to take orders') {
        title = t('Subscription Required');
        message = t(
          'You need an active subscription to take orders. Please purchase a subscription to start working.',
        );
      } else {
        title = t('Subscription Required');
        message = t(
          'You need an active subscription to perform this action. Please check your subscription status.',
        );
      }

      // Автоматически обновляем данные подписки при ошибке 403
      if (subscriptionsService && subscriptionsService.getCurrentSubscription) {
        subscriptionsService
          .getCurrentSubscription()
          .catch(subscriptionError => {
            console.error(
              'Ошибка при автоматическом обновлении данных подписки:',
              subscriptionError,
            );
          });
      }

      // Показываем toast уведомление об ошибке подписки
      notifyError(title, message);

      showConfirm({
        title,
        message,
        onConfirm: () => {
          navigation.navigate('Subscription');
        },
        onCancel: () => {}, // Отмена - ничего не делаем
        confirmText: errorMessage?.includes('Order response limit reached')
          ? t('Upgrade Plan')
          : t('View Plans'),
        cancelText: t('Cancel'),
      });

      return true; // Ошибка была обработана
    }
  }

  return false; // Ошибка не является ошибкой подписки
};

export default {
  handleBackendError,
  handleErrorResponseWithNotifications,
  handleLegacyJsonError,
  handleSubscriptionError,
  DEFAULT_ERROR_MESSAGES,
};
