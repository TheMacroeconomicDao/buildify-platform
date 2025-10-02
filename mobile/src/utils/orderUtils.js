import styles from '../styles';
import {useTranslation} from 'react-i18next';

/**
 * Конфигурация статусов заказов
 * @param {number} status - Статус заказа
 * @returns {Object} Объект с текстом и цветом статуса
 */
export const getStatusConfig = (status, t) => {
  const statusMap = {
    0: {text: t('Searching for performer'), color: styles.colors.primary},
    1: {text: t('Cancelled'), color: styles.colors.red},
    2: {text: t('Selecting executor'), color: styles.colors.primary},
    3: {text: t('Executor selected'), color: '#FF9500'},
    4: {text: t('In work'), color: styles.colors.green},
    5: {text: t('Awaiting confirmation'), color: styles.colors.green},
    6: {text: t('Rejected'), color: styles.colors.red},
    7: {text: t('Closed'), color: styles.colors.actionGray},
    8: {text: t('Completed'), color: styles.colors.green},
    9: {text: t('Deleted'), color: styles.colors.red},
    10: {text: t('Mediator: Clarifying details'), color: styles.colors.primary},
    11: {text: t('Mediator: Executor search'), color: styles.colors.primary},
    12: {text: t('Mediator: Project execution'), color: styles.colors.green},
    13: {text: t('Mediator: Archived'), color: styles.colors.actionGray},
  };
  return (
    statusMap[status] || {
      text: `Status ${status}`,
      color: styles.colors.actionGray,
    }
  );
};

/**
 * Форматирование цены для отображения
 * @param {string|number} amount - Сумма для форматирования
 * @returns {string} Отформатированная цена
 */
export const formatPrice = amount => {
  if (!amount || amount === 0) return '~0 AED';

  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '~0 AED';

  return `~${new Intl.NumberFormat('en-US').format(numericAmount)} AED`;
};

/**
 * Получение количества заявок из данных заказа
 * @param {Object} order - Объект заказа
 * @returns {number} Количество заявок
 */
export const getApplicationsCount = order => {
  // Если есть реальное количество откликов, используем его
  if (order.responses_count !== undefined) {
    return order.responses_count;
  }

  // Fallback для старых данных - если статус 0 (поиск исполнителя), то 0 откликов
  return order.status === 0 ? 0 : 0;
};

/**
 * Константы для аватаров исполнителей
 */
export const PLACEHOLDER_AVATARS = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/men/4.jpg',
];
