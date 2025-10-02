import {useState, useEffect, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useProfile} from './useProfile';
import {api, retryApiCall, subscriptionsService} from '../services/index';
import i18n from 'i18next';
import AsyncStorage from '@react-native-community/async-storage';
import {Alert} from 'react-native';
import {notifyError, notifyInfo, notifySuccess} from '../services/notify';
import {useFocusEffect} from '@react-navigation/native';

export const useMenu = navigation => {
  const {
    refreshing,
    errors,
    userData,
    handleRefresh,
    handleDeleteAccount,
    handleLogout,
    isFirstLoad,
  } = useProfile();

  const [haveNotifications, setHaveNotifications] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showLogout, setShowLogout] = useState(false);

  // Получаем информацию о подписке из Redux
  const subscriptionData = useSelector(state => state.subscriptions);

  const fetchNotificationsCount = useCallback(async () => {
    try {
      const response = await retryApiCall(() =>
        api.notification.getCountNotifications(),
      );
      if (response.success) {
        const count =
          typeof response.result === 'number'
            ? response.result
            : response.result?.count || 0;
        const finalCount = typeof count === 'number' ? count : 0;
        setNotificationsCount(finalCount);
        setHaveNotifications(finalCount > 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications count:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotificationsCount();
    // Принудительно загружаем данные подписки при инициализации меню
    if (userData?.id) {
      console.log('useMenu - initial subscription data load');
      subscriptionsService.getCurrentSubscription().catch(error => {
        console.error('useMenu - error loading subscription data:', error);
      });
    }
  }, [fetchNotificationsCount, userData?.id]);

  // Обновляем количество уведомлений при возвращении на экран
  useFocusEffect(
    useCallback(() => {
      fetchNotificationsCount();
      // Также обновляем данные о подписке
      if (userData?.id) {
        console.log('useMenu - refreshing subscription data on focus');
        subscriptionsService.getCurrentSubscription().catch(error => {
          console.error('useMenu - error refreshing subscription data:', error);
        });
      }
    }, [fetchNotificationsCount, userData?.id]),
  );

  // Функция для сброса онбординга (для тестирования)
  const resetOnboarding = async () => {
    try {
      const userId = userData?.id;
      if (userId) {
        const onboardingKey = `onboarding_completed_${userId}`;
        await AsyncStorage.removeItem(onboardingKey);
        notifySuccess(t('Success'), t('Restart the app to view onboarding'));
      }
    } catch (error) {
      console.error('Ошибка при сбросе онбординга:', error);
      notifyError(t('Error'), t('Failed to reset onboarding'));
    }
  };

  const navigateToProfile = () => {
    navigation.navigate('PersonalData');
  };

  const navigateToNotifications = () => {
    navigation.navigate('Notifications');
  };

  // Переопределяем handleRefresh чтобы обновлять и уведомления
  const handleRefreshWithNotifications = useCallback(async () => {
    await handleRefresh();
    await fetchNotificationsCount();
  }, [handleRefresh, fetchNotificationsCount]);

  const navigateToSupport = () => {
    navigation.push('WebPage', {url: 'https://jivo.chat/Gok2Q2BoZ8'});
  };

  const navigateToSubscription = () => {
    navigation.navigate('Subscription');
  };

  const navigateToLanguage = () => {
    navigation.navigate('Language');
  };

  const navigateToPortfolio = () => {
    navigation.navigate('Portfolio', {executorId: userData?.id});
  };

  const navigateToReferrals = () => {
    navigation.navigate('Referrals');
  };

  const openLogoutModal = () => {
    setShowLogout(true);
  };

  const closeLogoutModal = () => {
    setShowLogout(false);
  };

  // Создаем функцию для получения текста индикатора подписки
  const getSubscriptionIndicator = () => {
    console.log('useMenu - subscriptionData:', subscriptionData);

    if (!subscriptionData?.tariff) {
      console.log('useMenu - no tariff found');
      return null;
    }

    const daysLeft = subscriptionData.days_until_expiration;
    console.log('useMenu - daysLeft:', daysLeft);

    if (daysLeft === null) {
      // Бесплатная подписка
      console.log('useMenu - free subscription (daysLeft is null)');
      return null;
    }

    if (daysLeft <= 0) {
      console.log('useMenu - subscription expired');
      return 'EXPIRED';
    }

    if (daysLeft <= 3) {
      console.log('useMenu - subscription expires soon:', daysLeft);
      return daysLeft.toString();
    }

    console.log('useMenu - subscription is active, more than 3 days left');
    return null;
  };

  return {
    refreshing,
    errors,
    userData,
    handleRefresh: handleRefreshWithNotifications,
    isFirstLoad,
    haveNotifications,
    notificationsCount,
    showLogout,
    resetOnboarding,
    navigateToProfile,
    navigateToNotifications,
    navigateToSupport,
    navigateToSubscription,
    navigateToLanguage,
    navigateToPortfolio,
    navigateToReferrals,
    openLogoutModal,
    closeLogoutModal,
    fetchNotificationsCount,
    subscriptionIndicator: getSubscriptionIndicator(),
    subscriptionData,
  };
};

export default useMenu;
