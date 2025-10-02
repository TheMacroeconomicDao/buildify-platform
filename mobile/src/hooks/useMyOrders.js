import {useState, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {api, retryApiCall} from '../services/index';
import {
  setNewResponsesCount,
  setUnreadCount,
} from '../redux/reducers/notifications';

export const useMyOrders = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const user_type = auth?.userData?.type || 0; // 0 - исполнитель, 1 - заказчик

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newResponsesCount, setLocalNewResponsesCount] = useState(0);
  const [unreadCount, setLocalUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      // Проверяем авторизацию перед загрузкой данных
      if (!auth.logged) {
        setLoading(false);
        setOrders([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      let response;
      if (user_type === '1' || user_type === 1) {
        // Заказчик - получаем созданные им заказы
        response = await retryApiCall(() => api.orders.activeList());
      } else if (user_type === '2' || user_type === 2) {
        // Посредник - получаем активные сделки
        response = await retryApiCall(() => api.mediator.getActiveDeals());
      } else {
        // Исполнитель - получаем принятые им заказы
        response = await retryApiCall(() => api.orders.workerActiveList());
      }

      if (response.success && response.result) {
        // Сортируем заказы от новых к старым по дате создания
        const sortedOrders = response.result.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime(); // Убывающий порядок (новые первые)
        });
        setOrders(sortedOrders);
      } else {
        throw new Error(
          response.message || 'Не удалось получить список заказов',
        );
      }

      // Получаем общее количество непрочитанных уведомлений для всех типов пользователей
      try {
        const notificationsCountResponse = await retryApiCall(() =>
          api.notification.getCountNotifications(),
        );
        if (notificationsCountResponse.success) {
          const count =
            notificationsCountResponse.result?.count ||
            notificationsCountResponse.count ||
            0;
          setLocalUnreadCount(count);
          dispatch(setUnreadCount(count));
        }
      } catch (error) {
        console.error(
          'Ошибка при загрузке количества непрочитанных уведомлений:',
          error,
        );
        setLocalUnreadCount(0);
      }

      // Оставляем получение откликов только для заказчиков
      if (user_type === '1' || user_type === 1) {
        try {
          const responsesCountResponse = await retryApiCall(() =>
            api.getNewResponsesCount(),
          );
          if (responsesCountResponse.success) {
            const count =
              responsesCountResponse.result?.count ||
              responsesCountResponse.count ||
              0;
            setLocalNewResponsesCount(count);
            dispatch(setNewResponsesCount(count));
          }
        } catch (error) {
          console.error('Ошибка при загрузке количества откликов:', error);
          setLocalNewResponsesCount(0);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке моих заказов:', error);
      setError(error.message || 'Произошла ошибка при загрузке заказов');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user_type, auth.logged]);

  const navigateToOrder = useCallback(
    orderId => {
      if (user_type === 1 || user_type === '1') {
        // Заказчик - используем Order (как с главного экрана)
        navigation.navigate('Order', {orderId});
      } else if (user_type === 2 || user_type === '2') {
        // Посредник - используем MediatorOrderSteps (экран управления заказом посредника)
        navigation.navigate('MediatorOrderSteps', {orderId});
      } else {
        // Исполнитель - используем OrderWorker (специальная деталка для исполнителя)
        navigation.navigate('OrderWorker', {orderId});
      }
    },
    [navigation, user_type],
  );

  const retryFetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    orders,
    loading,
    error,
    newResponsesCount,
    unreadCount,
    fetchData,
    retryFetch,
    navigateToOrder,
  };
};

export default useMyOrders;
