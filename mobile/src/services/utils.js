import has from 'lodash/has';
import get from 'lodash/get';
import {useCallback, useEffect, useRef} from 'react';
import {debounce} from 'lodash';

export function formatPrice(x) {
  var parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

export function useLazyEffect(effect, deps = [], wait = 300) {
  const cleanUp = useRef();
  const effectRef = useRef();
  const updatedEffect = useCallback(effect, deps);
  effectRef.current = updatedEffect;
  const lazyEffect = useCallback(
    debounce(() => {
      cleanUp.current = effectRef.current?.();
    }, wait),
    [],
  );
  useEffect(lazyEffect, deps);
  useEffect(() => {
    return () => {
      cleanUp.current instanceof Function ? cleanUp.current() : undefined;
    };
  }, []);
}

export const stripTags = str => {
  if (!str) {
    return str;
  }
  return str
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/(<([^>]+)>)/gi, '')
    .trimLeft();
};

export const clearText = str => {
  return str.replaceAll(/&nbsp;/g, '');
};

export function objectToArray(object) {
  return Object.keys(object).map(i => object[i]);
}

// Импортируем новую систему обработки ошибок
import {
  handleErrorResponseWithNotifications,
  handleLegacyJsonError,
} from './errorHandler';

export const handleErrorResponse = (error, setErrors, options = {}) => {
  console.log('Processing error response:', error);

  // Используем новую систему обработки ошибок с уведомлениями
  // По умолчанию показываем уведомления, но можно отключить через options
  const defaultOptions = {
    showNotification: true,
    logError: true,
    ...options,
  };

  // Проверка на формат с JSON методом (устаревший формат)
  if (error.json && typeof error.json === 'function') {
    // Асинхронная обработка legacy ошибок
    handleLegacyJsonError(error, setErrors, defaultOptions);
    return;
  }

  // Обработка всех остальных типов ошибок через новую систему
  handleErrorResponseWithNotifications(error, setErrors, defaultOptions);
};

export const removeHtmlTags = text => {
  return (
    text?.replaceAll(/<\/?[^>]+(>|$)/g, '').replaceAll('&nbsp;', ' ') || ''
  );
};

/**
 * Форматирование даты для отображения
 * @param {string|Date} date - Дата для форматирования
 * @returns {string} Отформатированная дата
 */
export const formatDate = date => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};
