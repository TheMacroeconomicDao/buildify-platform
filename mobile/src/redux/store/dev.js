import {createStore, applyMiddleware} from 'redux';
import {thunk} from 'redux-thunk';
import logger from 'redux-logger';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-community/async-storage';
import rootReducer from '../reducers/index.js';
import {setApiToken} from '../../services/index';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, applyMiddleware(thunk));

const rehydrationCallback = () => {};

export const persistor = persistStore(store, null, rehydrationCallback);

store.subscribe(() => {
  const state = store.getState();
  console.log('Redux store updated, auth state:', state.auth); // ✅ Отладочное логирование
  if (state.auth && state.auth.logged && state.auth.token) {
    console.log('Setting token from Redux store:', state.auth.token); // ✅ Отладочное логирование
    setApiToken(state.auth.token);
  } else {
    console.log('Clearing token from Redux store'); // ✅ Отладочное логирование
    setApiToken(null);
  }

  // Логгирование изменений в состоянии подписок
  if (state.subscriptions && state.subscriptions.tariff) {
    console.log(
      'Redux store updated, subscription state:',
      state.subscriptions,
    );
  }
});
