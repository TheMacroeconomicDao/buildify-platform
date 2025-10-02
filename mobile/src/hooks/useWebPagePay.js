import {useNavigation} from '@react-navigation/native';
import {subscriptionsService} from '../services';
import walletService from '../services/walletService';
import {Alert} from 'react-native';
import {notifyError} from '../services/notify';
import {useTranslation} from 'react-i18next';

/**
 * Хук для обработки платежей в веб-представлении
 * @param {string} paymentUrl - URL страницы оплаты
 * @returns {object} Объект с функцией обработки изменения состояния навигации
 */
export default function useWebPagePay({paymentUrl, context}) {
  const navigation = useNavigation();
  const {t} = useTranslation();

  /**
   * Обрабатывает успешную оплату
   */
  const handlePaymentSuccess = async () => {
    try {
      if (context === 'wallet_topup') {
        await walletService.getWallet();
      } else {
        // Обновляем информацию о подписке в хранилище Redux
        await subscriptionsService.getCurrentSubscription();
      }

      // Переходим на экран успешной оплаты
      navigation.pop(); // Закрыть текущий экран
      navigation.navigate('PayResult', {success: true});
    } catch (error) {
      console.error('Error updating subscription after payment:', error);
      notifyError(
        t('Error'),
        t(
          'Failed to update subscription information after payment. Please check your active subscription in the Subscription section.',
        ),
      );
      navigation.pop(); // Закрыть текущий экран
    }
  };

  /**
   * Обрабатывает неудачную оплату или отмену
   */
  const handlePaymentFailure = () => {
    navigation.pop(); // Закрыть текущий экран
    navigation.navigate('PayResult', {success: false});
  };

  /**
   * Обрабатывает изменение URL в WebView
   * @param {object} navState - Состояние навигации
   */
  const handleNavigationStateChange = navState => {
    const {url} = navState;
    console.log('WebView navigation to URL:', url);

    // Проверяем различные URL окончания оплаты подписки

    // Успешная оплата
    if (
      url.includes('/subscription/success') ||
      url.includes('success=true') ||
      url.includes('/checkout/success') ||
      url.includes('/payment_success') ||
      (url.includes('type=wallet_topup') && url.includes('session_id='))
    ) {
      handlePaymentSuccess();
      return;
    }

    // Отмена оплаты
    if (
      url.includes('/subscription/cancel') ||
      url.includes('cancel=true') ||
      url.includes('/checkout/cancel') ||
      url.includes('/payment_cancelled') ||
      (url.includes('type=wallet_topup') && !url.includes('session_id='))
    ) {
      handlePaymentFailure();
      return;
    }

    // Проверка на возврат в приложение через специальный URL
    if (url.includes('buildify://') || url.includes('return_to=app')) {
      // Если в URL есть параметр success=true, считаем оплату успешной
      if (url.includes('success=true')) {
        handlePaymentSuccess();
      } else {
        navigation.pop(); // Просто возвращаемся на предыдущий экран
      }
      return;
    }
  };

  return {
    uri: paymentUrl,
    handleNavigationStateChange,
  };
}
