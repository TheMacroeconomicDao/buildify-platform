import React, {useState, useEffect, useCallback} from 'react';
import {Alert, Animated, Platform, PermissionsAndroid} from 'react-native';
import {notifyError, notifySuccess, showConfirm} from '../services/notify';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {apiService, retryApiCall, api} from '../services/index';
import {useSelector} from 'react-redux';
import styles from '../styles';
import config from '../config';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

const useOrder = (navigation, orderId) => {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const userType = auth?.userData?.type || 0; // 0=executor, 1=customer, 2=mediator

  const [orderData, setOrderData] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(0));
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [executorReviewModalVisible, setExecutorReviewModalVisible] =
    useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [executorDetails, setExecutorDetails] = useState({});
  const [canReviewExecutor, setCanReviewExecutor] = useState(false);

  const orderStatuses = {
    0: t('Searching for performer'), // Поиск исполнителя
    1: t('Cancelled'), // Отменён
    2: t('Selecting executor'), // Выбор исполнителя
    3: t('Executor selected'), // Исполнитель выбран
    4: t('In work'), // В работе
    5: t('Awaiting confirmation'), // Ждёт подтверждения
    6: t('Rejected'), // Отклонён
    7: t('Closed'), // Закрыт
    8: t('Completed'), // Завершён
    // Статусы посредника
    10: t('Mediator: Clarifying details'), // Этап уточнения деталей
    11: t('Mediator: Executor search'), // Поиск исполнителя
    12: t('Mediator: Project execution'), // Реализация проекта
    13: t('Mediator: Archived'), // Архивирован
  };

  const getStatusColor = status => {
    switch (status) {
      case 0:
        return '#333333'; // черный
      case 1:
        return styles.colors.red; // красный
      case 2:
        return '#333333'; // черный
      case 3:
        return styles.colors.yellow; // желтый
      case 4:
        return styles.colors.green; // зеленый
      case 5:
        return styles.colors.green; // зеленый
      case 6:
        return styles.colors.red; // красный
      case 7:
        return '#333333'; // черный
      case 8:
        return styles.colors.green; // зеленый - завершен
      // Цвета для статусов посредника
      case 10:
        return '#55A3FF'; // голубой - шаг 1
      case 11:
        return '#FD79A8'; // розовый - шаг 2
      case 12:
        return '#FDCB6E'; // желтый - шаг 3
      case 13:
        return '#636E72'; // серый - архивирован
      default:
        return styles.colors.gray;
    }
  };

  const fetchExecutorDetails = useCallback(
    async executorId => {
      try {
        if (executorDetails[executorId]) {
          return executorDetails[executorId];
        }

        const response = await retryApiCall(() =>
          api.executors.executorsDetail(executorId),
        );

        if (response.success && response.result) {
          setExecutorDetails(prev => ({
            ...prev,
            [executorId]: response.result,
          }));
          return response.result;
        }
      } catch (error) {
        console.error('Ошибка при получении деталей исполнителя:', error);
      }
      return null;
    },
    [executorDetails],
  );

  const enrichExecutorData = useCallback(
    async performer => {
      if (performer?.id) {
        const details = await fetchExecutorDetails(performer.id);
        if (details) {
          return {...performer, ...details};
        }
      }
      return performer;
    },
    [fetchExecutorDetails],
  );

  const fetchOrderData = async id => {
    try {
      setLoading(true);
      // ✅ Получаем данные заказа с сервера (GET /orders/{id})
      const orderResponse = await retryApiCall(() =>
        api.orders.ordersDetail(id),
      );

      if (!orderResponse.success) {
        throw new Error('Не удалось получить данные заказа');
      }

      // Адаптируем данные из API
      const order = orderResponse.result;

      // ✅ Получаем отклики на заказ с сервера (GET /orders/{id}/responses) - только для заказчика и посредника
      if (
        userType === 1 ||
        userType === '1' ||
        userType === 2 ||
        userType === '2'
      ) {
        // Только заказчики и посредники могут видеть отклики
        try {
          const responsesResponse = await retryApiCall(() =>
            api.orders.responsesGetAll(id),
          );

          if (responsesResponse && responsesResponse.success) {
            // Добавляем отклики к данным заказа
            order.responses = responsesResponse.result || [];
          } else {
            order.responses = [];
          }
        } catch (error) {
          // Если нет доступа к откликам (403 ошибка), просто не загружаем их
          if (error.response?.status === 403 || error.status === 403) {
            console.log(
              'No access to order responses - user is not the author',
            );
          } else {
            console.warn('Failed to load order responses:', error.message);
          }
          order.responses = [];
        }
      } else {
        // Исполнители не должны видеть отклики других исполнителей
        console.log('Executor user - skipping responses loading');
        order.responses = [];
      }

      // ✅ Обрабатываем executor_id и получаем данные выбранного исполнителя
      if (order.executor_id) {
        try {
          const executorData = await fetchExecutorDetails(order.executor_id);
          if (executorData) {
            // Создаем объект selectedPerformer из данных исполнителя
            const avatarUrl =
              executorData.avatar || executorData.user?.avatar || '';
            order.selectedPerformer = {
              id: order.executor_id,
              name:
                executorData.name ||
                executorData.user?.name ||
                'Unknown performer',
              avatar: avatarUrl
                ? avatarUrl.startsWith('http')
                  ? avatarUrl
                  : config.siteUrl + avatarUrl
                : '',
              orders: executorData.orders_count || 0,
              rating: executorData.average_rating || executorData.rating || 0,
              reviews: executorData.reviews_count || 0,
              ...executorData,
            };
          }
        } catch (error) {
          console.error('Ошибка при получении данных исполнителя:', error);
        }
      }

      return order;
    } catch (error) {
      console.error('Ошибка при загрузке заказа:', error);
      notifyError(
        t('Error'),
        t('Failed to load order data. Please try again later.'),
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Функция для загрузки данных заказа
  const loadOrder = async () => {
    const order = await fetchOrderData(orderId);
    if (order) {
      setOrderData(order);
    } else {
      navigation.goBack();
    }
  };

  // ✅ Функция для обновления данных после действий пользователя
  const refreshOrderData = async () => {
    try {
      console.log('🔄 Refreshing order data for orderId:', orderId);
      const data = await fetchOrderData(orderId);
      if (data) {
        console.log('📊 New order data received:', {
          id: data.id,
          status: data.status,
          executor_id: data.executor_id,
          selectedPerformer: data.selectedPerformer?.id,
          responsesCount: data.responses?.length,
        });
        setOrderData(data);
        console.log('✅ Order data updated in state');
      } else {
        console.log('❌ No data received from fetchOrderData');
      }
    } catch (error) {
      console.error('❌ Ошибка при обновлении данных заказа:', error);
    }
  };

  const sendContacts = async responseId => {
    try {
      // ✅ Отправить контакты исполнителю (POST /orders/{id}/responses/{responseId}/send-contact) - только заказчик
      const response = await retryApiCall(() =>
        api.orders.responsesSendContact(orderData.id, responseId),
      );

      if (response.success) {
        // ✅ Обновляем данные с сервера вместо локального обновления
        await refreshOrderData();
        notifySuccess(t('Success'), t('Contacts sent successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось отправить контакты');
      }
    } catch (error) {
      console.error('Ошибка при отправке контактов:', error);
      notifyError(
        t('Error'),
        error.message || t('Failed to send contacts. Please try again later.'),
      );
      return {success: false};
    }
  };

  const choosePerformer = async responseId => {
    try {
      // ✅ Выбрать исполнителя (POST /orders/{id}/responses/{responseId}/select) - только заказчик
      const response = await retryApiCall(() =>
        api.orders.responsesSelect(orderData.id, responseId),
      );

      if (response.success) {
        // ✅ Обновляем данные с сервера вместо локального обновления
        await refreshOrderData();
        setActiveTab('details');
        notifySuccess(t('Success'), t('Performer selected successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось выбрать исполнителя');
      }
    } catch (error) {
      console.error('Ошибка при выборе исполнителя:', error);
      notifyError(
        t('Error'),
        error.message ||
          t('Failed to select performer. Please try again later.'),
      );
      return {success: false};
    }
  };

  const rejectResponse = async responseId => {
    try {
      // ✅ Отклонить отклик исполнителя (POST /orders/{id}/responses/{responseId}/reject) - только заказчик
      const response = await retryApiCall(() =>
        api.orders.responsesReject(orderData.id, responseId),
      );

      if (response.success) {
        // ✅ Обновляем данные с сервера вместо локального обновления
        await refreshOrderData();
        notifySuccess(t('Success'), t('Response rejected successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось отклонить отклик');
      }
    } catch (error) {
      console.error('Ошибка при отклонении отклика:', error);
      notifyError(
        t('Error'),
        error.message ||
          t('Failed to reject response. Please try again later.'),
      );
      return {success: false};
    }
  };

  const changePerformer = async () => {
    try {
      // ✅ Заказчик передумал и решил отменить выбор исполнителя - отклоняет его отклик
      // Нужно найти responseId выбранного исполнителя
      const executorId =
        orderData.executor_id || orderData.selectedPerformer?.id;
      if (!executorId) {
        throw new Error('Нет выбранного исполнителя');
      }

      // Ищем отклик выбранного исполнителя
      const selectedResponse = orderData.responses?.find(
        response =>
          response.executor?.id === executorId ||
          response.user_id === executorId,
      );

      if (!selectedResponse) {
        throw new Error('Не найден отклик выбранного исполнителя');
      }

      // ✅ Отклоняем отклик исполнителя (POST /orders/{id}/responses/{responseId}/reject) - только заказчик
      const response = await retryApiCall(() =>
        api.orders.responsesReject(orderData.id, selectedResponse.id),
      );

      if (response.success) {
        // ✅ Обновляем данные с сервера вместо локального обновления
        await refreshOrderData();
        notifySuccess(
          t('Success'),
          t('Performer selection cancelled successfully'),
        );
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось сменить исполнителя');
      }
    } catch (error) {
      console.error('Ошибка при смене исполнителя:', error);
      notifyError(
        t('Error'),
        error.message ||
          t('Failed to change performer. Please try again later.'),
      );
      return {success: false};
    }
  };

  const rejectPerformer = async () => {
    try {
      console.log('🔄 Starting rejectPerformer process...');
      console.log('📋 Current order data:', {
        id: orderData.id,
        status: orderData.status,
        executor_id: orderData.executor_id,
        selectedPerformer: orderData.selectedPerformer?.id,
      });

      // ✅ Заказчик отклоняет исполнителя - отклоняет его отклик
      const executorId =
        orderData.executor_id || orderData.selectedPerformer?.id;
      if (!executorId) {
        throw new Error('Нет выбранного исполнителя');
      }

      console.log('👤 Executor ID to reject:', executorId);

      // Ищем отклик выбранного исполнителя
      const selectedResponse = orderData.responses?.find(
        response =>
          response.executor?.id === executorId ||
          response.user_id === executorId,
      );

      if (!selectedResponse) {
        console.log('❌ Available responses:', orderData.responses);
        throw new Error('Не найден отклик выбранного исполнителя');
      }

      console.log('📝 Selected response to reject:', {
        id: selectedResponse.id,
        executor_id: selectedResponse.executor?.id || selectedResponse.user_id,
        status: selectedResponse.status,
      });

      // ✅ Отклоняем отклик исполнителя (POST /orders/{id}/responses/{responseId}/reject) - только заказчик
      console.log('🌐 Making API call to reject response...');
      const response = await retryApiCall(() =>
        api.orders.responsesReject(orderData.id, selectedResponse.id),
      );

      console.log('📡 API response:', response);

      if (response.success) {
        console.log('✅ API call successful, refreshing order data...');
        // ✅ Обновляем данные с сервера вместо локального обновления
        await refreshOrderData();
        console.log('🔄 Order data refreshed after reject');
        notifySuccess(t('Success'), t('Performer rejected successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось отклонить исполнителя');
      }
    } catch (error) {
      console.error('❌ Ошибка при отклонении исполнителя:', error);
      notifyError(
        t('Error'),
        error.message ||
          t('Failed to reject performer. Please try again later.'),
      );
      return {success: false};
    }
  };

  const acceptOrder = async () => {
    try {
      // ✅ Заказчик принимает выполненную работу (POST /orders/{id}/accept)
      const response = await retryApiCall(() =>
        api.orders.ordersAccept(orderData.id),
      );

      if (response.success) {
        // ✅ Обновляем данные с сервера вместо локального обновления
        await refreshOrderData();
        setReviewModalVisible(true); // Открываем модалку отзыва
        notifySuccess(t('Success'), t('Order completed successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось завершить заказ');
      }
    } catch (error) {
      console.error('Ошибка при завершении заказа:', error);
      notifyError(
        t('Error'),
        error.message || t('Failed to complete order. Please try again later.'),
      );
      return {success: false};
    }
  };

  const archiveOrderByCustomer = async () => {
    try {
      // Показываем подтверждение
      showConfirm({
        title: t('Archive Order'),
        message: t(
          'Are you sure you want to move this order to archive? The order will be marked as completed.',
        ),
        onConfirm: async () => {
          try {
            const response = await retryApiCall(() =>
              api.orders.ordersArchiveByCustomer(orderData.id),
            );

            if (response.success) {
              await refreshOrderData();
              notifySuccess(t('Success'), t('Order moved to archive'));
            } else {
              throw new Error(response.message || 'Failed to archive order');
            }
          } catch (error) {
            notifyError(
              t('Error'),
              error.message || t('Failed to archive order'),
            );
          }
        },
        onCancel: () => {},
        confirmText: t('Archive'),
        cancelText: t('Cancel'),
      });
    } catch (error) {
      console.error('Error archiving order:', error);
    }
  };

  const completeOrderByCustomer = async () => {
    try {
      // ✅ Завершение заказа заказчиком без этапа подтверждения (POST /orders/{id}/complete-by-customer)
      const response = await retryApiCall(() =>
        api.orders.ordersCompleteByCustomer(orderData.id),
      );

      if (response.success) {
        // ✅ Обновляем данные с сервера
        await refreshOrderData();
        setExecutorReviewModalVisible(true); // Открываем модалку отзыва об исполнителе
        notifySuccess(t('Success'), t('Order completed successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось завершить заказ');
      }
    } catch (error) {
      console.error('Ошибка при завершении заказа заказчиком:', error);
      notifyError(
        t('Error'),
        error.message || t('Failed to complete order. Please try again later.'),
      );
      return {success: false};
    }
  };

  const rejectOrder = async () => {
    try {
      // ✅ Заказчик отклоняет выполненную работу (POST /orders/{id}/reject)
      const response = await retryApiCall(() =>
        api.orders.ordersReject(orderData.id),
      );

      if (response.success) {
        // ✅ Обновляем данные с сервера вместо локального обновления
        await refreshOrderData();
        notifySuccess(
          t('Success'),
          t('Order rejected, searching for new performer'),
        );
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось отклонить заказ');
      }
    } catch (error) {
      console.error('Ошибка при отклонении заказа:', error);
      notifyError(
        t('Error'),
        error.message || t('Failed to reject order. Please try again later.'),
      );
      return {success: false};
    }
  };

  // Вернуться к поиску исполнителей (отказаться от текущего исполнителя)
  const returnToSearch = async () => {
    try {
      // Send only the fields we want to update
      const updatedOrderData = {
        id: orderData.id,
        title: orderData.title,
        work_direction: orderData.work_direction,
        work_type: orderData.work_type,
        description: orderData.description || '',
        city: orderData.city,
        address: orderData.address,
        max_amount: orderData.max_amount,
        date_type: orderData.date_type || 'single',
        status: 0, // Статус "Searching for performer"
        executor_id: null, // Убираем исполнителя
      };

      const response = await retryApiCall(() =>
        api.orders.ordersEdit(orderData.id, updatedOrderData),
      );

      if (response.success) {
        await refreshOrderData();
        notifySuccess(t('Success'), t('Returned to search for performers'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Failed to return to search');
      }
    } catch (error) {
      console.error('Error returning to search:', error);
      notifyError(
        t('Error'),
        error.message ||
          t('Failed to return to search. Please try again later.'),
      );
      return {success: false};
    }
  };

  // Завершить заказ успешно
  const completeOrderSuccess = async () => {
    try {
      // ✅ Заказчик завершает заказ (POST /orders/{id}/complete-by-customer)
      const response = await retryApiCall(() =>
        api.orders.ordersCompleteByCustomer(orderData.id),
      );

      if (response.success) {
        await refreshOrderData();
        setReviewModalVisible(true); // Открываем модалку отзыва
        notifySuccess(t('Success'), t('Order completed successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      notifyError(
        t('Error'),
        error.message || t('Failed to complete order. Please try again later.'),
      );
      return {success: false};
    }
  };

  // Завершить заказ с проблемами
  const completeOrderWithIssues = async () => {
    try {
      // ✅ Заказчик отклоняет работу (POST /orders/{id}/reject)
      const response = await retryApiCall(() =>
        api.orders.ordersReject(orderData.id),
      );

      if (response.success) {
        await refreshOrderData();
        notifySuccess(
          t('Success'),
          t('Order returned to executor for improvements'),
        );
        return {success: true};
      } else {
        throw new Error(
          response.message || 'Failed to return order for improvements',
        );
      }
    } catch (error) {
      console.error('Error returning order for improvements:', error);
      notifyError(
        t('Error'),
        error.message ||
          t('Failed to return order for improvements. Please try again later.'),
      );
      return {success: false};
    }
  };

  const submitReview = async () => {
    try {
      // ✅ Валидация рейтинга - обязательно нужно выставить оценку
      if (!rating || rating < 1 || rating > 5) {
        notifyError(
          t('Error'),
          t('Please rate the performer from 1 to 5 stars'),
        );
        return {success: false};
      }

      // ✅ Исправлено: используем реальный API для отправки отзыва
      const executorId =
        orderData.executor_id || orderData.selectedPerformer?.id;
      if (!executorId) {
        throw new Error('Нет данных об исполнителе для отзыва');
      }

      const reviewData = {
        order_id: orderData.id,
        rating: rating,
        text: reviewText || '', // Текст отзыва может быть пустым
      };

      const response = await retryApiCall(() =>
        api.executors.reviewsCreate(executorId, reviewData),
      );

      if (response.success) {
        closeReviewModal();
        // ✅ Обновляем данные с сервера после отправки отзыва
        await refreshOrderData();
        notifySuccess(t('Success'), t('Review sent successfully!'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось отправить отзыв');
      }
    } catch (error) {
      console.error('Ошибка при отправке отзыва:', error);
      notifyError(
        t('Error'),
        error.message || t('Failed to send review. Please try again later.'),
      );
      return {success: false};
    }
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setRating(0);
    setReviewText('');
  };

  const submitExecutorReview = async reviewData => {
    try {
      const response = await retryApiCall(() =>
        api.executorReviews.create(reviewData),
      );

      if (response.success) {
        setExecutorReviewModalVisible(false);
        notifySuccess(t('Success'), t('Review submitted successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось отправить отзыв');
      }
    } catch (error) {
      console.error('Ошибка при отправке отзыва об исполнителе:', error);
      notifyError(t('Error'), error.message || t('Failed to submit review'));
      return {success: false};
    }
  };

  const closeExecutorReviewModal = () => {
    setExecutorReviewModalVisible(false);
  };

  const showMenu = () => {
    setMenuVisible(true);
    Animated.timing(menuAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  const cancelOrder = async () => {
    try {
      showConfirm({
        title: t('Cancel order'),
        message: t('Are you sure you want to cancel this order?'),
        cancelText: t('No'),
        confirmText: t('Yes'),
        onConfirm: async () => {
          try {
            const response = await retryApiCall(() =>
              api.orders.ordersCancel(orderData.id),
            );

            if (response.success) {
              notifySuccess(t('Success'), t('Order cancelled successfully'));
              navigation.goBack();
              return {success: true};
            } else {
              throw new Error(response.message || 'Не удалось отменить заказ');
            }
          } catch (error) {
            console.error('Ошибка при отмене заказа:', error);
            notifyError(
              t('Error'),
              error.message ||
                t('Failed to cancel order. Please try again later.'),
            );
            return {success: false};
          }
        },
      });
    } catch (error) {
      console.error('Ошибка при отмене заказа:', error);
      notifyError(t('Error'), t('An error occurred while cancelling order'));
      return {success: false};
    }
  };

  // Загрузка при первом монтировании
  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId, navigation]);

  // ✅ Перезагрузка данных при каждом получении фокуса экраном
  useFocusEffect(
    React.useCallback(() => {
      if (orderId) {
        console.log(
          'Экран Order получил фокус - обновляем данные заказа:',
          orderId,
        );
        loadOrder();
      }
    }, [orderId]),
  );

  // Функции просмотра и скачивания файлов
  const getFileTypeFromUrl = url => {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
    };
    return {
      mimeType: mimeTypes[extension] || 'image/jpeg',
      ext: mimeTypes[extension] ? extension : 'jpg',
    };
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: t('Storage Permission'),
            message: t('App needs access to save images'),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: t('Storage Permission'),
            message: t('App needs access to save images'),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const viewFile = async (fileUri, fileName, mimeType) => {
    try {
      if (fileUri.startsWith('file://') || !fileUri.startsWith('http')) {
        await FileViewer.open(fileUri, {
          displayName: fileName,
          showOpenWithDialog: Platform.OS === 'android',
          showAppsSuggestions: Platform.OS === 'android',
        });
        return;
      }

      const tempDir = RNFS.TemporaryDirectoryPath;
      const fileExtension = getFileTypeFromUrl(fileUri).ext;
      const timestamp = new Date().getTime();
      const tempFileName = `temp_${timestamp}.${fileExtension}`;
      const tempFilePath = `${tempDir}/${tempFileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUri,
        toFile: tempFilePath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        await FileViewer.open(tempFilePath, {
          displayName: fileName || `file.${fileExtension}`,
          showOpenWithDialog: Platform.OS === 'android',
          showAppsSuggestions: Platform.OS === 'android',
          onDismiss: async () => {
            try {
              await RNFS.unlink(tempFilePath);
            } catch (error) {
              console.log('Error deleting temporary file:', error);
            }
          },
        });
      }
    } catch (error) {
      console.error('File viewing error:', error);
      Alert.alert(t('Cannot Open File'), t('Failed to open file'));
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      if (Platform.OS === 'ios') {
        showConfirm({
          title: t('Save Image'),
          message: t('Where would you like to save the image?'),
          cancelText: t('Files App'),
          confirmText: t('Photo Library'),
          onConfirm: () => saveToPhotoLibrary(fileUrl, fileName),
          onCancel: () => saveToDocuments(fileUrl, fileName),
        });
      } else {
        await saveToDocuments(fileUrl, fileName);
      }
    } catch (error) {
      notifyError(
        t('Download Failed'),
        error.message || t('Failed to download file. Please try again.'),
      );
    }
  };

  const saveToPhotoLibrary = async (fileUrl, fileName) => {
    try {
      // ✅ Исправлено: Используем правильный способ запроса разрешений для iOS
      if (Platform.OS === 'ios') {
        // Для iOS просто пробуем сохранить, CameraRoll.save сам запросит разрешение
        // если оно не предоставлено
      }

      const timestamp = new Date().getTime();
      const fileExtension = getFileTypeFromUrl(fileUrl).ext;
      const tempPath = `${RNFS.TemporaryDirectoryPath}/${timestamp}_${fileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: tempPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        await CameraRoll.save(tempPath, {type: 'photo'});
        await RNFS.unlink(tempPath);
        notifySuccess(t('Success'), t('Image saved to Photo Library'));
      }
    } catch (error) {
      console.error('Save to photo library error:', error);
      notifyError(
        t('Save Failed'),
        error.message || t('Failed to save image to gallery'),
      );
    }
  };

  const saveToDocuments = async (fileUrl, fileName) => {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          notifyError(
            t('Permission Required'),
            t('Storage permission is required to download files'),
          );
          return;
        }
      }

      const downloadDir =
        Platform.OS === 'ios'
          ? RNFS.DocumentDirectoryPath
          : RNFS.DownloadDirectoryPath;
      const timestamp = new Date().getTime();
      const fileExtension = getFileTypeFromUrl(fileUrl).ext;
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      const finalFileName = `${baseFileName}_${timestamp}.${fileExtension}`;
      const filePath = `${downloadDir}/${finalFileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: filePath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        notifySuccess(
          t('Download Complete'),
          Platform.OS === 'ios'
            ? t('File saved to Files app (Documents)')
            : t('File saved to Downloads folder'),
        );
      }
    } catch (error) {
      notifyError(t('Save Failed'), error.message || t('Failed to save file'));
    }
  };

  const checkCanReviewExecutor = async () => {
    try {
      if (!orderData?.id || !orderData?.executor_id) return;

      const response = await retryApiCall(() =>
        api.executorReviews.canReview(orderData.id),
      );

      if (response.success && response.result) {
        setCanReviewExecutor(response.result.can_review);
      }
    } catch (error) {
      console.error(
        'Ошибка при проверке возможности оставить отзыв об исполнителе:',
        error,
      );
      setCanReviewExecutor(false);
    }
  };

  // Проверяем возможность оставить отзыв при изменении данных заказа
  useEffect(() => {
    if (orderData && (orderData.status === 5 || orderData.status === 7)) {
      checkCanReviewExecutor();
    }
  }, [orderData?.status, orderData?.id, orderData?.executor_id]);

  return {
    orderData,
    activeTab,
    setActiveTab,
    loading,
    menuVisible,
    menuAnimation,
    reviewModalVisible,
    rating,
    setRating,
    reviewText,
    setReviewText,
    orderStatuses,
    getStatusColor,
    sendContacts,
    choosePerformer,
    rejectResponse,
    changePerformer,
    rejectPerformer,
    acceptOrder,
    rejectOrder,
    archiveOrderByCustomer,
    returnToSearch,
    completeOrderSuccess,
    completeOrderWithIssues,
    cancelOrder,
    completeOrderByCustomer,
    submitReview,
    closeReviewModal,
    executorReviewModalVisible,
    submitExecutorReview,
    closeExecutorReviewModal,
    showMenu,
    hideMenu,
    executorDetails,
    fetchExecutorDetails,
    enrichExecutorData,
    refreshOrderData,
    viewFile,
    downloadFile,
    canReviewExecutor,
  };
};

export default useOrder;
