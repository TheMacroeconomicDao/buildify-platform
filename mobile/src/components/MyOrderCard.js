import React from 'react';
import {View, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';
import styles from '../styles';
import config, {getAvatarUrl} from '../config';
import {formatPrice} from '../utils/orderUtils';

const MyOrderCard = ({order, onPress}) => {
  const {t} = useTranslation();

  if (!order) {
    return null;
  }

  // Форматируем дату
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Получаем аватар исполнителя (если есть)
  const executorAvatar = order.executor?.avatar
    ? {uri: getAvatarUrl(order.executor.avatar)}
    : null;

  // Теги категорий
  const renderTags = () => {
    const tags = [];

    // Используем label поля из API вместо ключей
    if (order.work_direction_label) {
      tags.push(order.work_direction_label);
    }

    if (order.work_type_label) {
      tags.push(order.work_type_label);
    }

    if (order.category) {
      tags.push(order.category);
    }

    return tags.slice(0, 3).map((tag, index) => (
      <View key={index} style={localStyles.tag}>
        <Text style={localStyles.tagText}>{tag}</Text>
      </View>
    ));
  };

  // Статусы заказов
  const orderStatuses = {
    0: t('Searching for performer'), // SearchExecutor - Поиск исполнителя
    1: t('Cancelled'), // Cancelled - Отменён
    2: t('Selecting executor'), // SelectingExecutor - Выбор исполнителя
    3: t('Executor selected'), // ExecutorSelected - Исполнитель выбран
    4: t('In work'), // InWork - В работе
    5: t('Awaiting confirmation'), // AwaitingConfirmation - Ждёт подтверждения
    6: t('Rejected'), // Rejected - Отклонён
    7: t('Closed'), // Closed - Закрыт
    8: t('Completed'), // Completed - Завершён
    9: t('Deleted'), // Deleted - Удалён
    10: t('Mediator: Clarifying details'), // MediatorStep1 - Этап уточнения деталей
    11: t('Mediator: Executor search'), // MediatorStep2 - Поиск исполнителя
    12: t('Mediator: Project execution'), // MediatorStep3 - Реализация проекта
    13: t('Mediator: Archived'), // MediatorArchived - Архивирован посредником
  };

  // Цвета статусов
  const getStatusColor = status => {
    switch (status) {
      case 0:
        return '#6B7280'; // серый - поиск исполнителя
      case 1:
        return styles.colors.red; // красный - отменён
      case 2:
        return '#6366F1'; // индиго - выбор исполнителя
      case 3:
        return styles.colors.warning; // оранжевый - исполнитель выбран
      case 4:
        return styles.colors.info; // синий - в работе
      case 5:
        return '#10B981'; // изумрудный - ждёт подтверждения
      case 6:
        return styles.colors.red; // красный - отклонён
      case 7:
        return styles.colors.success; // зеленый - закрыт
      case 8:
        return styles.colors.green; // зеленый - завершён
      case 9:
        return styles.colors.red; // красный - удалён
      case 10:
        return styles.colors.primary; // синий - посредник: детали
      case 11:
        return styles.colors.primary; // синий - посредник: поиск исполнителя
      case 12:
        return styles.colors.green; // зеленый - посредник: реализация
      case 13:
        return styles.colors.actionGray; // серый - посредник: архивирован
      default:
        return styles.colors.textSecondary; // серый по умолчанию
    }
  };

  // Определяем, нужно ли показывать бейдж новых откликов
  const shouldShowResponsesBadge = () => {
    // Показываем бейдж только для заказчиков и если есть отклики
    // Статусы где могут быть новые отклики: 0 (поиск исполнителя), 2 (выбор исполнителя)
    const responsesCount =
      order.responses_count || order.order_responses_count || 0;
    const hasResponses = responsesCount > 0;
    const canHaveNewResponses = [0, 2].includes(order.status);

    return hasResponses && canHaveNewResponses;
  };

  return (
    <TouchableOpacity style={localStyles.card} onPress={onPress}>
      {/* Бейдж новых откликов */}
      {shouldShowResponsesBadge() && (
        <View style={localStyles.responsesBadge}>
          <Text style={localStyles.responsesBadgeText}>
            {order.responses_count || order.order_responses_count || 0}
          </Text>
        </View>
      )}

      {/* Заголовок с статусом и датой */}
      <View style={localStyles.header}>
        <View
          style={[
            localStyles.statusBadge,
            {backgroundColor: getStatusColor(order.status)},
          ]}>
          <Text style={localStyles.statusBadgeText}>
            {orderStatuses[order.status] || t('Unknown status')}
          </Text>
        </View>
        <Text
          style={[
            localStyles.date,
            shouldShowResponsesBadge() && localStyles.dateWithBadge,
          ]}>
          {formatDate(order.created_at)}
        </Text>
      </View>

      {/* Название заказа */}
      <Text style={localStyles.orderTitle}>{order.title}</Text>

      {/* Информация об исполнителе (если есть) */}
      {order.executor && (
        <View style={localStyles.executorSection}>
          <View style={localStyles.executorInfo}>
            {executorAvatar ? (
              <Image source={executorAvatar} style={localStyles.avatar} />
            ) : (
              <View style={localStyles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            )}

            <View style={localStyles.executorDetails}>
              <Text style={localStyles.executorName}>
                {order.executor.name || t('Executor')}
              </Text>

              <View style={localStyles.executorMeta}>
                {/* Рейтинг */}
                <View style={localStyles.rating}>
                  <Ionicons name="star" size={16} color="#FFEA49" />
                  <Text style={localStyles.ratingText}>
                    {order.executor.rating || '4'}
                  </Text>
                </View>

                {/* Количество отзывов */}
                <View style={localStyles.reviews}>
                  <MaterialIcons name="people" size={16} color="#8A94A0" />
                  <Text style={localStyles.reviewsText}>
                    {order.executor.reviews_count || '150'} {t('reviews')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Теги категорий */}
      <View style={localStyles.tagsSection}>{renderTags()}</View>

      {/* Детали заказа */}
      <View style={localStyles.detailsSection}>
        {/* Дата выполнения */}
        <View style={localStyles.detailRow}>
          <Ionicons name="calendar" size={16} color={styles.colors.primary} />
          <Text style={localStyles.detailText}>
            {order.date_type === 'single' && order.work_date
              ? `${formatDate(order.work_date)}${
                  order.work_time ? `, ${t(order.work_time)}` : ''
                }`
              : order.date_type === 'period' &&
                order.start_date &&
                order.end_date
              ? `${formatDate(order.start_date)}${
                  order.start_time ? `, ${t(order.start_time)}` : ''
                } - ${formatDate(order.end_date)}${
                  order.end_time ? `, ${t(order.end_time)}` : ''
                }`
              : order.date
              ? `${formatDate(order.date)}${
                  order.work_time ? `, ${t(order.work_time)}` : ''
                }`
              : t('Date not specified')}
          </Text>
        </View>

        {/* Адрес */}
        <View style={localStyles.detailRow}>
          <View style={localStyles.locationIconContainer}>
            <Ionicons name="location" size={16} color={styles.colors.primary} />
            <View style={localStyles.locationDot} />
          </View>
          <Text style={localStyles.detailText} numberOfLines={2}>
            {order.address || t('Address not specified')}
          </Text>
        </View>
      </View>

      {/* Стоимость */}
      <View style={localStyles.priceSection}>
        <Text style={localStyles.priceLabel}>{t('Work cost')}</Text>
        <Text style={localStyles.priceValue}>
          {formatPrice(order.max_amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    shadowColor: 'rgba(213, 213, 213, 0.25)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 16.9,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  orderNumber: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8A94A0',
    fontFamily: 'Inter',
  },
  date: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8A94A0',
    fontFamily: 'Inter',
  },
  dateWithBadge: {
    marginRight: 28, // 24px (width of badge) + 4px offset
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#323232',
    marginBottom: 10,
    marginTop: 4,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  executorSection: {
    marginBottom: 10,
  },
  executorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  executorDetails: {
    flex: 1,
    gap: 4,
  },
  executorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#323232',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  executorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8A94A0',
    fontFamily: 'Inter',
  },
  reviews: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8A94A0',
    fontFamily: 'Inter',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#F7F7F7',
    borderRadius: 50,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8A94A0',
    fontFamily: 'Inter',
    lineHeight: 16,
  },
  detailsSection: {
    gap: 4,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  locationIconContainer: {
    position: 'relative',
    width: 16,
    height: 18,
  },
  locationDot: {
    position: 'absolute',
    width: 10,
    height: 4,
    left: 3,
    top: 14,
    backgroundColor: 'rgba(102, 150, 251, 0.29)',
    borderRadius: 2,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#8A94A0',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8A94A0',
    fontFamily: 'Inter',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#323232',
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  responsesBadge: {
    position: 'absolute',
    top: 22,
    right: 15, // Сдвигаем левее, чтобы не налезать на дату
    backgroundColor: styles.colors.red,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  responsesBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});

export default MyOrderCard;
