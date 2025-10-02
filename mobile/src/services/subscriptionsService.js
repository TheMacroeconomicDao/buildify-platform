import {unifiedApi, retryApiCall} from './index';
import {
  setSubscription,
  setAvailableSubscriptions,
} from '../redux/reducers/subscriptions';
import {store} from '../redux/store';

export const subscriptionsService = {
  // Получить все доступные подписки
  getAvailableSubscriptions: async () => {
    try {
      const response = await retryApiCall(() =>
        unifiedApi.subscriptionsGetAll(),
      );

      console.log('Available subscriptions response:', response);

      // Проверяем успешность ответа и наличие данных в правильных местах
      if (response && response.success) {
        // Проверяем различные возможные пути к данным подписок
        let subscriptions = [];

        if (Array.isArray(response.subscriptions)) {
          // Данные находятся напрямую в response.subscriptions
          subscriptions = response.subscriptions;
        } else if (
          response.result &&
          Array.isArray(response.result.subscriptions)
        ) {
          // Данные находятся в response.result.subscriptions
          subscriptions = response.result.subscriptions;
        } else if (
          response.data &&
          Array.isArray(response.data.subscriptions)
        ) {
          // Данные находятся в response.data.subscriptions
          subscriptions = response.data.subscriptions;
        }

        console.log('Extracted subscriptions:', subscriptions);

        // Диспатчим в Redux доступные подписки
        store.dispatch(setAvailableSubscriptions(subscriptions));
        return subscriptions;
      } else {
        console.warn('Invalid available subscriptions response:', response);
        return [];
      }
    } catch (error) {
      console.error('Error getting available subscriptions:', error);
      return [];
    }
  },

  // Получить текущую подписку пользователя
  getCurrentSubscription: async () => {
    try {
      const response = await retryApiCall(() =>
        unifiedApi.subscriptionsGetMy(),
      );

      console.log('Current subscription response:', response);

      // Проверяем успешность ответа
      if (response && response.success) {
        // Проверяем различные возможные пути к данным подписки
        let subscription = null;
        let tariff = null;

        if (response.subscription) {
          // Данные находятся напрямую в response
          subscription = response.subscription;
          tariff = response.tariff;
        } else if (response.result) {
          // Данные находятся в response.result
          subscription = response.result.subscription;
          tariff = response.result.tariff;
        } else if (response.data) {
          // Данные находятся в response.data
          subscription = response.data.subscription;
          tariff = response.data.tariff;
        }

        console.log('Extracted subscription data:', {subscription, tariff});

        // Извлекаем дополнительные поля о подписке
        let subscriptionStartedAt =
          response.subscription_started_at ||
          response.result?.subscription_started_at ||
          response.data?.subscription_started_at ||
          null;
        let subscriptionEndsAt =
          response.subscription_ends_at ||
          response.result?.subscription_ends_at ||
          response.data?.subscription_ends_at ||
          null;
        let isActive =
          response.is_active !== undefined
            ? response.is_active
            : response.result?.is_active !== undefined
            ? response.result.is_active
            : response.data?.is_active !== undefined
            ? response.data.is_active
            : true;
        let daysUntilExpiration =
          response.days_until_expiration !== undefined
            ? response.days_until_expiration
            : response.result?.days_until_expiration !== undefined
            ? response.result.days_until_expiration
            : response.data?.days_until_expiration !== undefined
            ? response.data.days_until_expiration
            : null;

        // Извлекаем данные о следующей подписке
        let nextTariff =
          response.next_tariff ||
          response.result?.next_tariff ||
          response.data?.next_tariff ||
          null;
        let nextSubscriptionStartsAt =
          response.next_subscription_starts_at ||
          response.result?.next_subscription_starts_at ||
          response.data?.next_subscription_starts_at ||
          null;
        let nextSubscriptionEndsAt =
          response.next_subscription_ends_at ||
          response.result?.next_subscription_ends_at ||
          response.data?.next_subscription_ends_at ||
          null;

        // Извлекаем данные об использовании лимитов
        let usedOrdersCount =
          response.used_orders_count ||
          response.result?.used_orders_count ||
          response.data?.used_orders_count ||
          0;
        let usedContactsCount =
          response.used_contacts_count ||
          response.result?.used_contacts_count ||
          response.data?.used_contacts_count ||
          0;
        let remainingOrders =
          response.remaining_orders ||
          response.result?.remaining_orders ||
          response.data?.remaining_orders ||
          0;
        let remainingContacts =
          response.remaining_contacts ||
          response.result?.remaining_contacts ||
          response.data?.remaining_contacts ||
          0;

        console.log('Subscription fields extracted:', {
          subscriptionStartedAt,
          subscriptionEndsAt,
          isActive,
          daysUntilExpiration,
          nextTariff,
          nextSubscriptionStartsAt,
          nextSubscriptionEndsAt,
        });

        const subscriptionData = {
          subscription: subscription || null,
          tariff: tariff || null,
          subscription_started_at: subscriptionStartedAt,
          subscription_ends_at: subscriptionEndsAt,
          is_active: isActive,
          days_until_expiration: daysUntilExpiration,
          // Данные об использовании лимитов
          used_orders_count: usedOrdersCount,
          used_contacts_count: usedContactsCount,
          remaining_orders: remainingOrders,
          remaining_contacts: remainingContacts,
          // Данные о следующей подписке
          next_tariff: nextTariff,
          next_subscription_starts_at: nextSubscriptionStartsAt,
          next_subscription_ends_at: nextSubscriptionEndsAt,
        };

        console.log('Final subscription data to dispatch:', subscriptionData);

        // Диспатчим в Redux текущую подписку
        store.dispatch(setSubscription(subscriptionData));

        return subscriptionData;
      } else {
        console.warn('Invalid current subscription response:', response);
        return {subscription: null, tariff: null};
      }
    } catch (error) {
      console.error('Error getting current subscription:', error);
      return {subscription: null, tariff: null};
    }
  },

  // Отменить подписку
  unsubscribe: async () => {
    try {
      const response = await retryApiCall(() =>
        unifiedApi.subscriptionsUnsubscribe(),
      );

      console.log('Unsubscribe response:', response);

      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to unsubscribe');
      }

      // После успешной отмены подписки, обновляем данные в Redux
      await subscriptionsService.getCurrentSubscription();

      return response;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  },

  // Оформить подписку на тариф
  checkout: async tariffId => {
    try {
      if (!tariffId || isNaN(parseInt(tariffId))) {
        throw new Error('Invalid tariff ID');
      }

      // Преобразуем tariffId в число, если он передан как строка
      const numericTariffId = parseInt(tariffId);

      const response = await retryApiCall(() =>
        unifiedApi.subscriptionsCheckout(numericTariffId),
      );

      console.log('Checkout response:', response);

      if (!response || !response.success) {
        // Используем сообщение от сервера для более понятной ошибки
        throw new Error(response?.message || 'Failed to create checkout');
      }

      // Для бесплатных тарифов может не быть checkout_url
      if (response.is_free) {
        // Для бесплатного тарифа обновляем подписку и возвращаем null (без перехода на оплату)
        await subscriptionsService.getCurrentSubscription();
        return null;
      }

      // Проверяем различные возможные пути к URL оплаты
      let checkoutUrl = response.checkout_url;

      if (!checkoutUrl && response.result) {
        checkoutUrl = response.result.checkout_url;
      } else if (!checkoutUrl && response.data) {
        checkoutUrl = response.data.checkout_url;
      }

      if (!checkoutUrl) {
        throw new Error('Checkout URL not found in response');
      }

      return checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  },
};

export default subscriptionsService;
