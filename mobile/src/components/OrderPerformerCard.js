import React from 'react';
import {useTranslation} from 'react-i18next';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import Text from './Text';
import appStyles from '../styles';

const OrderPerformerCard = ({order, onPress}) => {
  const {t} = useTranslation();

  // Статусы заказов для исполнителя
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
  console.log(order);
  // Получение цвета для отображения статуса
  const getStatusColor = status => {
    if (status === 0) return '#333333'; // черный
    if (status === 1) return appStyles.colors.red; // красный
    if (status === 2) return '#333333'; // черный
    if (status === 3) return appStyles.colors.yellow; // желтый
    if (status === 4) return appStyles.colors.green; // зеленый
    if (status === 5) return appStyles.colors.green; // зеленый
    if (status === 6) return appStyles.colors.red; // красный
    if (status === 7) return '#333333'; // черный
    return appStyles.colors.gray;
  };

  const statusColor = getStatusColor(order.status);

  return (
    <TouchableOpacity
      style={[styles.orderCard, {borderColor: statusColor}]}
      onPress={onPress}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={styles.orderId}>№ {order.id}</Text>
        <Text style={[styles.orderStatus, {color: statusColor}]}>
          {orderStatuses[order.status]}
        </Text>
      </View>
      <Text style={styles.orderTitle}>{order.title}</Text>

      <Text style={styles.orderText}>
        {t('Date')}:{' '}
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
        {t('Address')}: {order.address}
      </Text>
      <Text style={styles.orderText}>
        {t('Files')}: {order.files_count}
      </Text>
      {order.category && (
        <Text style={styles.orderText}>
          {t('Category')}: {order.category}
        </Text>
      )}
      <Text style={styles.orderText}>
        {t('Price')}: {order.price}
      </Text>
      <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
        <Text style={styles.detailsButtonText}>{t('Details')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    width: '100%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  orderId: {
    fontSize: 10,
    color: '#666',
  },
  orderStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderText: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailsButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: appStyles.colors.primary,
    borderRadius: 4,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OrderPerformerCard;
