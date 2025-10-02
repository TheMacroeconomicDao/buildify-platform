// Единый унифицированный API-клиент
import unifiedApi, {
  api,
  apiService,
  AuthManager,
  setApiToken as unifiedSetApiToken,
} from './unified-api';
import {handleErrorResponse} from './utils';

// Импортируем и экспортируем сервис подписок
import subscriptionsService from './subscriptionsService';

// Функция установки токена
const setApiToken = token => {
  AuthManager.setToken(token);
};

// Функция для повторных попыток API вызовов при сетевых ошибках
export const retryApiCall = async (apiCall, params = {}, maxRetries = 2) => {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await (typeof apiCall === 'function'
        ? apiCall(params)
        : apiCall);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`API call attempt ${i + 1} failed:`, error.message);

      // Если это последняя попытка или ошибка не сетевая, прекращаем
      if (i === maxRetries || !isNetworkError(error)) {
        break;
      }

      // Ждем перед повторной попыткой (экспоненциальная задержка)
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Проверка на сетевую ошибку
const isNetworkError = error => {
  return (
    error.message?.includes('Network Error') ||
    error.message?.includes('timeout') ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED'
  );
};

// Импортируем новую систему обработки ошибок
import errorHandler from './errorHandler';

export {
  // Основные API интерфейсы
  unifiedApi,
  apiService,
  api,

  // Управление авторизацией
  AuthManager,
  setApiToken,

  // Утилиты
  handleErrorResponse,

  // Новая система обработки ошибок
  errorHandler,

  // Сервисы
  subscriptionsService,
};

// Реферальные методы уже доступны через api.referrals из unified-api
