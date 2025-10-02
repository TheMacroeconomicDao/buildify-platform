import React from 'react';
import {View, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Text from './Text';
import styles from '../styles';
import {formatPrice} from '../utils/orderUtils';
import {getAvatarUrl} from '../config';

const CustomerOrderCard = ({order, onPress}) => {
  const {t} = useTranslation();

  // Функция форматирования даты
  const formatDate = dateString => {
    if (!dateString) return t('Date not specified');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Получение аватара пользователя
  const getAvatar = () => {
    if (order.author?.avatar) {
      return {uri: getAvatarUrl(order.author.avatar)};
    }
    return null; // Плейсхолдер будет обработан в JSX
  };

  const avatarSource = getAvatar();

  // Создание массива тегов категорий
  const getTags = () => {
    const tags = [];
    if (order.work_direction_label) {
      tags.push(order.work_direction_label);
    }
    if (
      order.work_type_label &&
      order.work_type_label !== order.work_direction_label
    ) {
      tags.push(order.work_type_label);
    }
    return tags;
  };

  const tags = getTags();

  return (
    <TouchableOpacity style={localStyles.orderCard} onPress={onPress}>
      {/* Заголовок с номером заказа и датой */}
      <View style={localStyles.header}>
        <Text style={localStyles.orderNumber}>
          {t('Order')} №{order.id}
        </Text>
        <Text style={localStyles.date}>{formatDate(order.created_at)}</Text>
      </View>

      {/* Информация о заказчике */}
      {order.author && (
        <View style={localStyles.authorSection}>
          <View style={localStyles.authorInfo}>
            {avatarSource ? (
              <Image source={avatarSource} style={localStyles.avatar} />
            ) : (
              <View style={localStyles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            )}

            <View style={localStyles.authorDetails}>
              <Text style={localStyles.authorName}>
                {order.author.name || t('Customer')}
              </Text>

              {/* Рейтинг и статистика заказчика */}
              <View style={localStyles.customerStats}>
                <View style={localStyles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={localStyles.ratingText}>
                    {order.author.customer_rating &&
                    typeof order.author.customer_rating === 'number'
                      ? order.author.customer_rating.toFixed(1)
                      : '0.0'}
                  </Text>
                  <Text style={localStyles.reviewsText}>
                    ({order.author.customer_reviews_count || 0})
                  </Text>
                </View>
                <Text style={localStyles.ordersText}>
                  {order.author.customer_orders_count || 0} {t('orders')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Теги категорий */}
      {tags.length > 0 && (
        <View style={localStyles.tagsSection}>
          {tags.map((tag, index) => (
            <View key={index} style={localStyles.tag}>
              <Text style={localStyles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

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
              : t('Date not specified')}
          </Text>
        </View>

        {/* Адрес */}
        <View style={localStyles.detailRow}>
          <View style={localStyles.locationIconContainer}>
            <Ionicons name="location" size={16} color={styles.colors.primary} />
            <View style={localStyles.locationDot} />
          </View>
          <Text style={localStyles.detailText} numberOfLines={3}>
            {order.address || t('Address not specified')}
          </Text>
        </View>
      </View>

      {/* Стоимость работ */}
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
  orderCard: {
    // Основной контейнер карточки
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    width: '100%',
    shadowColor: 'rgba(213, 213, 213, 0.25)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 16.9,
    elevation: 5,
    gap: 16,
  },
  header: {
    // Заголовок с номером заказа и датой
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    // Заказ №12346
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(7, 28, 53, 0.47)',
    textAlign: 'center',
  },
  date: {
    // 27.06.2024
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(7, 28, 53, 0.47)',
    textAlign: 'right',
  },
  authorSection: {
    // Секция с информацией о заказчике
  },
  authorInfo: {
    // Контейнер с аватаром и деталями
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    // Аватар пользователя
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    // Плейсхолдер аватара
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  authorDetails: {
    // Детали заказчика
    flex: 1,
  },
  authorName: {
    // Иван Иванов
    fontSize: 15,
    fontWeight: '500',
    color: '#323232',
    marginBottom: 4,
  },
  customerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#323232',
    marginLeft: 2,
  },
  reviewsText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8A94A0',
    marginLeft: 4,
  },
  ordersText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8A94A0',
  },

  tagsSection: {
    // Секция с тегами
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    // Отдельный тег
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#F7F7F7',
    borderRadius: 50,
  },
  tagText: {
    // Текст тега
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    color: '#8A94A0',
  },
  detailsSection: {
    // Секция с деталями заказа
    gap: 8,
  },
  detailRow: {
    // Строка с деталью
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationIconContainer: {
    // Контейнер для иконки местоположения
    position: 'relative',
    width: 16,
    height: 18,
  },
  locationDot: {
    // Точка под иконкой местоположения
    position: 'absolute',
    bottom: 0,
    left: 3,
    width: 10,
    height: 4,
    backgroundColor: 'rgba(102, 150, 251, 0.29)',
    borderRadius: 2,
  },
  detailText: {
    // Текст деталей
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
    color: '#8A94A0',
    flex: 1,
  },
  priceSection: {
    // Секция со стоимостью
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceLabel: {
    // "Стоимость работ"
    fontSize: 14,
    fontWeight: '600',
    color: '#8A94A0',
  },
  priceValue: {
    // "~1.000.000₽"
    fontSize: 14,
    fontWeight: '600', // Единственное место где используем 600
    color: '#323232',
  },
});

export default CustomerOrderCard;
