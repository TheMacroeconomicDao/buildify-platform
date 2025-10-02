import {useState, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {apiService, setApiToken} from '../services/index';

export const useSearchOrders = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const auth = useSelector(state => state.auth);
  const userType = auth?.userData?.type;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortType, setSortType] = useState('created_at'); // 'max_amount' или 'created_at'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' или 'desc'
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        // Проверяем авторизацию перед загрузкой данных
        if (!auth.logged) {
          console.log(
            'useSearchOrders: User not logged in, skipping data load',
          );
          setLoading(false);
          setLoadingMore(false);
          setOrders([]);
          setError(null);
          return;
        }

        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError(null);

        // Формируем параметры запроса с учетом сортировки и пагинации
        // Ensure we don't use planned_start_date (removed field)
        let safeSortType = sortType;
        if (sortType === 'planned_start_date') {
          safeSortType = 'created_at';
          setSortType('created_at'); // Update state to prevent future errors
        }

        const params = {
          sort_by: safeSortType,
          sort_direction: sortDirection,
        };

        // ✅ Исправлено: используем правильный API метод для поиска заказов
        const response = await apiService.getOrdersList(params);

        if (!response.data || !response.success) {
          throw new Error('Не удалось получить список заказов');
        }

        const newOrders = response.result || [];

        // Обновляем состояние
        if (reset || pageNum === 1) {
          setOrders(newOrders);
        } else {
          // В случае с новым API это избыточно, так как все заказы приходят сразу
          setOrders(prev => [...prev, ...newOrders]);
        }

        // В новом API нет пагинации, так что больше загружать нечего
        setHasMore(false);
        setPage(1);
      } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        setError(error.message || 'Произошла ошибка при загрузке заказов');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sortType, sortDirection, auth.logged],
  );

  useEffect(() => {
    fetchData(1, true);
  }, [fetchData]);

  const loadMore = () => {
    // В новом API нет пагинации, поэтому эта функция ничего не делает
    // но оставляем для обратной совместимости с UI
    if (!loading && !loadingMore && hasMore) {
      fetchData(page + 1);
    }
  };

  const toggleSort = type => {
    let newType = type;

    // Адаптируем названия полей для сортировки к новому API
    if (type === 'date') {
      newType = 'created_at';
    } else if (type === 'price') {
      newType = 'max_amount';
    }

    if (sortType === newType) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortType(newType);
      setSortDirection('desc');
    }
    // Сортировка будет применена через useEffect, который вызовет fetchData
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return {
      showFooterLoader: true,
    };
  };

  const navigateToOrder = useCallback(
    orderId => {
      console.log('useSearchOrders: navigateToOrder called', {
        orderId,
        userType,
        authUserData: auth?.userData,
      });

      if (userType === 1 || userType === '1') {
        // Заказчик - используем Order
        console.log('useSearchOrders: Navigating to Order (Customer)');
        navigation.navigate('Order', {orderId});
      } else {
        // Исполнитель - используем OrderWorker
        console.log('useSearchOrders: Navigating to OrderWorker (Executor)');
        navigation.navigate('OrderWorker', {orderId});
      }
    },
    [navigation, userType, auth],
  );

  const retryFetch = useCallback(() => {
    fetchData(1, true);
  }, [fetchData]);

  const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
    return (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50
    );
  };

  const handleScroll = ({nativeEvent}) => {
    if (isCloseToBottom(nativeEvent)) {
      loadMore();
    }
  };

  return {
    orders,
    loading,
    loadingMore,
    page,
    hasMore,
    sortType,
    sortDirection,
    error,
    toggleSort,
    renderFooter,
    loadMore,
    navigateToOrder,
    retryFetch,
    handleScroll,
  };
};

export default useSearchOrders;
