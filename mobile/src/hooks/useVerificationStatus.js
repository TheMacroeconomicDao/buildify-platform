import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

/**
 * Хук для отслеживания изменений статуса верификации через WebSocket
 */
export const useVerificationStatus = () => {
  const websocketState = useSelector(state => state.websocket);
  const auth = useSelector(state => state.auth);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Инициализируем начальный статус из данных пользователя
    if (auth.userData?.verification_status !== undefined) {
      setVerificationStatus(auth.userData.verification_status);
    }
  }, [auth.userData?.verification_status]);

  useEffect(() => {
    // Отслеживаем обновления верификации через WebSocket
    if (websocketState.lastVerificationUpdate) {
      const update = websocketState.lastVerificationUpdate;

      // Обновляем статус только если это касается текущего пользователя
      if (auth.userData?.id) {
        setVerificationStatus(update.newStatus);
        setLastUpdate(update);
      }
    }
  }, [websocketState.lastVerificationUpdate, auth.userData?.id]);

  // Вспомогательные функции для проверки статуса
  const isVerificationPending = () => verificationStatus === 0;
  const isVerificationApproved = () => verificationStatus === 1;
  const isVerificationRejected = () => verificationStatus === 2;
  const isVerificationNotRequired = () => verificationStatus === 3;

  // Получение текстового описания статуса
  const getVerificationStatusLabel = () => {
    switch (verificationStatus) {
      case 0:
        return 'Under Review';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      case 3:
        return 'Not Required';
      default:
        return 'Unknown';
    }
  };

  // Получение цвета для статуса
  const getVerificationStatusColor = () => {
    switch (verificationStatus) {
      case 0:
        return '#FFA500'; // Orange - pending
      case 1:
        return '#28A745'; // Green - approved
      case 2:
        return '#DC3545'; // Red - rejected
      case 3:
        return '#6C757D'; // Gray - not required
      default:
        return '#6C757D';
    }
  };

  return {
    verificationStatus,
    lastUpdate,
    isVerificationPending,
    isVerificationApproved,
    isVerificationRejected,
    isVerificationNotRequired,
    getVerificationStatusLabel,
    getVerificationStatusColor,
  };
};
