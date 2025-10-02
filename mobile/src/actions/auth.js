import {api, retryApiCall} from '../services/index';
import config from '../config';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import {clearOnboardingData} from '../utils/onboardingUtils';
import {performLogout} from '../utils/logoutHelper';

export function subscribe_device(data) {
  return retryApiCall(() =>
    api.request({
      method: 'POST',
      url: '/sra_notifications',
      data: data,
    }),
  ).catch(err => {
    console.log(err);
  });
}

export function logout() {
  return async dispatch => {
    // При обычном выходе НЕ очищаем данные онбординга
    // чтобы пользователь попал на экран авторизации, а не на онбординг
    performLogout(dispatch);
  };
}

export function deleteAccount() {
  return async dispatch => {
    // Очищаем данные онбординга при удалении аккаунта
    await clearOnboardingData();
    performLogout(dispatch);
  };
}

export function login(data) {
  return dispatch => {
    dispatch({type: 'LOG_IN', payload: data});
  };
}

export function set_categories(data) {
  return dispatch => {
    dispatch({type: 'SET_CATEGORIES', payload: data});
  };
}
