import React, {useCallback, useMemo} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from '../styles';
import Text from '../components/Text';
import {useTranslation} from 'react-i18next';
import useMainScreen from '../hooks/useMainScreen';
import {OrdersListSkeleton} from '../components/SkeletonLoader';
import dataCache from '../services/dataCache';
import {formatPrice} from '../utils/orderUtils';
import config from '../config';
import {LoadingComponent} from './Loading';

// Компоненты
const LoadingView = ({t}) => <LoadingComponent text={t('Loading...')} />;

const ErrorView = ({error, onRetry, t}) => (
  <View style={localStyles.centeredContainer}>
    <Text style={localStyles.errorText}>{error}</Text>
    <TouchableOpacity style={localStyles.retryButton} onPress={onRetry}>
      <Text style={localStyles.retryButtonText}>{t('Retry')}</Text>
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
        {t('Hello')}, {userProfile?.name || t('User')}!
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

const LocationHeader = ({currentLocation, locationLoading, t}) => (
  <View style={localStyles.locationContainer}>
    <View style={localStyles.locationContent}>
      <View style={localStyles.locationIcon}>
        <Image
          source={require('../../ios/assets/src/images/mark_icon.png')}
          style={localStyles.locationIconImage}
          resizeMode="contain"
        />
      </View>
      <Text style={localStyles.locationText}>
        {locationLoading ? t('Loading...') : currentLocation}
      </Text>
    </View>
  </View>
);

const SubscriptionCard = ({tariff, days_until_expiration, t, navigation}) => {
  if (!tariff) return null;

  const handlePress = () => {
    navigation.navigate('Subscription');
  };

  const getStatusColor = () => {
    if (!days_until_expiration || days_until_expiration === null) {
      return styles.colors.primary; // Бесплатная подписка
    }
    if (days_until_expiration <= 0) {
      return styles.colors.red; // Истекла
    }
    if (days_until_expiration <= 3) {
      return '#FF9500'; // Предупреждение
    }
    return styles.colors.green; // Активна
  };

  const getStatusText = () => {
    if (!days_until_expiration || days_until_expiration === null) {
      return t('Unlimited');
    }
    if (days_until_expiration <= 0) {
      return t('Expired');
    }
    if (days_until_expiration === 1) {
      return t('Expires today');
    }
    return `${days_until_expiration} ${t('days left')}`;
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  return (
    <TouchableOpacity
      style={[localStyles.subscriptionCard, {borderColor: statusColor}]}
      onPress={handlePress}
      activeOpacity={0.8}>
      <View style={localStyles.subscriptionContent}>
        <View style={localStyles.subscriptionInfo}>
          <Text style={localStyles.subscriptionTitle}>📋 {tariff.name}</Text>
          <Text style={localStyles.subscriptionPrice}>
            {tariff.price} AED / {tariff.duration_days || 30} {t('days')}
          </Text>
        </View>
        <View
          style={[
            localStyles.subscriptionStatus,
            {backgroundColor: statusColor},
          ]}>
          <Text style={localStyles.subscriptionStatusText}>{statusText}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={styles.colors.gray} />
    </TouchableOpacity>
  );
};

const ActionCard = ({
  imageSource,
  title,
  subtitle,
  onPress,
  style,
  backgroundColor = styles.colors.primary,
}) => (
  <TouchableOpacity style={[localStyles.actionCard, style]} onPress={onPress}>
    <View style={[localStyles.blueSection, {backgroundColor}]}>
      <Image
        source={imageSource}
        style={localStyles.actionImage}
        resizeMode="cover"
      />
    </View>
    <View style={localStyles.whiteSection}>
      <Text style={localStyles.actionTitle}>{title}</Text>
      <Text style={localStyles.actionSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const AvatarsList = ({avatars, count}) => (
  <View style={localStyles.avatarsSection}>
    <View style={localStyles.avatarsContainer}>
      {Array.from({length: Math.min(4, count)}).map((_, index) => (
        <View
          key={index}
          style={[
            localStyles.avatarPlaceholder,
            {marginLeft: index > 0 ? -8 : 0},
          ]}>
          <Ionicons name="person" size={12} color={styles.colors.white} />
        </View>
      ))}
    </View>
  </View>
);

// isImageFile импортирована из AttachmentRenderer

// Получаем URL изображения с правильным базовым URL
const getImageUrl = file => {
  if (!file) return null;

  if (file.uri) return file.uri;

  // Базовый URL backend без /api
  const backendUrl = config.baseUrl.replace('/api', '');

  if (file.url) {
    if (file.url.startsWith('http')) {
      return file.url;
    } else {
      // Добавляем backend URL к относительным путям
      return file.url.startsWith('/')
        ? `${backendUrl}${file.url}`
        : `${backendUrl}/${file.url}`;
    }
  }

  if (file.path) {
    // Для path тоже добавляем backend URL
    return `${backendUrl}/storage/${file.path}`;
  }

  return null;
};

const OrderCard = ({order, onPress, t}) => {
  const statusConfig = useMemo(
    () => getStatusConfig(order.status, t),
    [order.status, t],
  );
  const applicationsCount = useMemo(() => getApplicationsCount(order), [order]);

  // Используем то же изображение, что и для карточки создания заказа
  const imageSource = require('../../ios/assets/src/images/do_order.png');

  return (
    <TouchableOpacity style={localStyles.orderCard} onPress={onPress}>
      <View style={localStyles.orderImageSection}>
        <Image
          source={imageSource}
          style={localStyles.orderMainImage}
          resizeMode="cover"
        />
        <View style={localStyles.statusBadge}>
          <Text
            style={[localStyles.statusBadgeText, {color: statusConfig.color}]}>
            {t(statusConfig.text)}
          </Text>
        </View>
      </View>

      <View style={localStyles.orderInfoSection}>
        <View style={localStyles.orderInfoHeader}>
          <Text style={localStyles.orderNumber}>
            {t('Order')} №{order.id}
          </Text>
          <Text style={localStyles.orderDate}>
            {order.work_date || order.start_date}
          </Text>
        </View>

        <View style={localStyles.orderFooter}>
          <Text style={localStyles.orderMainTitle}>
            {order.name || order.title || t('Untitled')}
          </Text>
          <Text style={localStyles.orderMainPrice}>
            {formatPrice(order.max_amount)}
          </Text>
        </View>

        <View style={localStyles.applicationsSection}>
          {applicationsCount > 0 ? (
            <View style={localStyles.avatarsSection}>
              <AvatarsList
                avatars={PLACEHOLDER_AVATARS}
                count={applicationsCount}
              />
              <Text style={localStyles.applicationsText}>
                +{applicationsCount} {t('applications')}
              </Text>
            </View>
          ) : (
            <Text style={localStyles.noApplicationsText}>
              {applicationsCount} {t('applications')}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Main = ({navigation}) => {
  const {
    banners,
    userProfile,
    notificationsCount,
    loading,
    error,
    currentLocation,
    locationLoading,
    fetchData,
    handleCreateOrder,
    handleDesignGeneration,
    handleNotificationsPress,
  } = useMainScreen(navigation);

  const {t} = useTranslation();

  // ОПТИМИЗАЦИЯ: Эффект обновления данных с кешированием
  useFocusEffect(
    useCallback(() => {
      console.log('Main screen focused');
      // Обновляем в фоне для быстрой навигации
      setTimeout(() => fetchData(), 100);
      return () => {};
    }, [fetchData]),
  );

  // ОПТИМИЗАЦИЯ: Skeleton loading вместо спиннера
  if (loading && (!banners || banners.length === 0)) {
    return (
      <View style={localStyles.container}>
        <View style={{padding: 16}}>
          <OrdersListSkeleton count={2} />
        </View>
      </View>
    );
  }

  if (error) {
    return <ErrorView error={error} onRetry={fetchData} t={t} />;
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
        style={localStyles.scrollContainer}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LocationHeader
          currentLocation={currentLocation}
          locationLoading={locationLoading}
          t={t}
        />

        {/* Информация о подписке скрыта для заказчиков */}

        {/* Кнопки действий всегда показываются */}
        <ActionCard
          imageSource={require('../../ios/assets/src/images/do_order.png')}
          title={t('Make an order')}
          subtitle={t('We have only verified performers')}
          onPress={handleCreateOrder}
          style={localStyles.makeOrderCard}
          backgroundColor={styles.colors.primary}
        />

        <ActionCard
          imageSource={require('../../ios/assets/src/images/generate_design.png')}
          title={t('Design generation')}
          subtitle={t('Interior visualization based on your photos')}
          onPress={handleDesignGeneration}
          style={localStyles.designSection}
          backgroundColor="#E7EFFF"
        />
      </ScrollView>
    </View>
  );
};

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
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  scrollContainer: {
    flex: 1,
  },

  // Стили местоположения
  locationContainer: {
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
    padding: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    height: 18,
  },
  locationIcon: {
    width: 16,
    height: 18,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  locationIconImage: {
    width: 16,
    height: 16,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
    color: styles.colors.actionGray,
    flex: 1,
  },

  // Стили для карточки подписки
  subscriptionCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
  },
  subscriptionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  subscriptionStatusText: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.white,
    fontWeight: '500',
  },

  // Общие стили для карточек действий
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
    padding: 20,
    paddingVertical: 22,
    height: 90,
    justifyContent: 'flex-end',
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#323232',
    marginBottom: 12,
  },
  actionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: styles.colors.actionGray,
    lineHeight: 17,
  },

  // Специфичные стили для отдельных карточек
  makeOrderCard: {
    // Наследует стили от actionCard
  },
  designSection: {
    // Наследует стили от actionCard
  },

  // Стили для списка заказов
  ordersSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: styles.colors.black,
    marginBottom: 16,
  },
  ordersContainer: {
    width: '100%',
    gap: 24,
  },

  // Стили карточки заказа
  orderCard: {
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
  },
  orderImageSection: {
    width: '100%',
    height: 166,
    position: 'relative',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  orderMainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    bottom: 0,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 10,
    left: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#323232',
  },
  orderInfoSection: {
    padding: 12,
    justifyContent: 'space-between',
    gap: 6,
  },
  orderInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(7, 28, 53, 0.47)',
  },
  orderDate: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(7, 28, 53, 0.47)',
    textAlign: 'right',
  },
  orderMainTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#323232',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: styles.colors.white,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: styles.colors.white,
  },
  applicationsText: {
    fontSize: 13,
    fontWeight: '500',
    color: styles.colors.primary,
    marginLeft: 8,
  },
  orderMainPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#323232',
  },
  noApplicationsText: {
    fontSize: 13,
    fontWeight: '500',
    color: styles.colors.primary,
  },
  applicationsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: styles.colors.background,
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingIcon: {
    padding: 20,
    backgroundColor: styles.colors.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: styles.fonSize.md,
    fontWeight: '500',
    color: styles.colors.titles,
    fontFamily: 'Inter',
  },
  loadingSubtext: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    fontFamily: 'Inter',
  },
  errorText: {
    color: styles.colors.red,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: styles.colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: styles.colors.white,
  },
});

// PropTypes
LoadingView.propTypes = {
  t: PropTypes.func.isRequired,
};

ErrorView.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

WelcomeHeader.propTypes = {
  userProfile: PropTypes.object,
  notificationsCount: PropTypes.number,
  onNotificationsPress: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

LocationHeader.propTypes = {
  currentLocation: PropTypes.string,
  locationLoading: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

ActionCard.propTypes = {
  imageSource: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  style: PropTypes.object,
  backgroundColor: PropTypes.string,
};

AvatarsList.propTypes = {
  avatars: PropTypes.arrayOf(PropTypes.string).isRequired,
  count: PropTypes.number.isRequired,
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string, // Сделали необязательным, так как используется fallback

    max_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired, // Может быть строкой или числом
    status: PropTypes.number.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

Main.propTypes = {
  navigation: PropTypes.object.isRequired,
};

export default Main;
