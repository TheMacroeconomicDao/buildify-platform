import React, {useCallback} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Text from '../components/Text';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import useMainMediator from '../hooks/useMainMediator';
import {formatPrice} from '../utils/orderUtils';
import {LoadingComponent} from './Loading';

// Компоненты
const LoadingView = ({t}) => (
  <LoadingComponent text={t('Loading...')} />
);

const ErrorView = ({error, onRetry, t}) => (
  <View style={localStyles.centeredContainer}>
    <Text style={localStyles.errorText}>
      {error || t('Something went wrong')}
    </Text>
    <TouchableOpacity style={localStyles.retryButton} onPress={onRetry}>
      <Text style={localStyles.retryButtonText}>{t('Try again')}</Text>
    </TouchableOpacity>
  </View>
);

const WelcomeHeader = ({
  userProfile,
  notificationsCount,
  onNotificationsPress,
  t,
}) => (
  <View style={localStyles.headerContainer}>
    <View style={localStyles.headerContent}>
      <Text style={localStyles.headerTitle}>
        {t('Hello')}, {userProfile?.name || t('Mediator')}!
      </Text>
      <View style={localStyles.notificationButtonWrapper}>
        <TouchableOpacity
          style={localStyles.notificationButton}
          onPress={onNotificationsPress}>
          <Ionicons
            name="notifications"
            size={16}
            color={styles.colors.primary}
          />
        </TouchableOpacity>
        {notificationsCount > 0 && (
          <View style={localStyles.notificationBadge}>
            <Text style={localStyles.notificationBadgeText}>
              {notificationsCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  </View>
);

const ActionCard = ({
  imageSource,
  title,
  subtitle,
  onPress,
  style,
  backgroundColor = styles.colors.primary,
}) => (
  <TouchableOpacity style={[localStyles.actionCard, style]} onPress={onPress}>
    {imageSource && (
      <View style={[localStyles.blueSection, {backgroundColor}]}>
        <Image
          source={imageSource}
          style={localStyles.actionImage}
          resizeMode="cover"
        />
      </View>
    )}
    <View style={localStyles.whiteSection}>
      <Text style={localStyles.actionTitle}>{title}</Text>
      <Text style={localStyles.actionSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export default function MainMediator({navigation}) {
  const {
    refreshing,
    loading,
    errors,
    orders,
    availableOrders,
    activeDeals,
    banners,
    userProfile,
    notificationsCount,
    fetchData,
    handleRefresh,
    navigateToOrder,
    navigateToOrdersList,
    navigateToAvailableOrders,
    navigateToDeals,
    navigateToFinances,
    handleNotificationsPress,
    handleOfferMediationServices,
    handleTakeAvailableOrder,
  } = useMainMediator(navigation);

  const {t} = useTranslation();

  // Отладочная информация
  console.log('MainMediator - orders:', orders);
  console.log('MainMediator - availableOrders:', availableOrders);
  console.log('MainMediator - activeDeals:', activeDeals);

  // Обновляем данные при каждой фокусировке экрана
  useFocusEffect(
    useCallback(() => {
      console.log('Экран посредника получил фокус - обновляем данные');
      fetchData();
      return () => {};
    }, [fetchData]),
  );

  if (loading) {
    return <LoadingView t={t} />;
  }

  if (errors && errors.length > 0) {
    return <ErrorView error={errors[0]} onRetry={handleRefresh} t={t} />;
  }

  return (
    <View style={localStyles.container}>
      <WelcomeHeader
        userProfile={userProfile}
        notificationsCount={notificationsCount}
        onNotificationsPress={handleNotificationsPress}
        t={t}
      />
      <View style={localStyles.headerSeparator} />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Статистика */}
        <View style={localStyles.sectionCard}>
          <Text style={localStyles.sectionTitle}>{t('Statistics')}</Text>
          <View style={localStyles.statsContainer}>
            <View style={localStyles.statItem}>
              <Text style={localStyles.statNumber}>
                {activeDeals && Array.isArray(activeDeals)
                  ? activeDeals.length
                  : 0}
              </Text>
              <Text style={localStyles.statLabel}>{t('Active Projects')}</Text>
            </View>
            <View style={localStyles.statItem}>
              <Text
                style={[localStyles.statNumber, {color: styles.colors.green}]}>
                {availableOrders && Array.isArray(availableOrders)
                  ? availableOrders.length
                  : 0}
              </Text>
              <Text style={localStyles.statLabel}>{t('Available Orders')}</Text>
            </View>
          </View>
        </View>

        {/* Активные проекты */}
        <View style={localStyles.sectionCard}>
          <View style={localStyles.sectionHeader}>
            <Text style={localStyles.sectionTitle}>{t('Active Projects')}</Text>
            <TouchableOpacity onPress={navigateToDeals}>
              <Text style={localStyles.viewAllText}>{t('View all')}</Text>
            </TouchableOpacity>
          </View>

          {activeDeals?.length > 0 ? (
            <View style={localStyles.ordersContainer}>
              {activeDeals.slice(0, 3).map((deal, index) => (
                <TouchableOpacity
                  key={deal.id || index}
                  style={localStyles.dealCard}
                  onPress={() => navigateToOrder(deal.id, deal.status)}>
                  <Text style={localStyles.dealTitle}>{deal.title}</Text>
                  <Text style={localStyles.dealCustomer}>
                    {t('Customer')}: {deal.customer?.name}
                  </Text>
                  <Text style={localStyles.dealAmount}>
                    {t('Commission')}: {formatPrice(deal.commission || 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={localStyles.emptyText}>
              {t('Your active mediation projects will appear here')}
            </Text>
          )}
        </View>

        {/* Доступные заказы */}
        <View style={localStyles.sectionCard}>
          <View style={localStyles.sectionHeader}>
            <Text style={localStyles.sectionTitle}>
              {t('Available Orders')} ({availableOrders?.length || 0})
            </Text>
            <TouchableOpacity onPress={navigateToAvailableOrders}>
              <Text style={localStyles.viewAllText}>{t('View all')}</Text>
            </TouchableOpacity>
          </View>

          {availableOrders?.length > 0 ? (
            <View style={localStyles.ordersContainer}>
              {availableOrders.slice(0, 3).map((order, index) => (
                <TouchableOpacity
                  key={order.id || index}
                  style={localStyles.orderCard}
                  onPress={() => handleTakeAvailableOrder(order)}>
                  <Text style={localStyles.orderTitle}>{order.title}</Text>
                  <Text style={localStyles.orderCustomer}>
                    {t('Customer')}:{' '}
                    {order.author?.name || order.customer?.name}
                  </Text>
                  <Text style={localStyles.orderAmount}>
                    {t('Budget')}: {formatPrice(order.max_amount || 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={localStyles.emptyText}>
              {t('No available orders at the moment')}
            </Text>
          )}
        </View>

        {/* Кнопки навигации */}
        <View style={localStyles.navigationButtons}>
          <TouchableOpacity
            style={localStyles.navButton}
            onPress={navigateToFinances}>
            <View style={localStyles.navButtonContent}>
              <Ionicons
                name="wallet"
                size={20}
                color="#fff"
                style={localStyles.navButtonIcon}
              />
              <Text style={localStyles.executorsButtonText}>
                {t('Finances')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Кнопка перехода к исполнителям */}
        <TouchableOpacity
          style={localStyles.executorsButton}
          onPress={() => navigation.navigate('Executors')}>
          <View style={localStyles.executorsButtonContent}>
            <Ionicons
              name="people"
              size={20}
              color="#fff"
              style={localStyles.executorsButtonIcon}
            />
            <Text style={localStyles.executorsButtonText}>
              {t('View All Executors')}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.white,
  },
  scrollContent: {
    padding: styles.paddingHorizontal,
    paddingBottom: 80, // Отступ для таб-бара
  },

  // Стили хедера
  headerContainer: {
    backgroundColor: styles.colors.white,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '500',
    lineHeight: styles.lineHeight.lg,
    color: styles.colors.black,
  },
  notificationButtonWrapper: {
    position: 'relative',
  },
  notificationButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F9F9F9',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 15,
    height: 15,
    backgroundColor: '#F54E4E',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 11,
    color: styles.colors.white,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: styles.colors.border,
  },

  // Стили для загрузки и ошибок
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: styles.colors.white,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: styles.colors.regular,
  },
  errorText: {
    fontSize: 16,
    color: styles.colors.red,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: styles.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: styles.colors.white,
    fontSize: 16,
    fontWeight: '500',
  },

  // Стили для баннеров
  bannersSection: {
    marginBottom: 24, // Между блоками
  },

  // Стили для ActionCard
  actionCard: {
    backgroundColor: styles.colors.white,
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 8,
    shadowColor: '#D4D4D4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16.9,
    elevation: 8,
    marginBottom: 24,
  },
  blueSection: {
    width: '100%',
    height: 166,
    position: 'relative',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  actionImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    bottom: 0,
  },
  whiteSection: {
    padding: 16,
    paddingVertical: 16,
    height: 90,
    justifyContent: 'flex-end',
  },
  actionTitle: {
    fontSize: styles.fonSize.smd + 1, // 17px
    fontWeight: '500',
    lineHeight: styles.lineHeight.smd + 1, // 21px
    color: styles.colors.titles,
    marginBottom: 8, // Внутри блока
  },
  actionSubtitle: {
    fontSize: styles.fonSize.xs + 1, // 13px
    fontWeight: '400',
    color: styles.colors.actionGray,
    lineHeight: styles.lineHeight.xs + 1, // 17px
  },
  dashboardCard: {
    // Наследует стили от actionCard
  },

  // Стили для секций
  sectionCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24, // Между блоками
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Между элементами
  },
  sectionTitle: {
    fontSize: styles.fonSize.md,
    fontWeight: '500',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.md,
  },
  viewAllText: {
    fontSize: 14,
    color: styles.colors.primary,
    textDecorationLine: 'underline',
  },
  ordersContainer: {
    gap: 12, // Между элементами
  },
  emptyText: {
    fontSize: 16,
    color: styles.colors.regular,
    textAlign: 'center',
    padding: 20,
  },

  // Стили для статистики
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12, // Между элементами
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: styles.fonSize.h2,
    fontWeight: '700',
    color: styles.colors.primary,
    marginBottom: 8, // Внутри блока
    textAlign: 'center',
    minWidth: 40,
    lineHeight: styles.lineHeight.h2,
  },
  statLabel: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: styles.lineHeight.sm,
  },

  // Стили для карточек заказов
  orderCard: {
    backgroundColor: styles.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8, // Внутри блока
  },
  orderTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.smd,
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: styles.lineHeight.sm,
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.primary,
    lineHeight: styles.lineHeight.sm,
  },

  // Стили для кнопок навигации
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24, // Между блоками
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: styles.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  navButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButtonIcon: {
    marginRight: 8, // Внутри блока
  },
  navButtonText: {
    color: '#fff',
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    lineHeight: styles.lineHeight.sm,
  },

  // Стили для кнопки исполнителей
  executorsButton: {
    backgroundColor: styles.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24, // Между блоками
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  executorsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  executorsButtonIcon: {
    marginRight: 8, // Внутри блока
  },
  executorsButtonText: {
    fontSize: styles.fonSize.smd,
    fontWeight: '500',
    color: '#fff',
    lineHeight: styles.lineHeight.smd,
  },

  // Стили для карточек сделок
  dealCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dealTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.smd,
    marginBottom: 8,
  },
  dealCustomer: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: styles.lineHeight.sm,
    marginBottom: 4,
  },
  dealAmount: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.primary,
    fontWeight: '500',
    lineHeight: styles.lineHeight.sm,
  },
});
