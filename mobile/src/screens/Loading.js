import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator, Animated, Image} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import styles from '../styles';
import Text from '../components/Text';
import useLoading from '../hooks/useLoading';
import OnboardingModal from '../components/OnboardingModal';

// Универсальный компонент загрузки для использования в других местах
export function LoadingComponent({
  showLogo = false,
  showText = true,
  text = 'Loading...',
  style = {},
}) {
  return (
    <View style={[loadingStyles.simpleContainer, style]}>
      <View style={loadingStyles.simpleContent}>
        {showLogo && (
          <View style={loadingStyles.simpleLogoContainer}>
            <View style={loadingStyles.simpleLogoCircle}>
              <Text style={loadingStyles.simpleLogoText}>B</Text>
            </View>
          </View>
        )}

        <View style={loadingStyles.simpleLoadingContainer}>
          <ActivityIndicator size="large" color={styles.colors.primary} />
          {showText && (
            <Text style={loadingStyles.simpleLoadingText}>{text}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function Loading({navigation, route}) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const {auth} = useLoading(navigation);

  // Анимация появления
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Для тестирования: чтобы сбросить онбординг, выполните в консоли:
  // AsyncStorage.removeItem('hasCompletedOnboarding');

  // Проверяем статус авторизации и онбординга
  useEffect(() => {
    console.log('Loading: useEffect triggered', {
      authLogged: auth.logged,
      authPersist: auth._persist,
      rehydrated: auth._persist?.rehydrated,
    });

    // Таймаут для принудительного продолжения если гидратация зависла
    const fallbackTimeout = setTimeout(() => {
      console.log('Loading: Fallback timeout triggered, forcing continuation');
      setOnboardingChecked(true);
    }, 3000); // 3 секунды

    const checkAuthAndOnboardingStatus = async () => {
      try {
        // Небольшая задержка для завершения Redux операций
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('Loading: Starting auth and onboarding checks', {
          authLogged: auth.logged,
          authToken: auth.token,
          authUserData: auth.userData,
        });
        // Проверяем, был ли передан параметр для принудительного показа онбординга
        const forceShowOnboarding = route?.params?.showOnboarding;

        if (forceShowOnboarding) {
          // Если пришли с параметром showOnboarding - показываем онбординг
          console.log('Loading: Force showing onboarding from params');
          setIsFirstTime(false); // Не первый раз, но показываем онбординг
          setShowOnboarding(true);
          setOnboardingChecked(true);
          return;
        }

        // Проверяем все возможные ключи онбординга
        const hasCompletedOnboarding = await AsyncStorage.getItem(
          'hasCompletedOnboarding',
        );
        const onboardingCompleted = await AsyncStorage.getItem(
          'onboarding_completed',
        );

        // Проверяем персональные ключи онбординга
        const keys = await AsyncStorage.getAllKeys();
        const personalOnboardingKeys = keys.filter(key =>
          key.startsWith('onboarding_completed_'),
        );

        // Если есть любой ключ онбординга, считаем что онбординг был пройден
        const hasAnyOnboarding =
          hasCompletedOnboarding ||
          onboardingCompleted ||
          personalOnboardingKeys.length > 0;

        console.log('Loading: Onboarding check result:', {
          hasCompletedOnboarding,
          onboardingCompleted,
          personalOnboardingKeys,
          hasAnyOnboarding,
          authLogged: auth.logged,
          authToken: auth.token,
          authUserData: auth.userData,
          forceShowOnboarding,
        });

        if (auth.logged) {
          // Если пользователь залогинен - переходим к главному экрану
          console.log('Loading: User is logged in, going to MainStack');
          navigation.replace('MainStack');
        } else {
          // Если не залогинен - ВСЕГДА показываем онбординг
          console.log('Loading: User not logged in, showing onboarding');
          setIsFirstTime(!hasAnyOnboarding); // true если первый запуск
          setShowOnboarding(true);
        }
        setOnboardingChecked(true);
        clearTimeout(fallbackTimeout); // Очищаем таймаут при успешном завершении
      } catch (error) {
        console.error('Error checking auth and onboarding status:', error);
        // В случае ошибки показываем онбординг для безопасности и считаем первым запуском
        setIsFirstTime(true);
        setShowOnboarding(true);
        setOnboardingChecked(true);
        clearTimeout(fallbackTimeout); // Очищаем таймаут при ошибке
      }
    };

    checkAuthAndOnboardingStatus();

    // Очищаем таймаут при размонтировании компонента
    return () => clearTimeout(fallbackTimeout);
  }, [auth.logged, auth._persist, navigation, route?.params?.showOnboarding]);

  const handleOnboardingComplete = async () => {
    try {
      // Сохраняем завершение онбординга, чтобы больше не показывать его
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setShowOnboarding(false);
      // После завершения онбординга переходим к экрану авторизации с параметром
      navigation.replace('Auth', {fromOnboarding: true});
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      setShowOnboarding(false);
      navigation.replace('Auth', {fromOnboarding: true});
    }
  };

  const handleOnboardingCompleteToRegistration = async selectedRole => {
    try {
      // Сохраняем завершение онбординга, чтобы больше не показывать его
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setShowOnboarding(false);
      // После завершения разрешений переходим к экрану регистрации
      navigation.replace('Register', {fromOnboarding: true, selectedRole});
    } catch (error) {
      console.error(
        'Error during onboarding completion to registration:',
        error,
      );
      setShowOnboarding(false);
      navigation.replace('Register', {fromOnboarding: true, selectedRole});
    }
  };

  // Показываем красивый экран загрузки пока не проверили статус онбординга
  if (!onboardingChecked) {
    return <LoadingComponent showLogo={true} text="Loading..." />;
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: styles.colors.background,
      }}>
      {/* Показываем онбординг только при первом запуске */}
      <OnboardingModal
        visible={showOnboarding}
        userType="1" // Можно поменять на "0" для тестирования версии исполнителя
        isFirstTime={isFirstTime}
        onComplete={handleOnboardingComplete}
        onCompleteToRegistration={handleOnboardingCompleteToRegistration}
      />
    </View>
  );
}

const loadingStyles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 48,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  // Декоративные элементы
  decorativeCircle1: {
    position: 'absolute',
    top: 100,
    right: 50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 150,
    left: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 200,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  // Стили для универсального компонента
  simpleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: styles.colors.background,
  },
  simpleContent: {
    alignItems: 'center',
    gap: 24,
  },
  simpleLogoContainer: {
    marginBottom: 8,
  },
  simpleLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: styles.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  simpleLogoText: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 28,
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  simpleLoadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  simpleLoadingText: {
    fontSize: styles.fonSize.md,
    fontWeight: '500',
    color: styles.colors.titles,
    fontFamily: 'Inter',
  },
};
