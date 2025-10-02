import {useState, useEffect, useCallback} from 'react';
import {Dimensions} from 'react-native';
import styles from '../styles';
import {api, retryApiCall} from '../services/index';

export const useNotifications = navigation => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const width = Dimensions.get('window').width - styles.paddingHorizontal * 2;

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
      console.error('Failed to fetch notifications count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await retryApiCall(() =>
        api.notification.apiNotificationGet(),
      );
      if (response.success) {
        if (
          response.result &&
          response.result.notifications &&
          response.result.notifications.length === 0
        ) {
          setNotifications([]);
        } else {
          setNotifications(
            response.result?.notifications || response.result || [],
          );
        }
      }

      await fetchNotificationsCount();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsFirstLoad(false);
      setRefreshing(false);
    }
  }, [fetchNotificationsCount]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const markNotificationAsRead = useCallback(
    async id => {
      try {
        await retryApiCall(() =>
          api.notification.apiNotificationRead({ids: [id]}),
        );
        fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    [fetchNotifications],
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    const ids = notifications.map(notification => notification.id);
    if (ids.length === 0) return;

    try {
      await retryApiCall(() => api.notification.apiNotificationRead({ids}));
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const goBack = useCallback(() => {
    navigation.pop();
  }, [navigation]);

  return {
    notifications,
    refreshing,
    isFirstLoad,
    notificationsCount,
    width,
    handleRefresh,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchNotificationsCount,
    goBack,
  };
};

export default useNotifications;
