// Типы действий
export const SUBSCRIPTION_TYPES = {
  SET_SUBSCRIPTION: 'SET_SUBSCRIPTION',
  SET_AVAILABLE_SUBSCRIPTIONS: 'SET_AVAILABLE_SUBSCRIPTIONS',
  CLEAR_SUBSCRIPTION: 'CLEAR_SUBSCRIPTION',
};

// Начальное состояние
const initialState = {
  current: null,
  tariff: null,
  available: [],
  loading: false,
  error: null,
  subscription_started_at: null,
  subscription_ends_at: null,
  is_active: true,
  days_until_expiration: null,
  // Поля следующей подписки
  next_tariff: null,
  next_subscription_starts_at: null,
  next_subscription_ends_at: null,
  // Данные об использовании лимитов
  used_orders_count: 0,
  used_contacts_count: 0,
  remaining_orders: 0,
  remaining_contacts: 0,
};

// Редюсер
export const subscriptions = (state = initialState, action) => {
  switch (action.type) {
    case SUBSCRIPTION_TYPES.SET_SUBSCRIPTION:
      return {
        ...state,
        current: action.payload.subscription || null,
        tariff: action.payload.tariff || null,
        subscription_started_at: action.payload.subscription_started_at || null,
        subscription_ends_at: action.payload.subscription_ends_at || null,
        is_active:
          action.payload.is_active !== undefined
            ? action.payload.is_active
            : true,
        days_until_expiration: action.payload.days_until_expiration || null,
        // Поля следующей подписки
        next_tariff: action.payload.next_tariff || null,
        next_subscription_starts_at:
          action.payload.next_subscription_starts_at || null,
        next_subscription_ends_at:
          action.payload.next_subscription_ends_at || null,
        // Данные об использовании лимитов
        used_orders_count: action.payload.used_orders_count || 0,
        used_contacts_count: action.payload.used_contacts_count || 0,
        remaining_orders: action.payload.remaining_orders || 0,
        remaining_contacts: action.payload.remaining_contacts || 0,
        error: null,
      };
    case SUBSCRIPTION_TYPES.SET_AVAILABLE_SUBSCRIPTIONS:
      return {
        ...state,
        available: action.payload || [],
        error: null,
      };
    case SUBSCRIPTION_TYPES.CLEAR_SUBSCRIPTION:
      return {
        ...state,
        current: null,
        tariff: null,
        subscription_started_at: null,
        subscription_ends_at: null,
        is_active: true,
        days_until_expiration: null,
        // Очищаем поля следующей подписки
        next_tariff: null,
        next_subscription_starts_at: null,
        next_subscription_ends_at: null,
        // Сбрасываем данные об использовании лимитов
        used_orders_count: 0,
        used_contacts_count: 0,
        remaining_orders: 0,
        remaining_contacts: 0,
      };
    default:
      return state;
  }
};

// Action creators
export const setSubscription = data => ({
  type: SUBSCRIPTION_TYPES.SET_SUBSCRIPTION,
  payload: data,
});

export const setAvailableSubscriptions = subscriptions => ({
  type: SUBSCRIPTION_TYPES.SET_AVAILABLE_SUBSCRIPTIONS,
  payload: subscriptions,
});

export const clearSubscription = () => ({
  type: SUBSCRIPTION_TYPES.CLEAR_SUBSCRIPTION,
});
