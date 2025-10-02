import {
  api,
  retryApiCall,
  setApiToken,
  subscriptionsService,
} from '../services/index';
import {useDispatch, useSelector} from 'react-redux';
import {useState, useEffect, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import React from 'react';
import SplashScreen from 'react-native-splash-screen';
import {clearOnboardingData} from '../utils/onboardingUtils';

export function useProfile() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const logged = auth.logged;
  const userData = auth.userData;

  const [errors, setErrors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [userSettings, setUserSettings] = useState(null);

  async function handleLoadUserData() {
    return retryApiCall(() => api.user.apiUserMe())
      .then(response => {
        if (response.success) {
          dispatch({type: 'SET_USERDATA', payload: {...response.result}});
          return [];
        }
        return [{message: 'Failed to load user data'}];
      })
      .catch(err => {
        console.error('Ошибка при загрузке данных пользователя:', err);

        // Проверяем статус ошибки - если 401/403, то разлогиниваем и перекидываем на онбординг
        // 400 с "Unauthenticated" теперь обрабатывается глобально в axios интерцепторе
        const status = err.response?.status || err.status;
        if (status === 401 || status === 403) {
          console.log(
            'Ошибка авторизации (401/403) - разлогиниваем пользователя и перекидываем на онбординг',
          );
          setApiToken(null);
          dispatch({type: 'LOG_OUT'});
          navigation.replace('Loading');
          return [{message: 'Unauthorized - logged out'}];
        }

        if (err.response?.data?.error) {
          return [{url: err?.request._url, message: err.response?.data?.error}];
        } else {
          return [{url: err?.request._url, message: err.message}];
        }
      });
  }

  async function handleLoadUserSettings() {
    try {
      const response = await retryApiCall(() => api.user.apiUserSettingsGet());
      if (response.success) {
        setUserSettings(response.result);
        return [];
      }
      return [{message: 'Failed to load user settings'}];
    } catch (err) {
      console.error('Ошибка при загрузке настроек пользователя:', err);
      if (err.response?.data?.error) {
        return [{url: err?.request._url, message: err.response?.data?.error}];
      } else {
        return [{url: err?.request._url, message: err.message}];
      }
    }
  }

  const handleRefresh = useCallback(async () => {
    setErrors([]);
    let errs = await handleLoadUserData();

    const settingsErrs = await handleLoadUserSettings();
    errs = [...errs, ...settingsErrs];

    // Загружаем данные о подписке (только если пользователь аутентифицирован)
    if (logged) {
      try {
        console.log(
          'useProfile - loading subscription data for authenticated user',
        );
        await subscriptionsService.getCurrentSubscription();
      } catch (error) {
        console.error('Ошибка при загрузке данных подписки:', error);
      }
    } else {
      console.log(
        'useProfile - user not logged in, skipping subscription data load',
      );
    }

    setErrors(errs);
    setRefreshing(false);
    setIsFirstLoad(false);
  }, [logged]);

  async function handleDeleteAccount() {
    retryApiCall(() => api.user.apiUserDelete({})).then(async () => {
      // Очищаем данные онбординга при удалении аккаунта
      await clearOnboardingData();
      setApiToken(null);
      dispatch({type: 'LOG_OUT'});
    });
  }

  async function handleLogout() {
    retryApiCall(() => api.logout.apiLogout()).then(async () => {
      // При обычном выходе НЕ очищаем данные онбординга
      // чтобы пользователь попал на экран авторизации, а не на онбординг
      setApiToken(null);
      dispatch({type: 'LOG_OUT'});
    });
  }

  useEffect(() => {
    if (!logged) {
      return navigation.replace('Loading');
    }
  }, [logged, navigation]);

  useEffect(() => {
    SplashScreen.hide();
    handleRefresh();
  }, []);

  // ✅ Обновление данных при получении фокуса экраном
  useFocusEffect(
    React.useCallback(() => {
      // Проверяем, что пользователь авторизован перед обновлением данных
      if (!logged) {
        console.log('useProfile: User not logged in, skipping data refresh');
        return;
      }

      console.log('Экран получил фокус - обновляем данные профиля');
      handleRefresh();
    }, [logged, handleRefresh]),
  );

  return {
    refreshing,
    errors,
    userData,
    userSettings,
    handleRefresh,
    handleDeleteAccount,
    handleLogout,
    handleLoadUserSettings,
    isFirstLoad,
  };
}
