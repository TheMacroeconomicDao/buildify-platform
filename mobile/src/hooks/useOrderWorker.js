import {useState, useEffect, useCallback, useRef} from 'react';
import {
  Alert,
  Animated,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {notifyError, notifySuccess, showConfirm} from '../services/notify';
import {handleSubscriptionError} from '../services/errorHandler';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import React from 'react';
import {api, retryApiCall, subscriptionsService} from '../services/index';
import {useSelector} from 'react-redux';
import styles from '../styles';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

const useOrderWorker = (navigation, orderId) => {
  const {t} = useTranslation();

  // Получаем данные о подписке пользователя
  const {tariff, is_active, next_tariff, days_until_expiration} = useSelector(
    state => state.subscriptions,
  );

  const [orderData, setOrderData] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(0));
  const [contactsViewed, setContactsViewed] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [customerReviewModalVisible, setCustomerReviewModalVisible] =
    useState(false);
  const [canReviewCustomer, setCanReviewCustomer] = useState(false);

  const orderStatuses = {
    0: t('Searching for performer'), // SearchExecutor - Поиск исполнителя
    1: t('Cancelled'), // Cancelled - Отменён
    2: t('Selecting executor'), // SelectingExecutor - Выбор исполнителя
    3: t('Executor selected'), // ExecutorSelected - Исполнитель выбран
    4: t('In work'), // InWork - В работе
    5: t('Awaiting confirmation'), // AwaitingConfirmation - Ждёт подтверждения
    6: t('Rejected'), // Rejected - Отклонён
    7: t('Closed'), // Closed - Закрыт
  };

  // Статусы отклика
  const responseStatuses = {
    0: t('Sent'), // Отправлен
    1: t('Rejected'), // Отклонён
    2: t('Contact received'), // Получен контакт
    3: t('Contact opened by executor'), // Контакт открыт исполнителем
    4: t('Order received'), // Получен заказ
    5: t('Taken into work'), // Взят в работу
  };

  const getStatusColor = status => {
    if (status === 0) return '#333333'; // черный
    if (status === 1) return styles.colors.red; // красный
    if (status === 2) return '#333333'; // черный
    if (status === 3) return styles.colors.yellow; // желтый
    if (status === 4) return styles.colors.green; // зеленый
    if (status === 5) return styles.colors.green; // зеленый
    if (status === 6) return styles.colors.red; // красный
    if (status === 7) return '#333333'; // черный
    return styles.colors.gray;
  };

  const fetchOrderData = async id => {
    try {
      setError(null);

      // Загружаем данные заказа
      const orderResponse = await retryApiCall(() =>
        api.orders.ordersDetail(id),
      );

      if (orderResponse.success && orderResponse.result) {
        const rawOrderData = orderResponse.result;

        console.log('Raw order data from API:', rawOrderData);
        console.log('Author data from API:', rawOrderData.author);
        console.log('Author ID from API:', rawOrderData.author?.id);
        console.log('Author ID fallback:', rawOrderData.author_id);

        // Обрабатываем новую структуру API с полем additional
        const orderData = {
          ...rawOrderData,
          // Извлекаем информацию об отклике из additional.response
          hasResponded: rawOrderData.additional?.response?.id > 0,
          responseId:
            rawOrderData.additional?.response?.id > 0
              ? rawOrderData.additional.response.id
              : null,
          responseStatus: rawOrderData.additional?.response?.status || 0,
          // Проверяем доступность контактов (если contacts не пустые)
          contacts_available:
            rawOrderData.additional?.contacts &&
            Object.values(rawOrderData.additional.contacts).some(
              contact => contact && contact.trim() !== '',
            ),
          // Добавляем информацию об авторе для отображения контактов
          author: {
            id: rawOrderData.author?.id || rawOrderData.author_id,
            name: rawOrderData.author?.name || '',
            avatar: rawOrderData.author?.avatar || '',
            customer_rating: rawOrderData.author?.customer_rating || 0,
            customer_reviews_count:
              rawOrderData.author?.customer_reviews_count || 0,
            customer_orders_count:
              rawOrderData.author?.customer_orders_count || 0,
            phone: rawOrderData.additional?.contacts?.phone || '',
            email: rawOrderData.additional?.contacts?.email || '',
            telegram: rawOrderData.additional?.contacts?.telegram || '',
            whatsApp: rawOrderData.additional?.contacts?.whatsApp || '',
            facebook: rawOrderData.additional?.contacts?.facebook || '',
            viber: rawOrderData.additional?.contacts?.viber || '',
          },
        };

        // Проверяем, были ли контакты уже просмотрены
        if (orderData.contacts_available && orderData.hasResponded) {
          setContactsViewed(true);
        }

        console.log('Processed order data:', orderData);

        return orderData;
      } else {
        throw new Error(
          orderResponse.message || 'Не удалось получить данные заказа',
        );
      }
    } catch (error) {
      console.error('Ошибка при получении данных заказа:', error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Произошла ошибка при загрузке заказа';
      setError(errorMessage);

      return null;
    }
  };

  const respondToOrder = async (responseData = {}) => {
    try {
      setProcessingAction(true);

      // Принудительно обновляем данные подписки перед проверкой
      console.log('Обновляем данные подписки перед отправкой отклика...');
      let freshSubscriptionData = null;
      try {
        freshSubscriptionData =
          await subscriptionsService.getCurrentSubscription();
        console.log(
          'Данные подписки обновлены успешно:',
          freshSubscriptionData,
        );
      } catch (subscriptionError) {
        console.error(
          'Ошибка при обновлении данных подписки:',
          subscriptionError,
        );
        // Используем данные из Redux store как fallback
        freshSubscriptionData = {
          tariff,
          is_active,
          next_tariff,
          days_until_expiration,
        };
      }

      // Используем свежие данные подписки или fallback из Redux
      const currentTariff = freshSubscriptionData?.tariff || tariff;
      const currentIsActive =
        freshSubscriptionData?.is_active !== undefined
          ? freshSubscriptionData.is_active
          : is_active;
      const currentNextTariff =
        freshSubscriptionData?.next_tariff || next_tariff;
      const currentDaysUntilExpiration =
        freshSubscriptionData?.days_until_expiration || days_until_expiration;

      // Проверяем подписку исполнителя
      // Если подписка активна (is_active = true), то пользователь может отвечать на заказы
      // даже если запланирован переход на Free тариф
      const tariffPrice = parseFloat(currentTariff?.price) || 0;
      const isTestTariff = currentTariff?.name?.toLowerCase().includes('test');

      // Специальные бесплатные тарифы (соответствует backend логике)
      const allowedFreeTariffs = [
        'Trial Plus',
        'Black Friday',
        'New Year Special',
      ];
      const isAllowedFreeTariff = allowedFreeTariffs.includes(
        currentTariff?.name,
      );

      // Валидная подписка: активная И (платная ИЛИ тестовая ИЛИ разрешенная бесплатная)
      const hasValidSubscription =
        currentIsActive &&
        currentTariff &&
        (tariffPrice > 0 || isTestTariff || isAllowedFreeTariff) &&
        currentTariff?.name !== 'Free'; // Free тариф всегда блокируется

      console.log('Проверка подписки для отклика на заказ:', {
        // Старые данные из Redux
        old_tariff: tariff?.name,
        old_is_active: is_active,
        old_next_tariff: next_tariff?.name,
        // Свежие данные
        current_tariff: currentTariff?.name,
        current_tariff_price_original: currentTariff?.price,
        current_tariff_price_parsed: tariffPrice,
        current_is_active: currentIsActive,
        current_next_tariff: currentNextTariff?.name,
        current_days_until_expiration: currentDaysUntilExpiration,
        isTestTariff,
        isAllowedFreeTariff,
        hasValidSubscription,
      });

      if (!hasValidSubscription) {
        console.log('User has no valid subscription for responding to orders', {
          current_tariff: currentTariff?.name,
          current_price: currentTariff?.price,
          current_is_active: currentIsActive,
          current_next_tariff: currentNextTariff?.name,
          reason: !currentIsActive
            ? 'subscription_inactive'
            : !currentTariff
            ? 'no_tariff'
            : currentTariff?.name === 'Free'
            ? 'free_tariff_blocked'
            : tariffPrice <= 0 && !isTestTariff && !isAllowedFreeTariff
            ? 'free_tariff_not_allowed'
            : 'unknown',
        });
        setProcessingAction(false);

        let message;
        if (!currentIsActive && tariffPrice > 0) {
          message = t(
            'Your subscription has expired. Would you like to renew it?',
          );
        } else if (
          currentIsActive &&
          currentNextTariff?.name === 'Free' &&
          currentDaysUntilExpiration <= 7
        ) {
          message = t(
            'Your subscription will expire soon and switch to Free plan. Renew now to continue responding to orders.',
          );
        } else {
          message = t(
            'You need an active subscription to respond to orders. Would you like to view subscription plans?',
          );
        }

        showConfirm({
          title: t('Subscription Required'),
          message,
          onConfirm: () => {
            navigation.navigate('Subscription');
          },
          onCancel: () => {}, // Отмена - ничего не делаем
          confirmText: t('View Plans'),
          cancelText: t('Cancel'),
        });

        return {success: false};
      }

      // ✅ Откликнуться на заказ (POST /orders/{id}/responses) - только исполнитель
      console.log(
        'Отправляем отклик на сервер. Клиентская проверка прошла успешно.',
      );
      const response = await retryApiCall(() =>
        api.orders.responsesCreate(orderId, responseData),
      );

      if (response.success) {
        console.log('Response created successfully:', response); // ✅ Отладочное логирование

        // После создания отклика обновляем данные заказа из API
        await refreshOrderData();

        notifySuccess(t('Success'), t('Response sent successfully'));
        return {success: true};
      } else {
        // Создаем ошибку с правильным сообщением для обработки лимитов
        const errorMessage =
          response.error?.error ||
          response.error?.message ||
          response.error ||
          response.message ||
          'Не удалось отправить отклик на заказ';
        const customError = new Error(errorMessage);

        // Добавляем дополнительную информацию для обработки ошибок подписки
        const errorText =
          response.error?.error ||
          response.error?.message ||
          response.error ||
          response.message ||
          '';
        if (
          errorText &&
          typeof errorText === 'string' &&
          (errorText.includes('Order response limit reached') ||
            errorText.includes('Subscription'))
        ) {
          customError.isSubscriptionError = true;
          customError.originalMessage = errorText;
        }

        throw customError;
      }
    } catch (error) {
      console.error('Ошибка при отправке отклика:', error);

      // Если это ошибка 403 подписки, логируем дополнительную информацию
      if (
        error.response?.status === 403 &&
        error.response?.data?.error?.includes('Subscription')
      ) {
        console.error(
          'НЕСООТВЕТСТВИЕ: Клиентская проверка прошла, но сервер вернул 403!',
          {
            server_error: error.response.data.error,
            client_validation: {
              currentTariff: currentTariff?.name,
              currentIsActive: currentIsActive,
              tariffPrice: tariffPrice,
              isTestTariff: isTestTariff,
              hasValidSubscription: hasValidSubscription,
            },
          },
        );
      }

      // Специальная обработка ошибки лимита откликов
      if (
        (error.message &&
          error.message.includes('Order response limit reached')) ||
        (error.isSubscriptionError &&
          error.originalMessage &&
          error.originalMessage.includes('Order response limit reached'))
      ) {
        showConfirm({
          title: t('Response Limit Reached'),
          message: t(
            'You have reached your response limit for the current subscription period. Upgrade your plan to respond to more orders.',
          ),
          onConfirm: () => {
            navigation.navigate('Subscription');
          },
          onCancel: () => {},
          confirmText: t('Upgrade Plan'),
          cancelText: t('Cancel'),
        });

        return {success: false, error: error.originalMessage || error.message};
      }

      // Специальная обработка ошибок подписки
      if (handleSubscriptionError(error, navigation, t, subscriptionsService)) {
        const errorMessage =
          error.response?.data?.error || error.response?.data?.message;
        return {success: false, error: errorMessage};
      }

      // Обработка других ошибок
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Произошла ошибка при отправке отклика. Проверьте подключение к интернету и попробуйте снова.';

      notifyError(t('Error'), errorMessage);

      return {success: false, error: errorMessage};
    } finally {
      setProcessingAction(false);
    }
  };

  const withdrawResponse = async () => {
    // Показываем предупреждение о возможных финансовых последствиях
    Alert.alert(t('Withdraw response'), t('Withdraw response warning'), [
      {
        text: t('Cancel'),
        style: 'cancel',
      },
      {
        text: t('Withdraw'),
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessingAction(true);

            if (!orderData?.responseId) {
              notifyError(
                t('Error'),
                t('Response ID not found for withdrawal'),
              );
              return {success: false};
            }

            console.log('Withdrawing response:', orderData.responseId);
            console.log(
              'Using API endpoint: /orders/' +
                orderId +
                '/responses/' +
                orderData.responseId +
                '/revoke',
            );
            console.log(
              'About to call api.orders.responsesRevoke with orderId:',
              orderId,
              'responseId:',
              orderData.responseId,
            );

            // ✅ Отозвать отклик на заказ исполнителем (POST /orders/{id}/responses/{responseId}/revoke) - только исполнитель
            console.log('API method type:', typeof api.orders.responsesRevoke);
            console.log('API method exists:', !!api.orders.responsesRevoke);

            const response = await retryApiCall(() => {
              console.log('Actually calling api.orders.responsesRevoke...');
              return api.orders.responsesRevoke(orderId, orderData.responseId);
            });

            if (response.success) {
              console.log(
                'Response revoked successfully:',
                orderData.responseId,
              );

              // После отзыва отклика обновляем данные заказа из API
              await refreshOrderData();
              setContactsViewed(false);

              notifySuccess(t('Success'), t('Response withdrawn successfully'));

              // Возвращаемся к списку заказов после успешного отзыва отклика
              setTimeout(() => {
                navigation.goBack();
              }, 1000); // Даем время показать уведомление

              return {success: true};
            } else {
              throw new Error(
                response.message || 'Не удалось отозвать отклик на заказ',
              );
            }
          } catch (error) {
            console.error('Ошибка при отзыве отклика:', error);

            const errorMessage =
              error.response?.data?.error ||
              error.message ||
              'Произошла ошибка при отзыве отклика';
            notifyError(t('Error'), errorMessage);

            return {success: false, error: errorMessage};
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  const sendExecutorContacts = async () => {
    try {
      setProcessingAction(true);

      if (!orderData?.responseId) {
        notifyError(t('Error'), t('Response not found'));
        return {success: false};
      }

      // Отправляем контакты исполнителя заказчику
      const response = await retryApiCall(() =>
        api.orders.responsesSendExecutorContact(orderId, orderData.responseId),
      );

      if (response.success) {
        console.log('Executor contacts sent successfully');

        // Обновляем данные заказа
        await refreshOrderData();

        notifySuccess(t('Success'), t('Your contacts sent to customer'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Failed to send executor contacts');
      }
    } catch (error) {
      console.error('Error sending executor contacts:', error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Error sending contacts';
      notifyError(t('Error'), errorMessage);

      return {success: false, error: errorMessage};
    } finally {
      setProcessingAction(false);
    }
  };

  const takeOrder = async () => {
    try {
      setProcessingAction(true);

      // Проверяем подписку исполнителя
      if (!tariff || tariff.name === 'Free' || tariff.price === 0) {
        console.log(
          'User has free subscription, redirecting to subscription screen',
        );
        setProcessingAction(false);

        showConfirm({
          title: t('Subscription Required'),
          message: t(
            'You need an active subscription to take orders. Would you like to view subscription plans?',
          ),
          onConfirm: () => {
            navigation.navigate('Subscription');
          },
          onCancel: () => {}, // Отмена - ничего не делаем
          confirmText: t('View Plans'),
          cancelText: t('Cancel'),
        });

        return {success: false};
      }

      if (!orderData?.responseId) {
        notifyError(t('Error'), t('You need to respond to the order first'));
        return {success: false};
      }

      console.log(
        'Taking order into work with responseId:',
        orderData.responseId,
      );

      // ✅ Взять заказ в работу (POST /orders/{id}/responses/{responseId}/take-on-work) - только исполнитель
      const response = await retryApiCall(() =>
        api.orders.responsesTakeOnWork(orderId, orderData.responseId),
      );

      if (response.success) {
        console.log('Order taken into work successfully via API');

        // После принятия заказа в работу обновляем данные из API
        await refreshOrderData();

        notifySuccess(t('Success'), t('Order taken into work successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось взять заказ в работу');
      }
    } catch (error) {
      console.error('Ошибка при принятии заказа в работу:', error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Произошла ошибка при принятии заказа в работу';
      notifyError(t('Error'), errorMessage);

      return {success: false, error: errorMessage};
    } finally {
      setProcessingAction(false);
    }
  };

  const rejectOrder = async () => {
    try {
      setProcessingAction(true);

      if (!orderData?.responseId) {
        notifyError(t('Error'), t('No response found for rejection'));
        return {success: false};
      }

      console.log('Rejecting order with responseId:', orderData.responseId);

      // ✅ Отклонение заказа исполнителем = отзыв собственного отклика (POST /orders/{id}/responses/{responseId}/revoke)
      const response = await retryApiCall(() =>
        api.orders.responsesRevoke(orderId, orderData.responseId),
      );

      if (response.success) {
        console.log('Order rejected successfully via API');

        // После отклонения заказа обновляем данные из API
        await refreshOrderData();
        setContactsViewed(false);

        notifySuccess(t('Success'), t('Order rejected successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось отклонить заказ');
      }
    } catch (error) {
      console.error('Ошибка при отклонении заказа:', error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Произошла ошибка при отклонении заказа';
      notifyError(t('Error'), errorMessage);

      return {success: false, error: errorMessage};
    } finally {
      setProcessingAction(false);
    }
  };

  const completeOrder = async () => {
    try {
      setProcessingAction(true);

      console.log('🔍 COMPLETE ORDER DEBUG START:', {orderId});

      // ✅ Завершение заказа исполнителем (POST /orders/{id}/complete)
      const response = await retryApiCall(() =>
        api.orders.ordersComplete(orderId),
      );

      console.log('🔍 COMPLETE ORDER RESPONSE:', response);

      if (response.success) {
        console.log('Order completed by executor successfully');

        // ✅ Обновляем данные с сервера
        console.log('🔍 REFRESHING ORDER DATA...');
        await refreshOrderData();
        console.log('🔍 ORDER DATA REFRESHED');

        // Открываем модальное окно для отзыва о заказчике
        setCustomerReviewModalVisible(true);

        notifySuccess(t('Success'), t('Order completed successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось завершить заказ');
      }
    } catch (error) {
      console.error('Ошибка при завершении заказа:', error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Произошла ошибка при завершении заказа';
      Alert.alert(t('Error'), errorMessage);

      return {success: false, error: errorMessage};
    } finally {
      setProcessingAction(false);
    }
  };

  const refuseOrder = async () => {
    try {
      setProcessingAction(true);

      // Показываем подтверждение
      showConfirm({
        title: t('Refuse Order'),
        message: t(
          'Are you sure you want to refuse this order? It will be returned to order selection.',
        ),
        onConfirm: async () => {
          try {
            const response = await retryApiCall(() =>
              api.orders.ordersRefuse(orderId),
            );

            if (response.success) {
              notifySuccess(t('Success'), t('You have refused the order'));
              // Обновляем данные заказа
              await refreshOrderData();
            } else {
              throw new Error(response.message || 'Failed to refuse order');
            }
          } catch (error) {
            notifyError(
              t('Error'),
              error.message || t('Failed to refuse order'),
            );
          } finally {
            setProcessingAction(false);
          }
        },
        onCancel: () => {
          setProcessingAction(false);
        },
        confirmText: t('Refuse'),
        cancelText: t('Cancel'),
      });
    } catch (error) {
      console.error('Error refusing order:', error);
      setProcessingAction(false);
    }
  };

  const archiveOrder = async () => {
    try {
      setProcessingAction(true);

      // Показываем подтверждение
      showConfirm({
        title: t('Archive Order'),
        message: t(
          'Are you sure you want to move this order to archive? You can still access it in the archived orders section.',
        ),
        onConfirm: async () => {
          try {
            const response = await retryApiCall(() =>
              api.orders.ordersArchiveByExecutor(orderId),
            );

            if (response.success) {
              notifySuccess(t('Success'), t('Order moved to archive'));
              // Обновляем данные заказа
              await refreshOrderData();
            } else {
              throw new Error(response.message || 'Failed to archive order');
            }
          } catch (error) {
            notifyError(
              t('Error'),
              error.message || t('Failed to archive order'),
            );
          } finally {
            setProcessingAction(false);
          }
        },
        onCancel: () => {
          setProcessingAction(false);
        },
        confirmText: t('Archive'),
        cancelText: t('Cancel'),
      });
    } catch (error) {
      console.error('Error archiving order:', error);
      setProcessingAction(false);
    }
  };

  const viewContacts = async () => {
    // Показываем предупреждение о списании средств за просмотр контактов
    Alert.alert(t('View contacts'), t('View contacts billing warning'), [
      {
        text: t('Cancel'),
        style: 'cancel',
      },
      {
        text: t('View contacts'),
        onPress: async () => {
          try {
            setProcessingAction(true);

            if (!orderData?.responseId) {
              notifyError(
                t('Error'),
                t('You need to respond to the order first'),
              );
              return {success: false};
            }

            console.log(
              'Requesting contacts with responseId:',
              orderData.responseId,
            );

            // ✅ Примечание: Этот метод используется заказчиком для отправки контактов исполнителю
            // Для исполнителя контакты должны быть уже доступны после того, как заказчик их отправил
            // Возможно, нужен другой API метод для получения контактов исполнителем

            // Пока используем текущий метод, но это может потребовать корректировки
            const response = await retryApiCall(() =>
              api.orders.responsesSendContact(orderId, orderData.responseId),
            );

            if (response.success) {
              console.log('Contact request processed successfully via API');

              setContactsViewed(true);

              // После запроса контактов обновляем данные заказа из API
              await refreshOrderData();

              notifySuccess(
                t('Success'),
                t('Contact request sent successfully'),
              );
              return {success: true};
            } else {
              throw new Error(
                response.message || 'Не удалось запросить контакты заказчика',
              );
            }
          } catch (error) {
            console.error('Ошибка при запросе контактов:', error);

            const errorMessage =
              error.response?.data?.error ||
              error.message ||
              'Произошла ошибка при запросе контактов';
            notifyError(t('Error'), errorMessage);

            return {success: false, error: errorMessage};
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
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
      duration: 200,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  // ✅ Улучшенная функция открытия ссылок с fallback вариантами
  const openLink = async (type, value) => {
    if (!value || value.trim() === '') {
      notifyError(t('Error'), t('Contact information is not available'));
      return;
    }

    const cleanValue = value.trim();

    switch (type) {
      case 'phone':
        await openPhoneLink(cleanValue);
        break;
      case 'email':
        await openEmailLink(cleanValue);
        break;
      case 'telegram':
        await openTelegramLink(cleanValue);
        break;
      case 'whatsapp':
        await openWhatsAppLink(cleanValue);
        break;
      case 'viber':
        await openViberLink(cleanValue);
        break;
      case 'facebook':
        await openFacebookLink(cleanValue);
        break;
      default:
        notifyError(t('Error'), t('Unsupported contact type'));
    }
  };

  // Функция для открытия телефонных ссылок
  const openPhoneLink = async phone => {
    const telUrl = `tel:${phone}`;

    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
      } else {
        showConfirm({
          title: t('Cannot make call'),
          message: t(
            'Phone calls are not supported on this device. Would you like to copy the number?',
          ),
          cancelText: t('Cancel'),
          confirmText: t('Copy'),
          onConfirm: () => {
            Alert.alert(t('Phone Number'), phone, [
              {text: t('OK'), style: 'default'},
            ]);
          },
        });
      }
    } catch (error) {
      console.error('Error opening phone link:', error);
      notifyError(t('Error'), t('Failed to open phone application'));
    }
  };

  // Функция для открытия email ссылок
  const openEmailLink = async email => {
    const mailtoUrl = `mailto:${email}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        showConfirm({
          title: t('Cannot send email'),
          message: t(
            'Email application is not available. Would you like to copy the email address?',
          ),
          cancelText: t('Cancel'),
          confirmText: t('Copy'),
          onConfirm: () => {
            Alert.alert(t('Email Address'), email, [
              {text: t('OK'), style: 'default'},
            ]);
          },
        });
      }
    } catch (error) {
      console.error('Error opening email link:', error);
      notifyError(t('Error'), t('Failed to open email application'));
    }
  };

  // Функция для открытия Telegram ссылок
  const openTelegramLink = async username => {
    const cleanUsername = username.replace('@', '');
    const telegramAppUrl = `tg://resolve?domain=${cleanUsername}`;
    const telegramWebUrl = `https://t.me/${cleanUsername}`;

    try {
      const canOpenApp = await Linking.canOpenURL(telegramAppUrl);
      if (canOpenApp) {
        await Linking.openURL(telegramAppUrl);
        return;
      }

      Alert.alert(
        t('Open Telegram'),
        t('Telegram app is not installed. How would you like to proceed?'),
        [
          {text: t('Cancel'), style: 'cancel'},
          {
            text: t('Open in Browser'),
            onPress: async () => {
              try {
                await Linking.openURL(telegramWebUrl);
              } catch (error) {
                console.error('Error opening Telegram web:', error);
                Alert.alert(
                  t('Error'),
                  t('Failed to open Telegram in browser'),
                );
              }
            },
          },
          {
            text: t('Copy Username'),
            onPress: () => {
              Alert.alert(t('Telegram Username'), `@${cleanUsername}`, [
                {text: t('OK'), style: 'default'},
              ]);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error opening Telegram link:', error);
      Alert.alert(t('Error'), t('Failed to open Telegram'));
    }
  };

  // Функция для открытия WhatsApp ссылок
  const openWhatsAppLink = async phone => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
    const whatsappWebUrl = `https://wa.me/${cleanPhone.replace('+', '')}`;

    try {
      const canOpenApp = await Linking.canOpenURL(whatsappUrl);
      if (canOpenApp) {
        await Linking.openURL(whatsappUrl);
        return;
      }

      Alert.alert(
        t('Open WhatsApp'),
        t('WhatsApp is not installed. How would you like to proceed?'),
        [
          {text: t('Cancel'), style: 'cancel'},
          {
            text: t('Open in Browser'),
            onPress: async () => {
              try {
                await Linking.openURL(whatsappWebUrl);
              } catch (error) {
                console.error('Error opening WhatsApp web:', error);
                Alert.alert(
                  t('Error'),
                  t('Failed to open WhatsApp in browser'),
                );
              }
            },
          },
          {
            text: t('Copy Number'),
            onPress: () => {
              Alert.alert(t('Phone Number'), cleanPhone, [
                {text: t('OK'), style: 'default'},
              ]);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error opening WhatsApp link:', error);
      Alert.alert(t('Error'), t('Failed to open WhatsApp'));
    }
  };

  // Функция для открытия Viber ссылок
  const openViberLink = async phone => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const viberUrl = `viber://chat?number=${cleanPhone}`;

    try {
      const canOpenApp = await Linking.canOpenURL(viberUrl);
      if (canOpenApp) {
        await Linking.openURL(viberUrl);
      } else {
        Alert.alert(
          t('Viber not available'),
          t('Viber is not installed. Would you like to copy the phone number?'),
          [
            {text: t('Cancel'), style: 'cancel'},
            {
              text: t('Copy Number'),
              onPress: () => {
                Alert.alert(t('Phone Number'), cleanPhone, [
                  {text: t('OK'), style: 'default'},
                ]);
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error opening Viber link:', error);
      Alert.alert(t('Error'), t('Failed to open Viber'));
    }
  };

  // Функция для открытия Facebook ссылок
  const openFacebookLink = async username => {
    const cleanUsername = username
      .replace(/^@/, '')
      .replace(/^facebook\.com\//, '');
    const facebookAppUrl = `fb://profile/${cleanUsername}`;
    const facebookWebUrl = `https://www.facebook.com/${cleanUsername}`;

    try {
      const canOpenApp = await Linking.canOpenURL(facebookAppUrl);
      if (canOpenApp) {
        await Linking.openURL(facebookAppUrl);
        return;
      }

      Alert.alert(
        t('Open Facebook'),
        t('Facebook app is not installed. How would you like to proceed?'),
        [
          {text: t('Cancel'), style: 'cancel'},
          {
            text: t('Open in Browser'),
            onPress: async () => {
              try {
                await Linking.openURL(facebookWebUrl);
              } catch (error) {
                console.error('Error opening Facebook web:', error);
                Alert.alert(
                  t('Error'),
                  t('Failed to open Facebook in browser'),
                );
              }
            },
          },
          {
            text: t('Copy Profile'),
            onPress: () => {
              Alert.alert(t('Facebook Profile'), facebookWebUrl, [
                {text: t('OK'), style: 'default'},
              ]);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error opening Facebook link:', error);
      Alert.alert(t('Error'), t('Failed to open Facebook'));
    }
  };

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchOrderData(orderId);

        if (data) {
          setOrderData(data);
        } else {
          setError('Не удалось загрузить данные заказа');
        }
      } catch (err) {
        console.error('Ошибка при загрузке заказа:', err);
        setError('Произошла ошибка при загрузке заказа');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // ✅ Перезагрузка данных при каждом получении фокуса экраном
  useFocusEffect(
    React.useCallback(() => {
      if (orderId) {
        console.log(
          'Экран OrderWorker получил фокус - обновляем данные заказа:',
          orderId,
        );
        refreshOrderData();
      }
    }, [orderId]),
  );

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchOrderData(orderId)
      .then(data => {
        if (data) setOrderData(data);
        else setError('Не удалось загрузить данные заказа');
      })
      .catch(err => setError('Произошла ошибка при загрузке заказа'))
      .finally(() => setLoading(false));
  };

  // Функция для обновления данных после действий пользователя
  const refreshOrderData = async () => {
    try {
      const data = await fetchOrderData(orderId);
      if (data) {
        setOrderData(data);
        console.log('Order data refreshed:', data);
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных заказа:', error);
    }
  };

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
        Alert.alert(
          t('Save Image'),
          t('Where would you like to save the image?'),
          [
            {text: t('Cancel'), style: 'cancel'},
            {
              text: t('Photo Library'),
              onPress: () => saveToPhotoLibrary(fileUrl, fileName),
            },
            {
              text: t('Files App'),
              onPress: () => saveToDocuments(fileUrl, fileName),
            },
          ],
        );
      } else {
        await saveToDocuments(fileUrl, fileName);
      }
    } catch (error) {
      Alert.alert(
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
        Alert.alert(t('Success'), t('Image saved to Photo Library'));
      }
    } catch (error) {
      console.error('Save to photo library error:', error);
      Alert.alert(
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
          Alert.alert(
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
        Alert.alert(
          t('Download Complete'),
          Platform.OS === 'ios'
            ? t('File saved to Files app (Documents)')
            : t('File saved to Downloads folder'),
        );
      }
    } catch (error) {
      Alert.alert(t('Save Failed'), error.message || t('Failed to save file'));
    }
  };

  const submitCustomerReview = async reviewData => {
    try {
      console.log('🔍 SUBMIT CUSTOMER REVIEW DEBUG:', {
        reviewData,
        orderId,
        api_method: 'api.customerReviews.create',
      });

      const response = await retryApiCall(() =>
        api.customerReviews.create(reviewData),
      );

      console.log('🔍 CUSTOMER REVIEW RESPONSE:', response);

      if (response.success) {
        console.log(
          '🔍 REVIEW SUBMITTED SUCCESSFULLY, REFRESHING ORDER DATA...',
        );

        // ДОБАВЛЯЮ ОБНОВЛЕНИЕ ДАННЫХ ЗАКАЗА ПОСЛЕ ОТЗЫВА!
        await refreshOrderData();
        console.log('🔍 ORDER DATA REFRESHED AFTER REVIEW');

        setCustomerReviewModalVisible(false);
        setCanReviewCustomer(false); // Отзыв уже оставлен
        notifySuccess(t('Success'), t('Review submitted successfully'));
        return {success: true};
      } else {
        throw new Error(response.message || 'Не удалось отправить отзыв');
      }
    } catch (error) {
      console.error('Ошибка при отправке отзыва о заказчике:', error);
      notifyError(t('Error'), error.message || t('Failed to submit review'));
      return {success: false};
    }
  };

  const openCustomerReviewModal = () => {
    setCustomerReviewModalVisible(true);
  };

  const closeCustomerReviewModal = () => {
    setCustomerReviewModalVisible(false);
  };

  const checkCanReviewCustomer = async () => {
    try {
      if (!orderData?.id) return;

      const response = await retryApiCall(() =>
        api.customerReviews.canReview(orderData.id),
      );

      if (response.success && response.result) {
        setCanReviewCustomer(response.result.can_review);
      }
    } catch (error) {
      console.error('Ошибка при проверке возможности оставить отзыв:', error);
      setCanReviewCustomer(false);
    }
  };

  // Проверяем возможность оставить отзыв при изменении данных заказа
  useEffect(() => {
    if (orderData && (orderData.status === 5 || orderData.status === 7)) {
      checkCanReviewCustomer();
    }
  }, [orderData?.status, orderData?.id]);

  return {
    orderData,
    activeTab,
    setActiveTab,
    loading,
    error,
    menuVisible,
    menuAnimation,
    contactsViewed,
    processingAction,
    orderStatuses,
    responseStatuses,
    getStatusColor,
    respondToOrder,
    withdrawResponse,
    sendExecutorContacts,
    takeOrder,
    rejectOrder,
    completeOrder,
    refuseOrder,
    archiveOrder,
    viewContacts,
    showMenu,
    hideMenu,
    openLink,
    retry,
    refreshOrderData,
    viewFile,
    downloadFile,
    customerReviewModalVisible,
    submitCustomerReview,
    openCustomerReviewModal,
    closeCustomerReviewModal,
    canReviewCustomer,
  };
};

export default useOrderWorker;
