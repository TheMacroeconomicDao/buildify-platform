import {useState, useEffect} from 'react';
import {Alert} from 'react-native';
import {notifyError, notifySuccess, notifyWarning} from '../services/notify';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {subscriptionsService} from '../services';
import {useSelector} from 'react-redux';
import walletService from '../services/walletService';

export const useSubscription = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();

  // Получаем данные подписок из Redux
  const {
    current: currentSubscription,
    tariff,
    available: availablePlans,
    subscription_started_at,
    subscription_ends_at,
    is_active,
    days_until_expiration,
    next_tariff,
    next_subscription_starts_at,
    next_subscription_ends_at,
    used_orders_count,
    used_contacts_count,
    remaining_orders,
    remaining_contacts,
  } = useSelector(state => state.subscriptions);

  // Состояния для работы с UI
  const [loading, setLoading] = useState(true);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [nextSubscription, setNextSubscription] = useState(null);

  // Получение данных о подписке и доступных тарифах
  useEffect(() => {
    fetchData();
  }, []);

  // Принудительно обновляем данные при изменении подписки в Redux
  useEffect(() => {
    console.log('useSubscription - subscription data updated:', {
      tariff,
      days_until_expiration,
      subscription_ends_at,
      next_tariff,
      next_subscription_starts_at,
      next_subscription_ends_at,
    });
  }, [
    tariff,
    days_until_expiration,
    subscription_ends_at,
    next_tariff,
    next_subscription_starts_at,
    next_subscription_ends_at,
  ]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching subscription data...');

      // Получаем данные о текущей подписке и доступных тарифах
      const [subscriptionResult, plansResult] = await Promise.all([
        subscriptionsService.getCurrentSubscription(),
        subscriptionsService.getAvailableSubscriptions(),
      ]);

      console.log('Subscription data fetched:', {
        subscription: subscriptionResult,
        availablePlans: plansResult.length,
      });
    } catch (error) {
      console.error('Ошибка при загрузке данных о подписках:', error);
      setError(t('Failed to load subscription data'));
    } finally {
      setLoading(false);
    }
  };

  // Функция для выбора тарифа
  const selectPlan = planId => {
    setSelectedPlanId(planId);
  };

  // Функция отмены следующей подписки
  const cancelNextSubscription = async () => {
    try {
      Alert.alert(
        t('Cancel Scheduled Subscription'),
        t(
          'Are you sure you want to cancel your scheduled subscription? After your current subscription expires, you will be switched to the Free plan.',
        ),
        [
          {
            text: t('Cancel'),
            style: 'cancel',
          },
          {
            text: t('Confirm'),
            style: 'destructive',
            onPress: async () => {
              // TODO: Здесь будет API вызов для очистки next_* полей
              notifySuccess(
                t('Success'),
                t('Scheduled subscription cancelled'),
              );
              await fetchData();
            },
          },
        ],
      );
    } catch (error) {
      notifyError(
        t('Error'),
        error.message || t('Failed to cancel scheduled subscription'),
      );
    }
  };

  // Функция для отмены подписки
  const cancelSubscription = async () => {
    try {
      setProcessingPurchase(true);

      const response = await subscriptionsService.unsubscribe();

      if (response.success) {
        notifySuccess(
          t('Success'),
          response.message || t('Subscription cancelled'),
        );
        await subscriptionsService.getCurrentSubscription();
      } else {
        notifyError(
          t('Error'),
          response.message || t('Failed to cancel subscription'),
        );
      }
    } catch (error) {
      console.error('Ошибка при отмене подписки:', error);
      notifyError(
        t('Error'),
        t('Failed to cancel subscription. Please try again later.'),
      );
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Функция для оплаты подписки из кошелька
  const payFromWallet = async planId => {
    try {
      setProcessingPurchase(true);
      console.log('Paying subscription from wallet for plan:', planId);

      const response = await walletService.paySubscription(planId);

      notifySuccess(t('Success'), t('Subscription activated successfully'));
      // Обновляем данные
      await fetchData();

      return response;
    } catch (error) {
      console.error('Error paying from wallet:', error);
      notifyError(t('Error'), error.message || t('Failed to pay from wallet'));
      throw error;
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Функция проверки активной подписки и показа предупреждения
  const checkActiveSubscriptionAndProceed = (planId, paymentMethod) => {
    // Проверяем, есть ли активная подписка
    if (is_active && days_until_expiration > 0) {
      const selectedPlan = availablePlans.find(plan => plan.id === planId);
      const planName = selectedPlan?.name || 'выбранный план';

      Alert.alert(
        t('Active Subscription'),
        t(
          'You have an active subscription that expires in {{days}} days. The new subscription ({{planName}}) will extend your current subscription.',
          {
            days: days_until_expiration,
            planName: planName,
          },
        ),
        [
          {
            text: t('Cancel'),
            style: 'cancel',
          },
          {
            text: t('Continue'),
            onPress: () => {
              if (paymentMethod === 'wallet') {
                payFromWallet(planId);
              } else {
                buySubscription(planId);
              }
            },
          },
        ],
      );
    } else {
      // Нет активной подписки, продолжаем как обычно
      if (paymentMethod === 'wallet') {
        payFromWallet(planId);
      } else {
        buySubscription(planId);
      }
    }
  };

  // Функция для оформления подписки
  const buySubscription = async planId => {
    if (!planId) {
      notifyError(t('Error'), t('Please select a plan'));
      return;
    }

    try {
      setProcessingPurchase(true);
      console.log('Starting subscription checkout for plan:', planId);

      const checkoutUrl = await subscriptionsService.checkout(planId);

      if (checkoutUrl) {
        // Для платных тарифов - открываем URL оплаты
        console.log('Checkout URL received:', checkoutUrl);
        console.log('Opening payment URL and navigating to WebPagePay');
        navigation.navigate('WebPagePay', {
          url: checkoutUrl,
          context: 'subscription',
        });
      } else {
        // Для бесплатных тарифов - просто показываем успешное сообщение
        console.log('Free tariff activated successfully');
        notifySuccess(t('Success'), t('Subscription activated successfully'));
        // Обновляем данные
        await fetchData();
      }
    } catch (error) {
      console.error('Ошибка при оформлении подписки:', error);
      // Показываем ошибку от сервера (более понятную для пользователя)
      notifyError(
        t('Error'),
        error.message ||
          t('Failed to process subscription. Please try again later.'),
      );
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Функция для обработки выбора способа оплаты
  const handlePaymentMethodSelected = async (paymentMethod, planId) => {
    try {
      // Используем новую функцию с проверкой активной подписки
      checkActiveSubscriptionAndProceed(planId, paymentMethod);
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  // Функция для обработки действия кнопки в зависимости от текущего состояния
  const handleAction = async () => {
    if (!tariff || !currentSubscription) {
      if (selectedPlanId === null) {
        notifyWarning(t('Warning'), t('Please select a plan'));
        return;
      }
      return selectedPlanId; // Возвращаем ID для показа модального окна
    } else {
      if (selectedPlanId === null) {
        notifyWarning(t('Warning'), t('Please select a new plan'));
        return;
      }
      // Меняем на новый тариф
      return selectedPlanId; // Возвращаем ID для показа модального окна
    }
  };

  // Определение текста кнопки в зависимости от состояния
  const getButtonText = () => {
    if (!tariff || !currentSubscription) return t('Subscribe');
    return selectedPlanId !== null ? t('Change plan') : t('Select new plan');
  };

  // Функция для повторной загрузки данных
  const retryFetchData = () => {
    fetchData();
  };

  // Проверка доступности кнопки действия
  const isActionButtonVisible = () => {
    // Кнопка видна если:
    // 1. У пользователя нет активной подписки
    // 2. У пользователя есть активная подписка и выбран новый тариф
    return (
      !tariff ||
      !currentSubscription ||
      (tariff && currentSubscription && selectedPlanId !== null)
    );
  };

  return {
    userSubscription: {
      active: is_active,
      plan: tariff,
      subscription_started_at,
      subscription_ends_at,
      is_active,
      days_until_expiration,
    },
    nextSubscription: {
      tariff: next_tariff,
      starts_at: next_subscription_starts_at,
      ends_at: next_subscription_ends_at,
    },
    subscriptionLimits: {
      used_orders: used_orders_count,
      used_contacts: used_contacts_count,
      remaining_orders: remaining_orders,
      remaining_contacts: remaining_contacts,
    },
    availablePlans,
    loading,
    processingPurchase,
    error,
    selectedPlanId,
    selectPlan,
    cancelSubscription,
    cancelNextSubscription,
    handleAction,
    handlePaymentMethodSelected,
    getButtonText,
    retryFetchData,
    isActionButtonVisible,
  };
};

export default useSubscription;
