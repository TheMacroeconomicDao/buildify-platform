import {useState, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {api, retryApiCall} from '../services/index';

export const useArchivedOrders = () => {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchData = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (!auth.logged) {
          setLoading(false);
          setOrders([]);
          setError(null);
          return;
        }

        if (isRefresh) {
          setRefreshing(true);
        } else if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError(null);

        const response = await retryApiCall(() =>
          api.orders.archivedList({params: {page: pageNum}}),
        );

        if (response.success && response.result) {
          const newOrders = response.result;

          // Debug logging to check what orders are returned
          console.log('Archived orders API response:', {
            total: newOrders.length,
            orders: newOrders.map(order => ({
              id: order.id,
              title: order.title,
              status: order.status,
              statusText:
                order.status === 4
                  ? 'In work'
                  : order.status === 7
                  ? 'Closed'
                  : order.status === 8
                  ? 'Completed'
                  : `Status ${order.status}`,
            })),
          });

          if (pageNum === 1) {
            setOrders(newOrders);
          } else {
            setOrders(prev => [...prev, ...newOrders]);
          }

          // Check if there are more pages
          const pagination = response.pagination;
          setHasMore(
            pagination && pagination.current_page < pagination.total_pages,
          );
          setPage(pageNum);
        } else {
          throw new Error(
            response.message || t('Failed to load archived orders'),
          );
        }
      } catch (err) {
        console.error('Error fetching archived orders:', err);
        setError(err.message || t('Error loading archived orders'));

        if (pageNum === 1) {
          setOrders([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [auth.logged, t],
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchData(page + 1, false);
    }
  }, [fetchData, loadingMore, hasMore, loading, page]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchData(1, true);
  }, [fetchData]);

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  return {
    orders,
    loading,
    refreshing,
    error,
    hasMore,
    loadingMore,
    loadMore,
    refresh,
    retry: () => fetchData(1, false),
  };
};

export default useArchivedOrders;
