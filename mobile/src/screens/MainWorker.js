import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Carousel from '../components/Carousel';
import CustomerOrderCard from '../components/CustomerOrderCard';
import VerificationWarning from '../components/VerificationWarning';
import UnifiedInfoCard from '../components/UnifiedInfoCard';
import styles from '../styles';
import Text from '../components/Text';
import {useTranslation} from 'react-i18next';
import useMainWorker from '../hooks/useMainWorker';
import useVerification from '../hooks/useVerification';
import {LoadingComponent} from './Loading';
import {OrdersListSkeleton} from '../components/SkeletonLoader';
import dataCache from '../services/dataCache';
import {useSelector} from 'react-redux';

const MainWorker = ({navigation}) => {
  const {
    orders,
    banners,
    tariff,
    currentSubscription,
    days_until_expiration,
    remaining_orders,
    remaining_contacts,
    wallet,
    userProfile,
    notificationsCount,
    loading,
    error,
    fetchData,
    handleSubscriptionPress,
    handleWalletPress,
    handlePersonalDataPress,
    handleOrderPress,
    handleNotificationsPress,
  } = useMainWorker(navigation);

  const {needsVerification, canAccessOrders, getVerificationMessage} =
    useVerification();

  const {t} = useTranslation();

  // Используем тот же источник данных, что и в Personal Data
  const userData = useSelector(state => state.auth.userData);

  // Обновляем данные при каждой фокусировке экрана
  // ОПТИМИЗАЦИЯ: Быстрое обновление с кешированием
  useFocusEffect(
    React.useCallback(() => {
      console.log('Экран исполнителя получил фокус');

      const userId = userData?.id;
      if (userId) {
        // Проверяем кеш для мгновенного отображения
        const lastUpdate =
          dataCache.cache.get(dataCache.KEYS.ORDERS_LIST(userId, 'executor'))
            ?.timestamp || 0;
        const shouldUpdate = Date.now() - lastUpdate > 30000; // 30 секунд

        if (shouldUpdate) {
          // Обновляем в фоне
          setTimeout(() => fetchData(), 100);
        }
      }

      return () => {};
    }, [fetchData, userData?.id]),
  );

  // ОПТИМИЗАЦИЯ: Skeleton вместо спиннера если нет данных
  if (loading && (!orders || orders.length === 0)) {
    return (
      <View style={localStyles.container}>
        <OrdersListSkeleton count={3} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
        <Text
          style={{
            color: styles.colors.red,
            fontSize: 16,
            marginBottom: 20,
            textAlign: 'center',
          }}>
          {error}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: styles.colors.primary,
            padding: 10,
            borderRadius: 8,
          }}
          onPress={fetchData}>
          <Text style={{color: styles.colors.white}}>{t('Retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Рендер карточки доступного заказа
  const renderOrderCard = order => {
    // Проверяем наличие необходимых полей в заказе
    if (!order || !order.id) return null;

    return (
      <CustomerOrderCard
        key={order.id}
        order={order}
        onPress={() => handleOrderPress(order.id)}
      />
    );
  };

  const verificationMessage = getVerificationMessage();

  // Компонент хедера с приветствием
  const WelcomeHeader = () => (
    <View style={localStyles.headerContainer}>
      <View style={localStyles.headerContent}>
        <Text style={localStyles.headerTitle}>
          {t('Hello')}, {userData?.name || t('User')}!
        </Text>
        <View style={localStyles.notificationButtonWrapper}>
          <TouchableOpacity
            style={localStyles.notificationButton}
            onPress={handleNotificationsPress}>
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

  return (
    <View style={localStyles.mainContainer}>
      <WelcomeHeader />
      <View style={localStyles.headerSeparator} />

      <ScrollView
        style={localStyles.scrollContainer}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {banners && banners.length > 0 ? (
          <View style={{marginBottom: 24}}>
            <Carousel banners={banners} />
          </View>
        ) : null}

        {/* Unified Info Card - combines profile, balance and subscription */}
        <UnifiedInfoCard
          userProfile={userData}
          wallet={wallet}
          tariff={tariff}
          currentSubscription={currentSubscription}
          days_until_expiration={days_until_expiration}
          remaining_orders={remaining_orders}
          remaining_contacts={remaining_contacts}
          onProfilePress={handlePersonalDataPress}
          onWalletPress={handleWalletPress}
          onSubscriptionPress={handleSubscriptionPress}
          userType={0} // 0 - исполнитель
        />

        {/* Verification Warning */}
        {needsVerification && verificationMessage && (
          <VerificationWarning
            title={verificationMessage.title}
            message={verificationMessage.message}
            type={verificationMessage.type}
            actionText={t('Go to profile')}
            onActionPress={() => navigation.navigate('PersonalData')}
            style={{margin: 0, marginBottom: 24}}
          />
        )}

        {/* Orders Section */}
        <Text style={localStyles.sectionTitle}>
          {t('Available orders')} ({canAccessOrders ? orders.length : 0})
        </Text>

        {canAccessOrders ? (
          orders.length > 0 ? (
            orders.map(order => renderOrderCard(order))
          ) : (
            <View style={{alignItems: 'center', padding: 20}}>
              <Text style={localStyles.emptyText}>
                {t('No available orders in your categories')}
              </Text>
            </View>
          )
        ) : (
          <View style={{alignItems: 'center', padding: 20}}>
            <Text style={localStyles.emptyText}>
              {t('Complete verification to access orders')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: styles.paddingHorizontal,
    paddingBottom: 100, // Добавляем отступ снизу для футера
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500', // No bold fonts in app
    marginVertical: 16,
    alignSelf: 'flex-start',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default MainWorker;
