import {useRef, useEffect} from 'react';
import {Animated, Dimensions} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {subscriptionsService} from '../services';

export default function usePayResult({navigation, route}) {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const userType = auth?.userData?.type || 1; // По умолчанию заказчик

  // Проверка успешности оплаты
  const isPaymentSuccessful = route?.params?.success;

  // Обновляем подписку при успешной оплате
  useEffect(() => {
    if (isPaymentSuccessful) {
      console.log('PayResult: Payment successful, updating subscription data');
      subscriptionsService.getCurrentSubscription().catch(error => {
        console.error(
          'PayResult: Error updating subscription after payment:',
          error,
        );
      });
    }
  }, [isPaymentSuccessful]);

  // Функция для создания анимации конфетти
  const createConfettiAnimation = (angle, distance, delay, rotation) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Анимация движения и вращения
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: Math.sin(angle) * distance * -1, // Движение вверх (ось Y инвертирована)
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: rotation, // Вращение
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return {translateX, translateY, opacity, rotate};
  };

  // Генерация конфетти
  const generateConfetti = () => {
    const confetti = [];
    const colors = ['#FFD700', '#FF6347', '#00FF7F', '#1E90FF', '#FF69B4'];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI + (Math.random() * Math.PI) / 8; // Угол от -90° до 90° (все стороны, кроме вниз)
      const distance = Math.random() * 300 + 100; // Случайная дистанция
      const color = colors[Math.floor(Math.random() * colors.length)]; // Случайный цвет
      const delay = Math.random() * 500; // Случайная задержка
      const rotation = Math.random() * 360; // Случайный угол вращения
      confetti.push({
        key: i,
        angle,
        distance,
        color,
        delay,
        rotation,
      });
    }
    return confetti;
  };

  // Функции навигации
  const handleGoToMain = () => {
    // Определяем правильный главный экран в зависимости от типа пользователя
    let mainScreenName = 'Main'; // По умолчанию заказчик (type = 1)

    if (userType == '0' || userType === 0) {
      mainScreenName = 'MainWorker'; // Исполнитель
    } else if (userType == '2' || userType === 2) {
      mainScreenName = 'MainMediator'; // Посредник
    }

    console.log(
      'PayResult: Navigating to',
      mainScreenName,
      'for user type',
      userType,
    );

    // Переходим на главный экран через TabStack
    navigation.reset({
      index: 0,
      routes: [{name: 'MainStack'}],
    });
  };

  const handleTryAgain = () => {
    // Перейти на экран Subscription для повторной попытки
    navigation.pop();
    navigation.navigate('Subscription');
  };

  return {
    isPaymentSuccessful,
    generateConfetti,
    createConfettiAnimation,
    handleGoToMain, // Переименовано из handleSelectWorkout
    handleTryAgain,
    t,
  };
}
