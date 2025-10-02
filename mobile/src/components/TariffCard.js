import React, {useEffect} from 'react';
import {View, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import appStyles from '../styles';
import Text from './Text';
import {useTranslation} from 'react-i18next';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';

const TariffCard = ({tariff, onPress}) => {
  const {t} = useTranslation();

  // Отладочное логирование
  useEffect(() => {
    console.log('TariffCard received tariff data:', tariff);
  }, [tariff]);

  // Если нет тарифа, показываем заглушку
  if (!tariff) {
    return (
      <TouchableOpacity style={styles.tariffCard} onPress={onPress}>
        <Text style={styles.tariffTitle}>{t('No active tariff')}</Text>
        <Text style={styles.tariffText}>
          {t('Subscribe to get more features')}
        </Text>
      </TouchableOpacity>
    );
  }

  // Форматируем дату окончания, проверяя валидность даты
  let endDate = t('Not specified');
  if (tariff.ends_at) {
    try {
      const date = new Date(tariff.ends_at);
      if (!isNaN(date.getTime())) {
        endDate = format(date, 'dd MMMM yyyy', {locale: ru});
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
  }

  // Безопасное получение значений с дефолтными значениями
  const max_orders = tariff.max_orders || 0;
  const max_contacts = tariff.max_contacts || 0;
  const price = parseFloat(tariff.price) || 0;
  const duration_days = tariff.duration_days || 30;

  // Отладочное логирование для проверки значений
  console.log('TariffCard rendering with values:', {
    name: tariff.name,
    max_orders,
    max_contacts,
    price,
    duration_days,
  });

  return (
    <TouchableOpacity style={styles.tariffCard} onPress={onPress}>
      <Text style={styles.tariffTitle}>{tariff.name || t('Subscription')}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('Orders limit')}:</Text>
        <Text style={styles.infoValue}>{max_orders}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('Contacts limit')}:</Text>
        <Text style={styles.infoValue}>{max_contacts}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('Valid until')}:</Text>
        <Text style={styles.infoValue}>{endDate}</Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{price} AED</Text>
        <Text style={styles.periodText}>
          / {duration_days} {t('days')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tariffCard: {
    width: '100%',
    padding: 16,
    backgroundColor: appStyles.colors.white,
    borderRadius: 16,
    marginBottom: 24, // Spacing between blocks: 24 units
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tariffTitle: {
    fontSize: appStyles.fonSize.smd,
    fontWeight: '500', // No bold fonts in app
    marginBottom: 12, // Spacing between elements: 12 units
    color: appStyles.colors.titles,
  },
  tariffText: {
    fontSize: appStyles.fonSize.sm,
    marginBottom: 12, // Spacing between elements: 12 units
    color: appStyles.colors.regular,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: appStyles.fonSize.sm,
    color: appStyles.colors.actionGray,
    fontWeight: '400',
  },
  infoValue: {
    fontSize: appStyles.fonSize.sm,
    fontWeight: '400', // No bold fonts in app
    color: appStyles.colors.titles,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12, // Spacing between elements: 12 units
  },
  priceText: {
    fontSize: appStyles.fonSize.md,
    fontWeight: '500', // No bold fonts in app
    color: appStyles.colors.primary,
  },
  periodText: {
    fontSize: appStyles.fonSize.sm,
    color: appStyles.colors.actionGray,
    marginLeft: 4,
    fontWeight: '400',
  },
});

export default TariffCard;
