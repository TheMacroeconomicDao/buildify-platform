import { createNavigationContainerRef } from '@react-navigation/native';
import { StackActions, CommonActions, DrawerActions } from '@react-navigation/routers';

export const navigationRef = createNavigationContainerRef();

/**
 * Переход на указанный экран
 * @param {string} name - Имя экрана
 * @param {Object} params - Параметры для передачи на экран
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation attempted before navigator was ready: ', name);
    // Сохраняем навигацию для выполнения после инициализации
    _pendingNavigationQueue.push({ action: 'navigate', name, params });
  }
}

/**
 * Добавляет новый экран в стек навигации
 * @param {string} name - Имя экрана
 * @param {Object} params - Параметры для передачи на экран
 */
export function push(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.current?.dispatch(StackActions.push(name, params));
  } else {
    console.warn('Push attempted before navigator was ready: ', name);
    _pendingNavigationQueue.push({ action: 'push', name, params });
  }
}

/**
 * Возврат на предыдущий экран
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  } else if (!navigationRef.isReady()) {
    console.warn('GoBack attempted before navigator was ready');
  }
}

/**
 * Возврат на определенное количество экранов назад
 * @param {number} count - Количество экранов для возврата
 */
export function popToTop() {
  if (navigationRef.isReady()) {
    navigationRef.current?.dispatch(StackActions.popToTop());
  } else {
    console.warn('PopToTop attempted before navigator was ready');
  }
}

/**
 * Возврат на определенное количество экранов назад
 * @param {number} count - Количество экранов для возврата
 */
export function pop(count = 1) {
  if (navigationRef.isReady()) {
    navigationRef.current?.dispatch(StackActions.pop(count));
  } else {
    console.warn('Pop attempted before navigator was ready');
  }
}

/**
 * Полная замена стека навигации
 * @param {string} name - Имя экрана
 * @param {Object} params - Параметры для передачи на экран
 */
export function reset(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.current?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      })
    );
  } else {
    console.warn('Reset attempted before navigator was ready: ', name);
    _pendingNavigationQueue.push({ action: 'reset', name, params });
  }
}

/**
 * Открытие бокового меню (drawer)
 */
export function openDrawer() {
  if (navigationRef.isReady()) {
    navigationRef.current?.dispatch(DrawerActions.openDrawer());
  } else {
    console.warn('OpenDrawer attempted before navigator was ready');
  }
}

/**
 * Закрытие бокового меню (drawer)
 */
export function closeDrawer() {
  if (navigationRef.isReady()) {
    navigationRef.current?.dispatch(DrawerActions.closeDrawer());
  } else {
    console.warn('CloseDrawer attempted before navigator was ready');
  }
}

/**
 * Получение текущего маршрута навигации
 * @returns {Object} Текущий маршрут или null
 */
export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}

/**
 * Получение имени текущего экрана
 * @returns {string|null} Имя текущего экрана или null
 */
export function getCurrentRouteName() {
  const currentRoute = getCurrentRoute();
  return currentRoute?.name || null;
}

/**
 * Проверка, является ли указанный экран текущим
 * @param {string} routeName - Имя экрана для проверки
 * @returns {boolean} true если указанный экран является текущим
 */
export function isCurrentRoute(routeName) {
  return getCurrentRouteName() === routeName;
}

// Очередь навигационных действий, которые будут выполнены после инициализации навигатора
const _pendingNavigationQueue = [];

/**
 * Обработка отложенных навигационных действий
 * Вызывать этот метод после инициализации навигатора
 */
export function processPendingNavigation() {
  if (navigationRef.isReady() && _pendingNavigationQueue.length > 0) {
    _pendingNavigationQueue.forEach(item => {
      switch (item.action) {
        case 'navigate':
          navigate(item.name, item.params);
          break;
        case 'push':
          push(item.name, item.params);
          break;
        case 'reset':
          reset(item.name, item.params);
          break;
        default:
          break;
      }
    });
    // Очищаем очередь после обработки
    _pendingNavigationQueue.length = 0;
  }
}