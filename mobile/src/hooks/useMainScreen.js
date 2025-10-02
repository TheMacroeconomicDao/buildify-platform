import React, {useState, useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  api,
  retryApiCall,
  setApiToken,
  subscriptionsService,
} from '../services/index';
import {useTranslation} from 'react-i18next';
import {useLocation} from './useLocation';

export const useMainScreen = navigation => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Получаем подписку из Redux
  const {tariff, days_until_expiration} = useSelector(
    state => state.subscriptions,
  );

  // Получаем состояние авторизации и тип пользователя
  const auth = useSelector(state => state.auth);
  const logged = auth.logged;
  const userType = auth?.userData?.type;

  // Получение геолокации
  const {cityName: currentLocation, loading: locationLoading} = useLocation();

  // Получение количества уведомлений
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
        setNotificationsCount(typeof count === 'number' ? count : 0);
      }
    } catch (error) {
      console.error('Ошибка при загрузке количества уведомлений:', error);
      setNotificationsCount(0);
    }
  }, []);

  // Получение данных пользователя
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await retryApiCall(() => api.user.apiUserMe());

      if (response.success && response.user) {
        setUserProfile(response.user);
        return response.user;
      } else {
        throw new Error(
          response.message || 'Не удалось получить данные пользователя',
        );
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля пользователя:', error);

      // Проверяем статус ошибки - если 401/403, то разлогиниваем и перекидываем на онбординг
      // 400 с "Unauthenticated" теперь обрабатывается глобально в axios интерцепторе
      const status = error.response?.status || error.status;
      if (status === 401 || status === 403) {
        console.log(
          'Ошибка авторизации (401/403) - разлогиниваем пользователя и перекидываем на онбординг',
        );
        setApiToken(null);
        dispatch({type: 'LOG_OUT'});
        navigation.replace('Loading');
        return;
      }

      setUserProfile(null);
      throw error;
    }
  }, [dispatch, navigation]);

  // Получение баннеров с сервера
  const fetchBanners = async () => {
    try {
      const response = await retryApiCall(() => api.banners.bannersList());

      if (response.success && response.result) {
        setBanners(response.result);
        return response.result;
      } else {
        throw new Error(response.message || 'Не удалось получить баннеры');
      }
    } catch (error) {
      console.error('Ошибка при загрузке баннеров:', error);
      setBanners([]);
      throw error;
    }
  };

  // Получение заказов пользователя
  const fetchOrders = async () => {
    try {
      // Проверяем авторизацию перед загрузкой заказов
      if (!auth.logged) {
        console.log('useMainScreen: User not logged in, skipping orders load');
        setOrders([]);
        return [];
      }

      const response = await retryApiCall(() => api.orders.activeList());

      if (response.success && response.result) {
        // Сортируем заказы от новых к старым по дате создания
        const sortedOrders = response.result.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime(); // Убывающий порядок (новые первые)
        });
        setOrders(sortedOrders);
        return sortedOrders;
      } else {
        throw new Error(response.message || 'Не удалось получить заказы');
      }
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
      setOrders([]);
      throw error;
    }
  };

  // Функция для обновления всех данных
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Проверяем только критичный запрос профиля - остальные пропускаем для диагностики
      try {
        await fetchUserProfile();
      } catch (e) {
        setError(`API ошибка: ${e.message}`);
        return;
      }

      // Остальные запросы загружаем только если профиль успешен
      await Promise.allSettled([
        fetchNotificationsCount().catch(() => {}),
        fetchBanners().catch(() => {}),
        fetchOrders().catch(() => {}),
        // ПРИНУДИТЕЛЬНО загружаем данные подписки
        subscriptionsService.getCurrentSubscription().catch(error => {
          console.error('useMainScreen - error loading subscription:', error);
        }),
      ]);
    } catch (error) {
      setError(error.message || 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  }, [fetchNotificationsCount, fetchUserProfile]);

  const {t} = useTranslation();

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    // Проверяем, что пользователь авторизован перед загрузкой данных
    if (!logged) {
      console.log(
        'useMainScreen: User not logged in, skipping initial data load',
      );
      setLoading(false);
      return;
    }

    fetchData();
  }, [logged, fetchData]);

  // ✅ Обновление данных при каждом получении фокуса экраном
  useFocusEffect(
    React.useCallback(() => {
      // Проверяем, что пользователь авторизован перед загрузкой данных
      if (!logged) {
        console.log('useMainScreen: User not logged in, skipping data load');
        return;
      }

      console.log('Главный экран получил фокус - обновляем данные');
      fetchData();
    }, [logged, fetchData]),
  );

  // Навигация к экрану создания заказа
  const handleCreateOrder = () => {
    // Переходим к экрану создания заказа в основном стеке
    navigation.navigate('CreateOrder');
  };

  // Навигация к детальному экрану заказа
  const handleOrderPress = orderId => {
    if (userType === 1 || userType === '1') {
      // Заказчик - используем Order
      navigation.navigate('Order', {orderId});
    } else {
      // Исполнитель - используем OrderWorker
      navigation.navigate('OrderWorker', {orderId});
    }
  };

  // Навигация к экрану генерации дизайна
  const handleDesignGeneration = () => {
    navigation.navigate('DesignGeneration');
  };

  // Навигация к уведомлениям
  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  // Повторная попытка загрузки при ошибке
  const retryLoadData = () => {
    fetchData();
  };

  return {
    orders,
    banners,
    userProfile,
    notificationsCount,
    loading,
    error,
    currentLocation,
    locationLoading,
    tariff,
    days_until_expiration,
    fetchData,
    retryLoadData,
    handleCreateOrder,
    handleOrderPress,
    handleDesignGeneration,
    handleNotificationsPress,
  };
};

export default useMainScreen;
