import {useState, useEffect, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {notifyError, notifySuccess} from '../services/notify';
import {api, setApiToken} from '../services';

export default function useMainMediator(navigation) {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [orders, setOrders] = useState([]); // Все заказы (для общего списка)
  const [availableOrders, setAvailableOrders] = useState([]); // Доступные заказы для посредника
  const [activeDeals, setActiveDeals] = useState([]); // Активные сделки посредника
  const [banners, setBanners] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Получаем все заказы (для общего списка)
      const ordersResponse = await api.orders.ordersList();
      console.log('Orders response:', ordersResponse);

      if (ordersResponse.success) {
        const ordersData = ordersResponse.result || ordersResponse.data || [];
        console.log('Orders data:', ordersData);
        const sortedOrders = ordersData.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime(); // Убывающий порядок (новые первые)
        });
        setOrders(sortedOrders);
      }

      // Получаем доступные заказы для посредника
      try {
        const availableOrdersResponse = await api.mediator.getAvailableOrders();
        console.log('Available orders response:', availableOrdersResponse);
        if (availableOrdersResponse.success) {
          const availableOrdersData = availableOrdersResponse.result || [];
          console.log('Available orders data:', availableOrdersData);
          const sortedAvailableOrders = availableOrdersData.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB.getTime() - dateA.getTime(); // Убывающий порядок (новые первые)
          });
          setAvailableOrders(sortedAvailableOrders);
        }
      } catch (error) {
        console.log('Could not fetch available orders:', error);
        setAvailableOrders([]);
      }

      // Получаем активные сделки посредника
      try {
        const activeDealsResponse = await api.mediator.getActiveDeals();
        console.log('Active deals response:', activeDealsResponse);
        if (activeDealsResponse.success) {
          const activeDealsData = activeDealsResponse.result || [];
          console.log('Active deals data:', activeDealsData);
          // Сортируем активные сделки от новых к старым по дате создания
          const sortedActiveDeals = activeDealsData.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB.getTime() - dateA.getTime(); // Убывающий порядок (новые первые)
          });
          setActiveDeals(sortedActiveDeals);
        }
      } catch (error) {
        console.log('Could not fetch active deals:', error);
        setActiveDeals([]);
      }

      // Получаем баннеры
      const bannersResponse = await api.banners.bannersList();

      if (bannersResponse.success) {
        setBanners(bannersResponse.result || []);
      }

      // Получаем профиль пользователя
      const profileResponse = await api.user.apiUserMe();
      if (profileResponse.success) {
        setUserProfile(profileResponse.result || profileResponse.data);
      }

      // Получаем количество уведомлений
      try {
        const countResponse = await api.notification.getCountNotifications();
        if (countResponse.success) {
          const count = countResponse.result || countResponse.data || 0;
          setNotificationsCount(
            typeof count === 'number' ? count : count.count || 0,
          );
        }
      } catch (notificationError) {
        console.log('Could not fetch notifications count:', notificationError);
        setNotificationsCount(0);
      }
    } catch (error) {
      console.error('Error fetching mediator data:', error);

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

      // Просто логируем ошибку, не показываем пользователю
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const navigateToOrder = (orderId, orderStatus = null) => {
    // Посредник всегда использует свой специальный экран MediatorOrderSteps
    // чтобы избежать проблем с доступом к откликам на заказы
    navigation.navigate('MediatorOrderSteps', {orderId});
  };

  const navigateToOrdersList = () => {
    navigation.navigate('OrdersList');
  };

  const navigateToAvailableOrders = () => {
    // Можно создать отдельный экран для доступных заказов или использовать OrdersList с фильтром
    navigation.navigate('OrdersList', {filterType: 'available'});
  };

  const navigateToDeals = () => {
    navigation.navigate('MediatorDeals');
  };

  const navigateToFinances = () => {
    navigation.navigate('MediatorFinances');
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  const handleOfferMediationServices = async order => {
    try {
      // Отправляем предложение услуг посредничества как response к заказу
      const response = await api.orders.responsesCreate(order.id, {
        message: t('I offer my mediation services for this order'),
        is_mediator_offer: true,
      });

      if (response.success) {
        notifySuccess(t('Mediation services offer sent successfully'));
        // Обновляем данные
        await fetchData();
      } else {
        notifyError(response.message || t('Failed to send offer'));
      }
    } catch (error) {
      console.error('Error offering mediation services:', error);
      if (error.response?.data?.message) {
        setErrors([error.response.data.message]);
      } else {
        notifyError(t('Failed to send mediation offer'));
      }
    }
  };

  const handleTakeAvailableOrder = order => {
    // Переходим к экрану предпросмотра заказа
    navigation.navigate('MediatorOrderPreview', {
      orderId: order.id,
      orderData: order,
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    refreshing,
    loading,
    errors,
    orders,
    availableOrders,
    activeDeals,
    banners,
    userProfile,
    notificationsCount,
    fetchData,
    handleRefresh,
    navigateToOrder,
    navigateToOrdersList,
    navigateToAvailableOrders,
    navigateToDeals,
    navigateToFinances,
    handleNotificationsPress,
    handleOfferMediationServices,
    handleTakeAvailableOrder,
  };
}
