import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {api, retryApiCall} from '../services';
import {notifyError, notifySuccess} from '../services/notify';
import {useTranslation} from 'react-i18next';

export default function useMediatorOrderSteps(navigation, orderId) {
  const {t} = useTranslation();

  // Состояние
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState(1);
  const [stepData, setStepData] = useState({
    1: {},
    2: {},
    3: {},
  });

  // Состояние модальных окон
  const [modals, setModals] = useState({
    archive: false,
    returnToApp: false,
    complete: false,
  });

  // Функции для управления модальными окнами
  const openModal = modalName => {
    setModals(prev => ({...prev, [modalName]: true}));
  };

  const closeModal = modalName => {
    setModals(prev => ({...prev, [modalName]: false}));
  };

  // Загрузка деталей заказа
  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await retryApiCall(() =>
        api.mediator.getOrderStepDetails(orderId),
      );

      if (response.success && response.result) {
        const data = response.result;
        // Объединяем данные заказа с данными заказчика
        const enrichedOrderData = {
          ...data.order,
          customer: data.customer,
          files: data.files,
        };
        setOrderData(enrichedOrderData);
        setCurrentStep(data.order.mediator_step || 1);
        setActiveTab(data.order.mediator_step || 1);

        // Заполняем данные шагов
        const step1Data = data.all_steps?.find(s => s.step === 1)?.data || {};
        const step2Data = data.all_steps?.find(s => s.step === 2)?.data || {};
        const step3Data = data.all_steps?.find(s => s.step === 3)?.data || {};

        const newStepData = {
          1: {
            ...step1Data,
          },
          2: {
            executor_contact_name: data.order.executor_contact_name || '',
            executor_contact_phone: data.order.executor_contact_phone || '',
            executor_cost: data.order.executor_cost || '',
            mediator_margin: data.order.mediator_margin || '',
            ...step2Data,
          },
          3: {
            project_deadline: data.order.project_deadline || '',
            ...step3Data,
          },
        };

        setStepData(newStepData);
      } else {
        notifyError(t('Error'), t('Failed to load order details'));
      }
    } catch (error) {
      console.error('Error fetching order details:', error);

      // Если заказ не найден (404), возможно посредник не взял его в работу
      if (error.response?.status === 404) {
        console.log(
          `Order ${orderId} not found for mediator - trying to take it`,
        );

        try {
          // Пробуем взять заказ в работу
          const takeResponse = await retryApiCall(() =>
            api.mediator.takeOrder(orderId),
          );

          if (takeResponse.success) {
            notifySuccess(
              t('Order Taken'),
              t('Order taken successfully, loading details...'),
            );
            // Повторно загружаем детали заказа
            await fetchOrderDetails();
            return;
          } else {
            console.log('Failed to take order:', takeResponse.message);
          }
        } catch (takeError) {
          console.error('Failed to take order:', takeError);

          if (takeError.response?.status === 404) {
            notifyError(
              t('Order Not Found'),
              t('Order #{{orderId}} does not exist or is no longer available', {
                orderId,
              }),
            );
          } else if (takeError.response?.status === 400) {
            notifyError(
              t('Cannot Take Order'),
              takeError.response?.data?.message ||
                t('Order cannot be taken at this time'),
            );
          } else {
            notifyError(t('Error'), t('Failed to access order'));
          }
        }

        // Возвращаемся к предыдущему экрану через 2 секунды
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else if (error.response?.status === 403) {
        notifyError(
          t('Access Denied'),
          t('You do not have access to this order'),
        );
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        notifyError(t('Error'), t('Failed to load order details'));
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  // Обновление данных
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  }, [fetchOrderDetails]);

  // Обновление данных шага
  const updateStepData = useCallback(
    async (step, data) => {
      try {
        const response = await retryApiCall(() =>
          api.mediator.updateStepData(orderId, step, data),
        );

        if (response.success) {
          setStepData(prev => {
            const newStepData = {
              ...prev,
              [step]: {...prev[step], ...data},
            };
            return newStepData;
          });

          // Обновляем orderData для синхронизации
          if (step === 3 && data.project_deadline) {
            setOrderData(prev => ({
              ...prev,
              project_deadline: data.project_deadline,
            }));
          }

          return true;
        } else {
          console.error('updateStepData failed:', response.message);
          notifyError(
            t('Error'),
            response.message || t('Failed to update step data'),
          );
          return false;
        }
      } catch (error) {
        console.error('Error updating step data:', error);
        notifyError(t('Error'), t('Failed to update step data'));
        return false;
      }
    },
    [orderId, t],
  );

  // Переход к следующему шагу
  const moveToNextStep = useCallback(
    async stepNumber => {
      try {
        console.log('moveToNextStep called with stepNumber:', stepNumber);
        console.log('Current stepData for step:', stepData[stepNumber]);

        const response = await retryApiCall(() =>
          api.mediator.moveToNextStep(orderId, {
            step_data: stepData[stepNumber] || {},
          }),
        );

        console.log('moveToNextStep response:', response);

        if (response.success) {
          notifySuccess(t('Success'), t('Moved to next step successfully'));
          await fetchOrderDetails();
        } else {
          console.error('moveToNextStep failed:', response.message);
          notifyError(
            t('Error'),
            response.message || t('Failed to move to next step'),
          );
        }
      } catch (error) {
        console.error('Error moving to next step:', error);
        notifyError(t('Error'), t('Failed to move to next step'));
      }
    },
    [orderId, stepData, t, fetchOrderDetails],
  );

  // Архивирование заказа
  const archiveOrder = useCallback(
    async reason => {
      try {
        const response = await retryApiCall(() =>
          api.mediator.archiveOrder(orderId, {reason}),
        );

        if (response.success) {
          notifySuccess(t('Success'), t('Order archived successfully'));
          closeModal('archive');
          navigation.goBack();
        } else {
          notifyError(
            t('Error'),
            response.message || t('Failed to archive order'),
          );
        }
      } catch (error) {
        console.error('Error archiving order:', error);
        notifyError(t('Error'), t('Failed to archive order'));
      }
    },
    [orderId, t, navigation],
  );

  // Возврат заказа в приложение
  const returnToApp = useCallback(
    async reason => {
      try {
        const response = await retryApiCall(() =>
          api.mediator.returnOrderToApp(orderId, {reason}),
        );

        if (response.success) {
          notifySuccess(t('Success'), t('Order returned to app successfully'));
          closeModal('returnToApp');
          navigation.goBack();
        } else {
          notifyError(
            t('Error'),
            response.message || t('Failed to return order to app'),
          );
        }
      } catch (error) {
        console.error('Error returning order to app:', error);
        notifyError(t('Error'), t('Failed to return order to app'));
      }
    },
    [orderId, t, navigation],
  );

  // Успешное завершение заказа
  const completeOrderSuccessfully = useCallback(
    async notes => {
      try {
        const response = await retryApiCall(() =>
          api.mediator.completeOrderSuccessfully(orderId, {notes}),
        );

        if (response.success) {
          notifySuccess(t('Success'), t('Order completed successfully'));
          closeModal('complete');
          navigation.goBack();
        } else {
          notifyError(
            t('Error'),
            response.message || t('Failed to complete order'),
          );
        }
      } catch (error) {
        console.error('Error completing order:', error);
        notifyError(t('Error'), t('Failed to complete order'));
      }
    },
    [orderId, t, navigation],
  );

  // Завершение заказа с отказом
  const completeOrderWithRejection = useCallback(
    async reason => {
      try {
        const response = await retryApiCall(() =>
          api.mediator.completeOrderWithRejection(orderId, {reason}),
        );

        if (response.success) {
          notifySuccess(t('Success'), t('Order rejected successfully'));
          closeModal('complete');
          navigation.goBack();
        } else {
          notifyError(
            t('Error'),
            response.message || t('Failed to reject order'),
          );
        }
      } catch (error) {
        console.error('Error rejecting order:', error);
        notifyError(t('Error'), t('Failed to reject order'));
      }
    },
    [orderId, t, navigation],
  );

  return {
    // Состояние
    loading,
    refreshing,
    orderData,
    currentStep,
    activeTab,
    setActiveTab,
    stepData,
    modals,

    // Функции управления модальными окнами
    openModal,
    closeModal,

    // Основные функции
    fetchOrderDetails,
    handleRefresh,
    updateStepData,
    moveToNextStep,
    archiveOrder,
    returnToApp,
    completeOrderSuccessfully,
    completeOrderWithRejection,
  };
}
