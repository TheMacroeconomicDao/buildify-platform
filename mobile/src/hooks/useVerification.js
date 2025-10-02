import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';

export const useVerification = () => {
  const {t} = useTranslation();
  const userData = useSelector(state => state.auth.userData);

  // Определяем тип пользователя (0=Исполнитель, 1=Заказчик)
  const isWorker = userData?.type === 0;

  // Статус верификации: 0 - Pending, 1 - Approved, 2 - Rejected, 3 - NotRequired
  const verificationStatus = userData?.verification_status || 0;

  // Проверяем верифицирован ли исполнитель
  const isVerified = verificationStatus === 1 || verificationStatus === 3;

  // Проверяем нужна ли верификация (только для исполнителей)
  const needsVerification = isWorker && !isVerified;

  // Получаем сообщение в зависимости от статуса
  const getVerificationMessage = () => {
    if (!isWorker) {
      return null; // Заказчикам верификация не нужна
    }

    switch (verificationStatus) {
      case 0:
        return {
          title: t('Under review'),
          message: t(
            'Your account is under verification. Please wait for administration approval.',
          ),
          type: 'info',
        };
      case 1:
        return null; // Верифицирован - сообщения не нужны
      case 2:
        return {
          title: t('Rejected'),
          message: t(
            'Your account has been rejected. Please check your license and upload a new one.',
          ),
          type: 'error',
        };
      case 3:
        return null; // Верификация не требуется - сообщения не нужны
      default:
        return {
          title: t('Worker not verified'),
          message: t(
            'Please upload your license for verification to access worker features.',
          ),
          type: 'warning',
        };
    }
  };

  // Можно ли исполнителю получать доступ к заказам
  const canAccessOrders = !isWorker || isVerified;

  // Можно ли исполнителю отвечать на заказы
  const canRespondToOrders = !isWorker || isVerified;

  return {
    isWorker,
    isVerified,
    needsVerification,
    verificationStatus,
    canAccessOrders,
    canRespondToOrders,
    getVerificationMessage,
    userData,
  };
};

export default useVerification;
