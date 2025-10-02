import React from 'react';
import {useTranslation} from 'react-i18next';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import Text from './Text';
import appStyles from '../styles';
import {formatPrice} from '../utils/orderUtils';

const OrderMiniCard = ({order, onPress}) => {
  const {t} = useTranslation();

  // ✅ Защита от undefined
  if (!order) {
    console.warn('OrderMiniCard: order is undefined');
    return null;
  }

  const orderStatuses = {
    0: t('Searching for performer'), // Поиск исполнителя
    1: t('Cancelled'), // Отменён
    2: t('Selecting executor'), // Выбор исполнителя
    3: t('Executor selected'), // Исполнитель выбран
    4: t('In work'), // В работе
    5: t('Awaiting confirmation'), // Ждёт подтверждения
    6: t('Rejected'), // Отклонён
    7: t('Closed'), // Закрыт
  };

  const getStatusColor = status => {
    switch (status) {
      case 0:
        return appStyles.colors.dark;
      case 1:
        return appStyles.colors.red;
      case 2:
        return appStyles.colors.dark;
      case 3:
        return appStyles.colors.yellow;
      case 4:
        return appStyles.colors.green;
      case 5:
        return appStyles.colors.green;
      case 6:
        return appStyles.colors.red;
      case 7:
        return appStyles.colors.dark;
      default:
        return appStyles.colors.gray;
    }
  };

  const statusColor = getStatusColor(order.status);

  return (
    <TouchableOpacity
      style={[styles.orderCard, {borderColor: statusColor}]}
      onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.orderId}>№ {order.id || 'N/A'}</Text>
        <Text style={[styles.orderStatus, {color: statusColor}]}>
          {orderStatuses[order.status] || t('Unknown status')}
        </Text>
      </View>
      <Text style={styles.orderTitle}>
        {order.name || order.title || t('Untitled')}
      </Text>

      <Text style={styles.orderText}>
        {t('Execution date')}:{' '}
        {order.date_type === 'single' && order.work_date
          ? `${order.work_date}${
              order.work_time ? `, ${t(order.work_time)}` : ''
            }`
          : order.date_type === 'period' && order.start_date && order.end_date
          ? `${order.start_date}${
              order.start_time ? `, ${t(order.start_time)}` : ''
            } - ${order.end_date}${
              order.end_time ? `, ${t(order.end_time)}` : ''
            }`
          : order.work_date
          ? `${order.work_date}${
              order.work_time ? `, ${t(order.work_time)}` : ''
            }`
          : order.date || 'N/A'}
      </Text>
      <Text style={styles.orderText}>
        {t('Address')}: {order.address || 'N/A'}
      </Text>
      <Text style={styles.orderText}>
        {t('Attachments count')}: {order.files_count || 0}
      </Text>
      <Text style={styles.orderText}>
        {t('Maximum price')}: {formatPrice(order.price || order.max_amount)}
      </Text>
      <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
        <Text style={styles.detailsButtonText}>{t('More details')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    width: '100%',
    padding: 16,
    backgroundColor: appStyles.colors.white,
    borderRadius: 16, // Обновлено для единообразия с другими компонентами
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderTitle: {
    fontSize: appStyles.fonSize.md,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  orderId: {
    fontSize: appStyles.fonSize.xxs,
    color: appStyles.colors.gray,
  },
  orderStatus: {
    fontSize: appStyles.fonSize.xxs,
    fontWeight: 'bold',
  },
  orderText: {
    fontSize: appStyles.fonSize.sm,
    marginBottom: 4,
    color: appStyles.colors.regular,
  },
  detailsButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: appStyles.colors.primary,
    borderRadius: appStyles.borderR,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: appStyles.colors.white,
    fontWeight: 'bold',
  },
});

export default OrderMiniCard;
