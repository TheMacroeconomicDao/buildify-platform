const initialState = {
  isConnected: false,
  lastMessage: null,
  notificationCount: 0,
  orders: [],
  shouldRefreshOrders: false,
  shouldRefreshUserData: false,
  lastVerificationUpdate: null,
};

export const websocket = (state = initialState, action) => {
  switch (action.type) {
    case 'WEBSOCKET_CONNECTED':
      return {
        ...state,
        isConnected: true,
      };

    case 'WEBSOCKET_DISCONNECTED':
      return {
        ...state,
        isConnected: false,
      };

    case 'WEBSOCKET_MESSAGE_RECEIVED':
      return {
        ...state,
        lastMessage: action.payload,
      };

    case 'INCREMENT_NOTIFICATION_COUNT':
      return {
        ...state,
        notificationCount: state.notificationCount + 1,
      };

    case 'RESET_NOTIFICATION_COUNT':
      return {
        ...state,
        notificationCount: 0,
      };

    case 'UPDATE_ORDER':
      const updatedOrders = state.orders.map(order =>
        order.id === action.payload.id ? {...order, ...action.payload} : order,
      );

      // Если заказ не найден, добавляем его
      const orderExists = state.orders.some(
        order => order.id === action.payload.id,
      );
      if (!orderExists) {
        updatedOrders.push(action.payload);
      }

      return {
        ...state,
        orders: updatedOrders,
      };

    case 'REFRESH_ORDERS_REQUESTED':
      return {
        ...state,
        shouldRefreshOrders: true,
      };

    case 'REFRESH_ORDERS_COMPLETED':
      return {
        ...state,
        shouldRefreshOrders: false,
      };

    case 'REFRESH_USER_DATA_REQUESTED':
      return {
        ...state,
        shouldRefreshUserData: true,
      };

    case 'REFRESH_USER_DATA_COMPLETED':
      return {
        ...state,
        shouldRefreshUserData: false,
      };

    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload,
      };

    case 'VERIFICATION_STATUS_UPDATED':
      return {
        ...state,
        lastVerificationUpdate: {
          ...action.payload,
          timestamp: new Date().toISOString(),
        },
      };

    default:
      return state;
  }
};
