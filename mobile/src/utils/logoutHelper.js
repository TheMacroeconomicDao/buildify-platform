import {navigationRef} from '../services/RootNavigation';

/**
 * Централизованная функция для выхода из системы
 * Сбрасывает состояние Redux и переводит на экран Loading
 */
export const performLogout = dispatch => {
  // Сбрасываем состояние auth
  dispatch({type: 'LOG_OUT'});

  // Переходим на экран Loading для правильной навигации
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{name: 'Loading'}],
    });
  }
};
