import React, {useCallback, useMemo} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import styles from '../styles';
import Text from '../components/Text';
import {useTranslation} from 'react-i18next';
import MyOrderCard from '../components/MyOrderCard';
import VerificationWarning from '../components/VerificationWarning';
import StandardButton from '../components/StandardButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useMyOrders from '../hooks/useMyOrders';
import useVerification from '../hooks/useVerification';
import {LoadingComponent} from './Loading';

// Компонент хедера точно как в Home
const WelcomeHeader = ({
  userProfile,
  notificationsCount,
  newResponsesCount,
  onNotificationsPress,
  onArchivePress,
  t,
}) => (
  <View style={localStyles.headerContainer}>
    <View style={localStyles.headerContent}>
      <Text style={localStyles.headerTitle}>{t('My Orders')}</Text>
      <View style={localStyles.headerButtons}>
        <TouchableOpacity
          style={localStyles.archiveButton}
          onPress={onArchivePress}>
          <Ionicons
            name="archive-outline"
            size={16}
            color={styles.colors.actionGray}
          />
        </TouchableOpacity>
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
          {(notificationsCount > 0 || newResponsesCount > 0) && (
            <View style={localStyles.notificationBadge}>
              <Text style={localStyles.notificationBadgeText}>
                {notificationsCount + newResponsesCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  </View>
);

// Компонент заголовка подписки
const SubscriptionHeader = ({navigation, t}) => {
  return (
    <TouchableOpacity
      style={localStyles.subscriptionHeader}
      onPress={() => navigation.navigate('Subscription')}
      activeOpacity={0.8}>
      <Text style={localStyles.subscriptionHeaderText}>
        {t('Subscriptions')}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={styles.colors.gray} />
    </TouchableOpacity>
  );
};

const OrdersList = ({navigation}) => {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const notifications = useSelector(state => state.notifications);
  const user_type = auth?.userData?.type || 0; // 0 - исполнитель, 1 - заказчик
  const userProfile = auth?.userData;
  const notificationsCount = notifications?.unread_count || 0;
  const newResponsesCountFromRedux = notifications?.new_responses_count || 0;

  // Используем единый хук для получения "моих заказов" для обоих типов пользователей
  const {
    orders,
    loading,
    error,
    newResponsesCount = 0, // Добавляем fallback значение
    fetchData,
    retryFetch,
    navigateToOrder,
  } = useMyOrders();

  // Обработчик нажатия на уведомления
  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  // Обработчик архива заказов
  const handleArchivePress = () => {
    navigation.navigate('ArchivedOrders');
  };

  // Обработчик создания заказа
  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder');
  };

  const {needsVerification, canRespondToOrders, getVerificationMessage} =
    useVerification();

  // Обновляем данные при фокусе на экране (например, после возврата от деталки заказа)
  useFocusEffect(
    useCallback(() => {
      // Проверяем, что пользователь авторизован перед загрузкой данных
      if (!auth.logged) {
        console.log('OrdersList: User not logged in, skipping data load');
        return;
      }

      fetchData();
    }, [auth.logged, fetchData]),
  );

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingComponent text={t('Loading...')} />;
  }

  return (
    <View style={localStyles.container}>
      <WelcomeHeader
        userProfile={userProfile}
        notificationsCount={notificationsCount}
        newResponsesCount={newResponsesCount || newResponsesCountFromRedux}
        onNotificationsPress={handleNotificationsPress}
        onArchivePress={handleArchivePress}
        t={t}
      />
      <View style={localStyles.headerSeparator} />

      <ScrollView
        style={localStyles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }>
        {/* Предупреждение о верификации для исполнителей */}
        {user_type === '0' && needsVerification && (
          <VerificationWarning
            title={getVerificationMessage()?.title}
            message={getVerificationMessage()?.message}
            type={getVerificationMessage()?.type}
            actionText={t('Go to profile')}
            onActionPress={() => navigation.navigate('PersonalData')}
            style={localStyles.verificationWarning}
          />
        )}

        {/* Заголовок подписки для заказчиков */}
        {user_type === '1' && (
          <SubscriptionHeader navigation={navigation} t={t} />
        )}

        {/* Список заказов */}
        {error ? (
          <View style={localStyles.errorContainer}>
            <Text style={localStyles.errorText}>{error}</Text>
            <TouchableOpacity
              style={localStyles.retryButton}
              onPress={retryFetch}>
              <Text style={localStyles.retryText}>{t('Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>
              {user_type === '1'
                ? t('You have no orders yet')
                : t('You have no active orders')}
            </Text>
            <Text style={localStyles.emptySubText}>
              {user_type === '1'
                ? t('Create your first order to get started')
                : t('Accept orders to see them here')}
            </Text>
            {/* Кнопка создания заказа в пустом состоянии для заказчиков */}
            {user_type === '1' && (
              <View style={localStyles.createOrderContainer}>
                <StandardButton
                  title={t('Create Order')}
                  action={handleCreateOrder}
                />
              </View>
            )}
          </View>
        ) : (
          <View style={localStyles.ordersContainer}>
            {/* Кнопка создания заказа только для заказчиков */}
            {user_type === '1' && (
              <View style={localStyles.createOrderContainer}>
                <StandardButton
                  title={t('Create Order')}
                  action={handleCreateOrder}
                />
              </View>
            )}
            {orders.map(order => (
              <MyOrderCard
                key={order.id}
                order={order}
                onPress={() => navigateToOrder(order.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.white,
  },
  // Стили хедера скопированы из Main.js
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
    height: 20,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 20,
    color: styles.colors.black,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  archiveButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F9F9F9',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: styles.colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: styles.colors.regular,
    fontSize: styles.fonSize.md,
  },

  verificationWarning: {
    margin: 0,
    marginBottom: 16,
    width: '100%',
  },
  ordersContainer: {
    paddingBottom: 80, // Отступ для таб-бара
  },
  createOrderContainer: {
    marginBottom: 24,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: styles.fonSize.md,
    color: styles.colors.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: styles.fonSize.md,
    color: styles.colors.red,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: styles.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: styles.borderR,
  },
  retryText: {
    color: styles.colors.white,
    fontSize: styles.fonSize.md,
    fontWeight: '600',
  },
  // Стили для заголовка подписки
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: styles.colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: 'rgba(213, 213, 213, 0.25)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 16.9,
    elevation: 5,
  },
  subscriptionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.black,
  },
});

export default OrdersList;
