import {useState, useEffect, useCallback, useRef} from 'react';
import {
  api,
  retryApiCall,
  subscriptionsService,
  setApiToken,
} from '../services/index';
import walletService from '../services/walletService';
import {useTranslation} from 'react-i18next';
import {useSelector, useDispatch} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import React from 'react';

const MAX_RETRY_COUNT = 3; // Максимальное количество повторных попыток
const RETRY_DELAY = 15000; // Интервал между повторными запросами (15 секунд)

const useMainWorker = navigation => {
  const [orders, setOrders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
  const [wallet, setWallet] = useState({balance: 0, currency: 'aed'});
  const [userProfile, setUserProfile] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  // Получаем подписку и тариф из Redux
  const {
    tariff,
    current: currentSubscription,
    days_until_expiration,
    remaining_orders,
    remaining_contacts,
  } = useSelector(state => state.subscriptions);

  // Счетчик повторных попыток
  const retryCountRef = useRef(0);
  // Таймер повторного запроса
  const retryTimerRef = useRef(null);
  // Флаг для предотвращения параллельных запросов
  const isLoadingRef = useRef(false);
  // Последние успешно загруженные данные для восстановления при ошибках
  const lastSuccessfulDataRef = useRef({
    orders: [],
    banners: [],
  });

  const fetchData = useCallback(
    async (isRetry = false) => {
      // Проверяем авторизацию перед загрузкой данных
      if (!auth.logged) {
        console.log('useMainWorker: User not logged in, skipping data load');
        setLoading(false);
        setOrders([]);
        setBanners([]);
        setError(null);
        isLoadingRef.current = false;
        return;
      }

      // Предотвращаем параллельные запросы
      if (isLoadingRef.current) {
        console.log('Запрос уже выполняется, пропускаем');
        return;
      }

      isLoadingRef.current = true;
      setLoading(true);

      if (!isRetry) {
        setError(null);
      }

      try {
        console.log(
          `Fetching worker orders & banners... (попытка ${
            retryCountRef.current + 1
          }/${MAX_RETRY_COUNT + 1})`,
        );

        // ✅ Используем эндпоинт для получения доступных заказов по категориям исполнителя
        // и получаем также данные по подпискам
        const [
          ordersResponse,
          bannersResponse,
          subscriptionResponse,
          walletInfo,
          userResponse,
          notificationsResponse,
        ] = await Promise.all([
          retryApiCall(() => api.orders.ordersList()),
          retryApiCall(() => api.banners.bannersList()),
          retryApiCall(() => subscriptionsService.getCurrentSubscription()),
          retryApiCall(() => walletService.getWallet()),
          retryApiCall(() => api.user.apiUserMe()),
          retryApiCall(() => api.notification.getCountNotifications()),
        ]);

        console.log('Orders response:', JSON.stringify(ordersResponse));
        console.log('Banners response:', JSON.stringify(bannersResponse));
        console.log('Subscription response:', subscriptionResponse);

        // При успешном ответе сохраняем данные
        if (ordersResponse.success && bannersResponse.success) {
          const ordersData = ordersResponse.result || ordersResponse.data || [];
          // Сортируем заказы от новых к старым по дате создания
          const newOrders = ordersData.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB.getTime() - dateA.getTime(); // Убывающий порядок (новые первые)
          });
          const newBanners =
            bannersResponse.result || bannersResponse.data || [];

          // Сохраняем полученные данные
          setOrders(newOrders);
          setBanners(newBanners);
          setWallet(walletInfo);

          // Сохраняем профиль пользователя
          if (userResponse?.success) {
            const userData = userResponse.result || userResponse.data;
            setUserProfile(userData);

            // Также обновляем Redux для синхронизации данных
            dispatch({
              type: 'SET_USERDATA',
              payload: userData,
            });
          }

          // Сохраняем количество уведомлений
          if (notificationsResponse?.success) {
            const count =
              typeof notificationsResponse.result === 'number'
                ? notificationsResponse.result
                : notificationsResponse.result?.count || 0;
            setNotificationsCount(count);
          }

          // Сохраняем успешно полученные данные для возможного восстановления при ошибках
          lastSuccessfulDataRef.current.orders = newOrders;
          lastSuccessfulDataRef.current.banners = newBanners;

          // Сбрасываем счетчик повторных попыток при успехе
          retryCountRef.current = 0;
          setError(null);
          console.log('API response completely successful');
        } else {
          // При ошибке в одном из запросов
          const errorMessage =
            ordersResponse.message ||
            bannersResponse.message ||
            t('Failed to load data');
          console.warn('API response unsuccessful:', {
            message: errorMessage,
            ordersResponse,
            bannersResponse,
          });

          // Увеличиваем счетчик повторных попыток
          retryCountRef.current += 1;

          // Восстанавливаем последние успешные данные если текущие пустые
          if (
            orders.length === 0 &&
            lastSuccessfulDataRef.current.orders.length > 0
          ) {
            setOrders(lastSuccessfulDataRef.current.orders);
          }

          if (
            banners.length === 0 &&
            lastSuccessfulDataRef.current.banners.length > 0
          ) {
            setBanners(lastSuccessfulDataRef.current.banners);
          }

          // Устанавливаем ошибку только если это не автоматический повтор
          if (!isRetry) {
            setError(errorMessage);
          }
        }
      } catch (err) {
        console.error('Error in useMainWorker:', err, err.stack);

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
          return;
        }

        // В случае ошибки сохраняем текст в state.error, но state.orders и т.д.
        // останутся предыдущими значениями или будут восстановлены из кэша
        if (!isRetry) {
          setError(t('An error occurred while loading data'));
        }

        // Увеличиваем счетчик повторных попыток
        retryCountRef.current += 1;

        // Восстанавливаем последние успешные данные для обеспечения стабильности UI
        // но только если данные были пустыми
        if (
          orders.length === 0 &&
          lastSuccessfulDataRef.current.orders.length > 0
        ) {
          setOrders(lastSuccessfulDataRef.current.orders);
        }

        if (
          banners.length === 0 &&
          lastSuccessfulDataRef.current.banners.length > 0
        ) {
          setBanners(lastSuccessfulDataRef.current.banners);
        }
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [t, orders.length, banners.length, auth.logged],
  );

  // Запускаем начальную загрузку данных
  useEffect(() => {
    fetchData();

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [fetchData]);

  // ✅ Обновление данных при каждом получении фокуса экраном
  useFocusEffect(
    React.useCallback(() => {
      console.log('Главный экран исполнителя получил фокус - обновляем данные');
      refreshData();
    }, [refreshData]),
  );

  // Устанавливаем интервал для повторного запроса в случае ошибки
  useEffect(() => {
    // Очищаем предыдущий таймер, если он существует
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Если есть ошибка И количество попыток не превышено И сеть доступна, выполняем повторный запрос
    if (
      error &&
      retryCountRef.current <= MAX_RETRY_COUNT &&
      isNetworkAvailable
    ) {
      console.log(
        `Запланирован повторный запрос через ${
          RETRY_DELAY / 1000
        } секунд (попытка ${retryCountRef.current}/${MAX_RETRY_COUNT})`,
      );

      retryTimerRef.current = setTimeout(() => {
        console.log('Выполняется повторный запрос после ошибки');
        fetchData(true); // true означает, что это повторный запрос
      }, RETRY_DELAY);
    }

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [error, fetchData, isNetworkAvailable]);

  // Обработчик для ручного обновления данных
  const refreshData = useCallback(() => {
    // Сбрасываем счетчик повторных попыток при ручном обновлении
    retryCountRef.current = 0;
    fetchData();
  }, [fetchData]);

  // Обработчики нажатий на кнопки
  const handleSubscriptionPress = useCallback(() => {
    navigation.navigate('Subscription');
  }, [navigation]);

  const handleWalletPress = useCallback(() => {
    navigation.navigate('Wallet');
  }, [navigation]);

  const handlePersonalDataPress = useCallback(() => {
    navigation.navigate('PersonalData');
  }, [navigation]);

  const handleOrderPress = useCallback(
    orderId => {
      navigation.navigate('OrderWorker', {orderId});
    },
    [navigation],
  );

  const handleNotificationsPress = useCallback(() => {
    navigation.navigate('Notifications');
  }, [navigation]);

  return {
    orders,
    banners,
    tariff,
    currentSubscription,
    days_until_expiration,
    remaining_orders,
    remaining_contacts,
    wallet,
    userProfile,
    notificationsCount,
    loading,
    error,
    isNetworkAvailable,
    fetchData: refreshData,
    handleSubscriptionPress,
    handleWalletPress,
    handlePersonalDataPress,
    handleOrderPress,
    handleNotificationsPress,
  };
};

export default useMainWorker;
