import React from 'react';
import {View, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Text from './Text';
import CategoryIcon from './CategoryIcon';
import styles from '../styles';
import {formatPrice} from '../utils/orderUtils';
import {getAvatarUrl} from '../config';

const OrderCard = ({
  order,
  onPress,
  showMediatorActions = false,
  onOfferMediationServices,
}) => {
  const {t} = useTranslation();

  if (!order) {
    return null;
  }

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

  // Получение аватара пользователя (заказчика или исполнителя)
  const getAvatar = () => {
    const user = order.author || order.executor;
    if (user?.avatar) {
      return {uri: getAvatarUrl(user.avatar)};
    }
    return null;
  };

  const avatarSource = getAvatar();
  const user = order.author || order.executor;

  // Создание массива тегов категорий с иконками
  const getTags = () => {
    const tags = [];
    if (order.work_direction_label) {
      tags.push({
        label: order.work_direction_label,
        icon: order.work_direction_icon,
      });
    }
    if (
      order.work_type_label &&
      order.work_type_label !== order.work_direction_label
    ) {
      tags.push({
        label: order.work_type_label,
        icon: order.work_type_icon,
      });
    }
    if (order.category) {
      tags.push({
        label: order.category,
        icon: null,
      });
    }
    return tags.slice(0, 3);
  };

  const tags = getTags();

  // Получение статуса заказа
  const getStatusInfo = () => {
    const statusMap = {
      0: {text: t('Searching for performer'), color: styles.colors.regular},
      1: {text: t('Cancelled'), color: styles.colors.red},
      2: {text: t('Selecting executor'), color: styles.colors.yellow},
      3: {text: t('Executor selected'), color: styles.colors.primary},
      4: {text: t('In work'), color: styles.colors.green},
      5: {text: t('Awaiting confirmation'), color: styles.colors.yellow},
      6: {text: t('Rejected'), color: styles.colors.red},
      7: {text: t('Completed'), color: styles.colors.green},
    };

    return (
      statusMap[order.status] || {
        text: t('Unknown status'),
        color: styles.colors.regular,
      }
    );
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity style={localStyles.orderCard} onPress={onPress}>
      {/* Заголовок с номером заказа и статусом */}
      <View style={localStyles.header}>
        <Text style={localStyles.orderNumber}>
          {t('Order')} №{order.id}
        </Text>
        {showMediatorActions ? (
          <Text style={[localStyles.status, {color: statusInfo.color}]}>
            {statusInfo.text}
          </Text>
        ) : (
          <Text style={localStyles.date}>{formatDate(order.created_at)}</Text>
        )}
      </View>

      {/* Информация о пользователе (заказчик или исполнитель) */}
      {user && (
        <View style={localStyles.userSection}>
          <View style={localStyles.userInfo}>
            {avatarSource ? (
              <Image source={avatarSource} style={localStyles.avatar} />
            ) : (
              <View style={localStyles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            )}

            <View style={localStyles.userDetails}>
              <Text style={localStyles.userName}>
                {user.name || (order.author ? t('Customer') : t('Executor'))}
              </Text>

              {/* Рейтинг и статистика */}
              <View style={localStyles.userStats}>
                <View style={localStyles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={localStyles.ratingText}>
                    {order.author
                      ? user.customer_rating &&
                        typeof user.customer_rating === 'number'
                        ? user.customer_rating.toFixed(1)
                        : '0.0'
                      : user.rating && typeof user.rating === 'number'
                      ? user.rating.toFixed(1)
                      : '0.0'}
                  </Text>
                  <Text style={localStyles.reviewsText}>
                    (
                    {order.author
                      ? user.customer_reviews_count || 0
                      : user.reviews_count || 0}
                    )
                  </Text>
                </View>
                <Text style={localStyles.ordersText}>
                  {order.author
                    ? user.customer_orders_count || 0
                    : user.orders_count || 0}{' '}
                  {t('orders')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Название заказа */}
      {order.name && (
        <Text style={localStyles.orderTitle} numberOfLines={2}>
          {order.name}
        </Text>
      )}

      {/* Теги категорий */}
      {tags.length > 0 && (
        <View style={localStyles.tagsSection}>
          {tags.map((tag, index) => (
            <View key={index} style={localStyles.tag}>
              <View style={localStyles.tagContent}>
                <CategoryIcon
                  icon={tag.icon}
                  size={14}
                  style={localStyles.tagIcon}
                />
                <Text style={localStyles.tagText}>{tag.label}</Text>
              </View>
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
              : formatDate(order.date) || t('Date not specified')}
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
          {formatPrice(order.max_amount || order.price)}
        </Text>
      </View>

      {/* Действия медиатора (если включены) */}
      {showMediatorActions && (
        <View style={localStyles.mediatorActions}>
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={() =>
              onOfferMediationServices && onOfferMediationServices(order)
            }>
            <Text style={localStyles.actionButtonText}>
              {t('Offer Mediation Services')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  orderCard: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(7, 28, 53, 0.47)',
    textAlign: 'center',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(7, 28, 53, 0.47)',
    textAlign: 'right',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  userSection: {
    // Секция с информацией о пользователе
  },
  userInfo: {
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#323232',
    marginBottom: 4,
  },
  userStats: {
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
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#323232',
    lineHeight: 20,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#F7F7F7',
    borderRadius: 50,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    color: '#8A94A0',
  },
  detailsSection: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationIconContainer: {
    position: 'relative',
    width: 16,
    height: 18,
  },
  locationDot: {
    position: 'absolute',
    bottom: 0,
    left: 3,
    width: 10,
    height: 4,
    backgroundColor: 'rgba(102, 150, 251, 0.29)',
    borderRadius: 2,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
    color: '#8A94A0',
    flex: 1,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A94A0',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#323232',
  },
  mediatorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: styles.colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: styles.colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: styles.colors.primary,
  },
});

export default OrderCard;
