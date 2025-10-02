import {store} from '../redux/store/dev.js';
import {setApiToken} from './index';
import {performLogout} from '../utils/logoutHelper';

// Функция для разлогинивания пользователя
export const handleUnauthorized = () => {
  console.warn('Unauthorized request detected. Logging out user...');
  // Очищаем токен
  setApiToken(null);
  // Выполняем выход с правильной навигацией
  performLogout(store.dispatch);
};
