import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Modal,
  Dimensions,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
  notifyWarning,
  showConfirm,
} from '../services/notify';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-community/async-storage';
import Text from './Text';
import StandardButton from './StandardButton';
import RadioSelect from './RadioSelect';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {width: screenWidth} = Dimensions.get('window');

const OnboardingModal = ({
  visible,
  userType,
  isFirstTime = true,
  onComplete,
  onCompleteToRegistration,
}) => {
  const {t, i18n} = useTranslation();
  // Для первого запуска начинаем с выбора языка, для повторного - сразу с welcome screen
  const [showLanguageSelection, setShowLanguageSelection] =
    useState(isFirstTime);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(!isFirstTime);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showUserAgreement, setShowUserAgreement] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.language || 'en-US',
  ); // Текущий язык приложения
  // Для повторного входа соглашения уже приняты
  const [agreedToTerms, setAgreedToTerms] = useState(!isFirstTime);

  // Состояния для разрешений
  const [permissionsStatus, setPermissionsStatus] = useState({
    camera: 'not-requested', // 'not-requested', 'granted', 'denied'
    notifications: 'not-requested',
    location: 'not-requested',
  });
  const [requestingPermissions, setRequestingPermissions] = useState(false);

  // Состояния для экранов заказчика и исполнителя
  const [showCustomerSteps, setShowCustomerSteps] = useState(false); // Показывать шаги заказчика
  const [showPerformerSteps, setShowPerformerSteps] = useState(false); // Показывать шаги исполнителя
  const [showPermissions, setShowPermissions] = useState(false); // Показывать страницу доступов
  const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2 для шагов
  const currentStepRef = useRef(0); // Ref для актуального значения currentStep
  const targetStepRef = useRef(0); // Ref для целевого шага (куда анимируем)
  const agreementTranslateY = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Инициализация выбранного языка при открытии
  useEffect(() => {
    if (visible) {
      // Устанавливаем текущий язык приложения как выбранный
      const currentLanguage = i18n.language || 'en-US';
      setSelectedLanguage(currentLanguage);
    }
  }, [visible, i18n.language]);

  // Опции языков: только английский и арабский
  const languageOptions = [
    {key: 'en-US', value: 'English'}, // Английский
    {key: 'ar-SA', value: 'العربية'}, // Арабский
  ];

  // Функция для изменения языка
  const changeLanguage = async languageCode => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('language', languageCode);
      setSelectedLanguage(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Функция для продолжения с страницы выбора языка
  const proceedFromLanguageSelection = () => {
    setShowLanguageSelection(false);
    // Возвращаемся к экрану приветствия
    setShowWelcomeScreen(true);
  };

  // Функция для продолжения с экрана приветствия
  const proceedFromWelcomeScreen = () => {
    setShowWelcomeScreen(false);
    setShowRoleSelection(true); // Переходим к экрану выбора роли
  };

  // Функции для открытия экранов соглашений
  const openUserAgreement = () => {
    setShowUserAgreement(true);
  };

  const openPrivacyPolicy = () => {
    setShowPrivacyPolicy(true);
  };

  const goBackToWelcome = () => {
    setShowUserAgreement(false);
    setShowPrivacyPolicy(false);
  };

  // Функции для управления экраном выбора роли
  const [selectedRole, setSelectedRole] = useState('1'); // По умолчанию выбран заказчик

  const goBackToWelcome2 = () => {
    setShowRoleSelection(false);
    setShowWelcomeScreen(true);
  };

  const selectRole = roleType => {
    setSelectedRole(roleType);
  };

  const proceedWithRole = () => {
    if (selectedRole) {
      if (!isFirstTime) {
        // Для повторного входа сразу переходим к разрешениям
        setShowRoleSelection(false);
        setShowPermissions(true);
      } else {
        // Для первого входа показываем информационные экраны
        if (selectedRole === '1') {
          // Для заказчика показываем дополнительные экраны
          setShowRoleSelection(false);
          setCurrentStep(0);
          currentStepRef.current = 0;
          targetStepRef.current = 0;
          slideAnimation.setValue(0);
          setShowCustomerSteps(true);
        } else if (selectedRole === '0') {
          // Для исполнителя показываем дополнительные экраны
          setShowRoleSelection(false);
          setCurrentStep(0);
          currentStepRef.current = 0;
          targetStepRef.current = 0;
          slideAnimation.setValue(0);
          setShowPerformerSteps(true);
        } else if (selectedRole === '2') {
          // Для посредника сразу переходим к разрешениям (как для заказчика)
          setShowRoleSelection(false);
          setShowPermissions(true);
        } else {
          onComplete();
        }
      }
    }
  };

  // Функции навигации для экранов заказчика
  const animateToStep = stepIndex => {
    console.log(
      'animateToStep called with:',
      stepIndex,
      'currentStep:',
      currentStep,
      'currentStepRef:',
      currentStepRef.current,
    );

    // Останавливаем предыдущую анимацию
    slideAnimation.stopAnimation();

    // Устанавливаем целевой шаг сразу
    targetStepRef.current = stepIndex;

    Animated.timing(slideAnimation, {
      toValue: -stepIndex * screenWidth,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      console.log('Animation completed to step:', stepIndex);
      currentStepRef.current = stepIndex;
      setCurrentStep(stepIndex);
    });
  };

  const completeCustomerOnboarding = () => {
    setShowCustomerSteps(false);
    setShowPermissions(true);
  };

  const completePerformerOnboarding = () => {
    setShowPerformerSteps(false);
    setShowPermissions(true);
  };

  // Функции для запроса разрешений (временная реализация)
  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('Camera Permission'),
            message: t(
              'This app needs camera access to take photos for your orders',
            ),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // На iOS показываем сообщение, что разрешение будет запрошено при использовании
        return true;
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('Location Permission'),
            message: t(
              'This app needs location access to show you relevant nearby orders',
            ),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // На iOS показываем сообщение, что разрешение будет запрошено при использовании
        return true;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const requestNotificationsPermission = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: t('Notifications Permission'),
            message: t(
              'This app needs notification access to inform you about important updates',
            ),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // На iOS и старых версиях Android возвращаем true
        return true;
      }
    } catch (error) {
      console.error('Error requesting notifications permission:', error);
      return false;
    }
  };

  const requestAllPermissions = async () => {
    setRequestingPermissions(true);

    try {
      // Запрашиваем разрешения по очереди
      const cameraGranted = await requestCameraPermission();
      setPermissionsStatus(prev => ({
        ...prev,
        camera: cameraGranted ? 'granted' : 'denied',
      }));

      const locationGranted = await requestLocationPermission();
      setPermissionsStatus(prev => ({
        ...prev,
        location: locationGranted ? 'granted' : 'denied',
      }));

      const notificationsGranted = await requestNotificationsPermission();
      setPermissionsStatus(prev => ({
        ...prev,
        notifications: notificationsGranted ? 'granted' : 'denied',
      }));

      // Показываем результат
      const allGranted =
        cameraGranted && locationGranted && notificationsGranted;
      const someGranted =
        cameraGranted || locationGranted || notificationsGranted;

      // Небольшая задержка для лучшего UX
      setTimeout(() => {
        if (Platform.OS === 'ios') {
          // На iOS показываем информационное сообщение
          Alert.alert(
            t('Permissions Setup'),
            t(
              'Permissions will be requested when you first use each feature. You can manage them later in Settings > Buildify.',
            ),
            [{text: t('OK'), onPress: () => completeToRegistration()}],
          );
        } else {
          // На Android показываем результаты запроса разрешений
          if (allGranted) {
            notifySuccess(
              t('Success'),
              t('All permissions granted! You can now use all app features.'),
              {onPress: () => completeToRegistration()},
            );
          } else if (someGranted) {
            const grantedList = [];
            if (cameraGranted) grantedList.push(t('Camera'));
            if (locationGranted) grantedList.push(t('Location'));
            if (notificationsGranted) grantedList.push(t('Notifications'));
            showConfirm({
              title: t('Partial Access'),
              message: t(
                'Granted: {{permissions}}. You can change permissions later in device settings.',
                {permissions: grantedList.join(', ')},
              ),
              cancelText: t('Settings'),
              confirmText: t('Continue'),
              onCancel: () => Linking.openSettings(),
              onConfirm: () => completeToRegistration(),
            });
          } else {
            showConfirm({
              title: t('Limited Access'),
              message: t(
                'No permissions were granted. You can enable them later in device settings for full functionality.',
              ),
              cancelText: t('Settings'),
              confirmText: t('Continue'),
              onCancel: () => Linking.openSettings(),
              onConfirm: () => completeToRegistration(),
            });
          }
        }
      }, 500);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      notifyError(
        t('Error'),
        t(
          'Something went wrong while requesting permissions. Please try again.',
        ),
        {onPress: () => completeToRegistration()},
      );
    } finally {
      setRequestingPermissions(false);
    }
  };

  const completePermissions = () => {
    requestAllPermissions();
  };

  // Функция для завершения онбординга с переходом к регистрации
  const completeToRegistration = async () => {
    try {
      // Сохраняем завершение онбординга сразу после получения разрешений
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }

    if (onCompleteToRegistration) {
      onCompleteToRegistration(selectedRole);
    } else {
      onComplete();
    }
  };

  const goBackToRoleSelection = () => {
    setShowCustomerSteps(false);
    setShowPerformerSteps(false);
    setShowPermissions(false);
    setShowRoleSelection(true);
    setCurrentStep(0);
    currentStepRef.current = 0;
    targetStepRef.current = 0;
    slideAnimation.setValue(0);
    // Сбрасываем состояния разрешений
    setPermissionsStatus({
      camera: 'not-requested',
      notifications: 'not-requested',
      location: 'not-requested',
    });
    setRequestingPermissions(false);
  };

  // Инициализация анимации только при первом показе
  React.useEffect(() => {
    if ((showCustomerSteps || showPerformerSteps) && currentStep === 0) {
      slideAnimation.setValue(0);
      currentStepRef.current = 0;
      targetStepRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCustomerSteps, showPerformerSteps]);

  // PanResponder для свайпов на картинке
  const imageSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // Запоминаем текущее значение анимации
        slideAnimation.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Двигаем картинки в реальном времени
        const currentOffset = -targetStepRef.current * screenWidth;
        let newValue = currentOffset + gestureState.dx;

        // Ограничиваем границы
        const minValue = -2 * screenWidth; // максимум влево (третий экран)
        const maxValue = 0; // максимум вправо (первый экран)

        newValue = Math.max(minValue, Math.min(maxValue, newValue));
        slideAnimation.setValue(newValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipeThreshold = 50;
        const velocityThreshold = 0.3;
        const actualCurrentStep = targetStepRef.current;

        console.log('PanResponder Release:', {
          dx: gestureState.dx,
          vx: gestureState.vx,
          currentStep: actualCurrentStep,
          targetStep: targetStepRef.current,
        });

        // Свайп влево - следующий экран
        if (
          gestureState.dx < -swipeThreshold ||
          gestureState.vx < -velocityThreshold
        ) {
          console.log('Swiping left from step:', actualCurrentStep);
          if (actualCurrentStep < 2) {
            animateToStep(actualCurrentStep + 1);
          } else {
            // Возвращаем на место если на последнем шаге
            animateToStep(actualCurrentStep);
          }
        }
        // Свайп вправо - предыдущий экран
        else if (
          gestureState.dx > swipeThreshold ||
          gestureState.vx > velocityThreshold
        ) {
          console.log('Swiping right from step:', actualCurrentStep);
          if (actualCurrentStep > 0) {
            animateToStep(actualCurrentStep - 1);
          } else {
            // Возвращаем на место если на первом шаге
            animateToStep(actualCurrentStep);
          }
        } else {
          console.log('Return to current position:', actualCurrentStep);
          // Возвращаем на текущую позицию
          animateToStep(actualCurrentStep);
        }
      },
      onPanResponderTerminate: () => {
        animateToStep(targetStepRef.current);
      },
    }),
  ).current;

  // Отдельный PanResponder для индикатора свайпа
  const swipeIndicatorPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Активируем при любом движении на индикаторе
        return Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        agreementTranslateY.setOffset(0);
        agreementTranslateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Анимация движения панели (только вниз)
        if (gestureState.dy > 0) {
          // Ограничиваем движение для лучшего UX
          const translateValue = Math.min(gestureState.dy, 200);
          agreementTranslateY.setValue(translateValue);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Если свайп вниз достаточно длинный - закрываем с анимацией
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Анимация закрытия
          Animated.timing(agreementTranslateY, {
            toValue: 400,
            duration: 300,
            useNativeDriver: false, // Исправлено: false для translateY
          }).start(() => {
            agreementTranslateY.setValue(0);
            goBackToWelcome();
          });
        } else {
          // Возвращаем в исходное положение
          Animated.spring(agreementTranslateY, {
            toValue: 0,
            useNativeDriver: false, // Исправлено: false для translateY
            tension: 100,
            friction: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Возвращаем в исходное положение при прерывании
        Animated.spring(agreementTranslateY, {
          toValue: 0,
          useNativeDriver: false, // Исправлено: false для translateY
        }).start();
      },
    }),
  ).current;

  if (!visible) return null;

  // Рендер единого экрана шагов заказчика
  if (showCustomerSteps) {
    const stepData = [
      {
        title: t('AI Interior Design Generation'),
        description: t(
          'Think up and generate your boldest ideas with artificial intelligence',
        ),
        image: require('../images/onboarding/customer/step1.png'),
        buttonText: t('Next'),
        onPress: () => animateToStep(1),
      },
      {
        title: t('Order Placement on Platform'),
        description: t(
          'Post your order on the platform - we will find the best performers for your tasks',
        ),
        image: require('../images/onboarding/customer/step2.png'),
        buttonText: t('Next'),
        onPress: () => animateToStep(2),
      },
      {
        title: t('Only Verified Performers in Dubai'),
        description: t(
          'All performers have a license to conduct work. We carefully control the process',
        ),
        image: require('../images/onboarding/customer/step3.png'),
        buttonText: t('Next'),
        onPress: completeCustomerOnboarding,
      },
    ];

    const currentStepData = stepData[currentStep];

    return (
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent={true}
        statusBarBackgroundColor="transparent"
        presentationStyle="fullScreen">
        <View style={onboardingStyles.container}>
          {/* Хедер */}
          <View style={onboardingStyles.stepHeader}>
            <View style={onboardingStyles.stepHeaderContent}>
              <TouchableOpacity
                style={onboardingStyles.stepBackButton}
                onPress={goBackToRoleSelection}>
                <View style={onboardingStyles.stepBackButtonInner}>
                  <Ionicons name="arrow-back" size={14} color="#323232" />
                </View>
              </TouchableOpacity>
            </View>
            <View style={onboardingStyles.stepHeaderDivider} />
          </View>

          {/* Контейнер с анимированными изображениями */}
          <View style={onboardingStyles.stepImageFrame}>
            <Animated.View
              style={[
                onboardingStyles.stepImagesContainer,
                {transform: [{translateX: slideAnimation}]},
              ]}
              {...imageSwipeResponder.panHandlers}>
              {stepData.map((step, index) => (
                <View key={index} style={onboardingStyles.stepSlide}>
                  <View style={onboardingStyles.stepBlueContainer}>
                    <View style={onboardingStyles.stepDecorativeElement} />
                    <View style={onboardingStyles.stepImageWrapper}>
                      <Image
                        source={step.image}
                        style={onboardingStyles.stepImage}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* Нижняя панель с контентом */}
          <View style={onboardingStyles.stepBottomPanel}>
            {/* Контент */}
            <View style={onboardingStyles.stepContentContainer}>
              <Text style={onboardingStyles.stepTitleText}>
                {currentStepData.title}
              </Text>
              <Text style={onboardingStyles.stepDescriptionText}>
                {currentStepData.description}
              </Text>
            </View>

            {/* Нижний контейнер с кнопкой и индикаторами */}
            <View style={onboardingStyles.stepBottomContainer}>
              <TouchableOpacity
                style={onboardingStyles.stepPrimaryButton}
                onPress={currentStepData.onPress}>
                <Text style={onboardingStyles.stepPrimaryButtonText}>
                  {currentStepData.buttonText}
                </Text>
              </TouchableOpacity>

              <View style={onboardingStyles.stepIndicatorsContainer}>
                {stepData.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      index === currentStep
                        ? onboardingStyles.stepActiveIndicator
                        : onboardingStyles.stepInactiveIndicator,
                    ]}
                    onPress={() => animateToStep(index)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Рендер единого экрана шагов исполнителя
  if (showPerformerSteps) {
    const stepData = [
      {
        title: t('Are you a builder, designer or cleaning company?'),
        description: t(
          'Describe what you do, how much your service costs and find clients in seconds!',
        ),
        image: require('../images/onboarding/perfomer/step1.png'),
        buttonText: t('Next'),
        onPress: () => animateToStep(1),
      },
      {
        title: t('Increase your rating and get reviews'),
        description: t(
          'This will allow you to be a sought-after specialist in the market and take on large orders',
        ),
        image: require('../images/onboarding/perfomer/step2.png'),
        buttonText: t('Next'),
        onPress: () => animateToStep(2),
      },
      {
        title: t('Service cost calculator setup'),
        description: t(
          'Specify how much your service costs and the platform will automatically calculate the cost of work for the customer',
        ),
        image: require('../images/onboarding/perfomer/step3.png'),
        buttonText: t('Next'),
        onPress: completePerformerOnboarding,
      },
    ];

    const currentStepData = stepData[currentStep];

    return (
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent={true}
        statusBarBackgroundColor="transparent"
        presentationStyle="fullScreen">
        <View style={onboardingStyles.container}>
          {/* Хедер */}
          <View style={onboardingStyles.stepHeader}>
            <View style={onboardingStyles.stepHeaderContent}>
              <TouchableOpacity
                style={onboardingStyles.stepBackButton}
                onPress={goBackToRoleSelection}>
                <View style={onboardingStyles.stepBackButtonInner}>
                  <Ionicons name="arrow-back" size={14} color="#323232" />
                </View>
              </TouchableOpacity>
            </View>
            <View style={onboardingStyles.stepHeaderDivider} />
          </View>

          {/* Контейнер с анимированными изображениями */}
          <View style={onboardingStyles.stepImageFrame}>
            <Animated.View
              style={[
                onboardingStyles.stepImagesContainer,
                {transform: [{translateX: slideAnimation}]},
              ]}
              {...imageSwipeResponder.panHandlers}>
              {stepData.map((step, index) => (
                <View key={index} style={onboardingStyles.stepSlide}>
                  <View style={onboardingStyles.stepBlueContainer}>
                    <View style={onboardingStyles.stepDecorativeElement} />
                    <View style={onboardingStyles.stepImageWrapper}>
                      <Image
                        source={step.image}
                        style={onboardingStyles.stepImage}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* Нижняя панель с контентом */}
          <View style={onboardingStyles.stepBottomPanel}>
            {/* Контент */}
            <View style={onboardingStyles.stepContentContainer}>
              <Text style={onboardingStyles.stepTitleText}>
                {currentStepData.title}
              </Text>
              <Text style={onboardingStyles.stepDescriptionText}>
                {currentStepData.description}
              </Text>
            </View>

            {/* Нижний контейнер с кнопкой и индикаторами */}
            <View style={onboardingStyles.stepBottomContainer}>
              <TouchableOpacity
                style={onboardingStyles.stepPrimaryButton}
                onPress={currentStepData.onPress}>
                <Text style={onboardingStyles.stepPrimaryButtonText}>
                  {currentStepData.buttonText}
                </Text>
              </TouchableOpacity>

              <View style={onboardingStyles.stepIndicatorsContainer}>
                {stepData.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      index === currentStep
                        ? onboardingStyles.stepActiveIndicator
                        : onboardingStyles.stepInactiveIndicator,
                    ]}
                    onPress={() => animateToStep(index)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Рендер экрана доступов
  if (showPermissions) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent={true}
        statusBarBackgroundColor="transparent"
        presentationStyle="fullScreen">
        <View style={onboardingStyles.container}>
          {/* Фоновое изображение на всю страницу */}
          <Image
            source={require('../images/worker.png')}
            style={onboardingStyles.backgroundImage}
            resizeMode="cover"
          />

          {/* Белая нижняя панель с контентом */}
          <View style={onboardingStyles.permissionsPanel}>
            {/* Верхняя часть с контентом и списком */}
            <View style={onboardingStyles.permissionsTopSection}>
              {/* Контент с заголовком и описанием */}
              <View style={onboardingStyles.permissionsContent}>
                <Text style={onboardingStyles.permissionsTitle}>
                  {t('Permissions')}
                </Text>
                <Text style={onboardingStyles.permissionsDescription}>
                  {t('Allow the app to use the following phone functions:')}
                </Text>
              </View>

              {/* Список разрешений */}
              <View style={onboardingStyles.permissionsList}>
                {/* Камера */}
                <View style={onboardingStyles.permissionCard}>
                  <View style={onboardingStyles.permissionIconCircle}>
                    <Ionicons name="camera" size={24} color="#3579F5" />
                  </View>
                  <View style={onboardingStyles.permissionText}>
                    <Text style={onboardingStyles.permissionTitle}>
                      {t('Camera')}
                    </Text>
                    <Text style={onboardingStyles.permissionSubtitle}>
                      {t('For creating and adding photos')}
                    </Text>
                  </View>
                  {permissionsStatus.camera !== 'not-requested' && (
                    <View style={onboardingStyles.permissionStatus}>
                      <Ionicons
                        name={
                          permissionsStatus.camera === 'granted'
                            ? 'checkmark-circle'
                            : 'close-circle'
                        }
                        size={20}
                        color={
                          permissionsStatus.camera === 'granted'
                            ? '#4CAF50'
                            : '#F44336'
                        }
                      />
                    </View>
                  )}
                </View>

                {/* Уведомления */}
                <View style={onboardingStyles.permissionCard}>
                  <View style={onboardingStyles.permissionIconCircle}>
                    <Ionicons name="notifications" size={24} color="#3579F5" />
                  </View>
                  <View style={onboardingStyles.permissionText}>
                    <Text style={onboardingStyles.permissionTitle}>
                      {t('Notifications')}
                    </Text>
                    <Text style={onboardingStyles.permissionSubtitle}>
                      {t('To not miss important things')}
                    </Text>
                  </View>
                  {permissionsStatus.notifications !== 'not-requested' && (
                    <View style={onboardingStyles.permissionStatus}>
                      <Ionicons
                        name={
                          permissionsStatus.notifications === 'granted'
                            ? 'checkmark-circle'
                            : 'close-circle'
                        }
                        size={20}
                        color={
                          permissionsStatus.notifications === 'granted'
                            ? '#4CAF50'
                            : '#F44336'
                        }
                      />
                    </View>
                  )}
                </View>

                {/* Геолокация */}
                <View style={onboardingStyles.permissionCard}>
                  <View style={onboardingStyles.permissionIconCircle}>
                    <Ionicons name="location" size={24} color="#3579F5" />
                  </View>
                  <View style={onboardingStyles.permissionText}>
                    <Text style={onboardingStyles.permissionTitle}>
                      {t('Geolocation')}
                    </Text>
                    <Text style={onboardingStyles.permissionSubtitle}>
                      {t('To show relevant orders')}
                    </Text>
                  </View>
                  {permissionsStatus.location !== 'not-requested' && (
                    <View style={onboardingStyles.permissionStatus}>
                      <Ionicons
                        name={
                          permissionsStatus.location === 'granted'
                            ? 'checkmark-circle'
                            : 'close-circle'
                        }
                        size={20}
                        color={
                          permissionsStatus.location === 'granted'
                            ? '#4CAF50'
                            : '#F44336'
                        }
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Кнопка */}
            <TouchableOpacity
              style={[
                onboardingStyles.permissionsButton,
                requestingPermissions && onboardingStyles.disabledButton,
              ]}
              disabled={requestingPermissions}
              onPress={completePermissions}>
              <Text style={onboardingStyles.permissionsButtonText}>
                {requestingPermissions ? t('Processing...') : t('Allow')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Рендер экрана выбора роли
  if (showRoleSelection) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent={true}
        statusBarBackgroundColor="transparent"
        presentationStyle="fullScreen">
        <View style={onboardingStyles.container}>
          {/* Фоновое изображение на всю страницу */}
          <Image
            source={require('../images/worker.png')}
            style={onboardingStyles.backgroundImage}
            resizeMode="cover"
          />

          {/* Белая нижняя панель с контентом */}
          <View
            style={[
              onboardingStyles.basePanel,
              onboardingStyles.bottomPanel,
              onboardingStyles.bottomPanelRegistration,
            ]}>
            {/* Заголовок с кнопками навигации */}
            <View style={onboardingStyles.roleSelectionHeader}>
              {/* Кнопка назад */}
              <TouchableOpacity
                style={[
                  onboardingStyles.baseBackButton,
                  onboardingStyles.backButtonOnly,
                ]}
                onPress={goBackToWelcome2}>
                <Ionicons name="arrow-back" size={14} color="#323232" />
              </TouchableOpacity>

              {/* Кнопка выбора языка */}
              <TouchableOpacity
                style={onboardingStyles.languageButton}
                onPress={() => {
                  setShowRoleSelection(false);
                  setShowLanguageSelection(true);
                }}>
                <Ionicons
                  name="language"
                  size={20}
                  color={styles.colors.primary}
                />
                <Text style={onboardingStyles.languageButtonText}>
                  {selectedLanguage === 'ar-SA' ? 'العربية' : 'English'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Контейнер для карточек ролей */}
            <View style={onboardingStyles.cardsContainer}>
              {/* Карточка Заказчик */}
              <TouchableOpacity
                style={[
                  onboardingStyles.baseCard,
                  onboardingStyles.roleCard,
                  selectedRole === '1' && onboardingStyles.selectedCard,
                ]}
                onPress={() => selectRole('1')}>
                <View style={onboardingStyles.roleIconContainer}>
                  <Ionicons name="person" size={24} color="#3579F5" />
                </View>
                <View style={onboardingStyles.roleTextContainer}>
                  <Text style={onboardingStyles.roleCardTitle}>
                    {t('I am a customer')}
                  </Text>
                  <Text style={onboardingStyles.roleCardDescription}>
                    {t('I post orders and look for performers for my orders')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Карточка Исполнитель */}
              <TouchableOpacity
                style={[
                  onboardingStyles.baseCard,
                  onboardingStyles.roleCard,
                  selectedRole === '0' && onboardingStyles.selectedCard,
                ]}
                onPress={() => selectRole('0')}>
                <View style={onboardingStyles.roleIconContainer}>
                  <Ionicons name="hammer" size={24} color="#3579F5" />
                </View>
                <View style={onboardingStyles.roleTextContainer}>
                  <Text style={onboardingStyles.roleCardTitle}>
                    {t('I am a performer')}
                  </Text>
                  <Text style={onboardingStyles.roleCardDescription}>
                    {t('I respond to orders and perform them')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Кнопка Далее */}
            <TouchableOpacity
              style={[
                onboardingStyles.baseButton,
                onboardingStyles.primaryButton,
                !selectedRole && onboardingStyles.disabledButton,
                onboardingStyles.continueButtonContainerRegistration,
              ]}
              disabled={!selectedRole}
              onPress={proceedWithRole}>
              <Text
                style={[
                  onboardingStyles.baseButtonText,
                  onboardingStyles.primaryButtonText,
                ]}>
                {t('Next')}
              </Text>
            </TouchableOpacity>

            {/* Уже есть аккаунт? Войти */}
            <View
              style={[
                onboardingStyles.signInLinkContainer,
                onboardingStyles.signInLinkContainerRegistration,
              ]}>
              <Text style={onboardingStyles.regularText}>
                {t('Already have an account?')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  // Переход к экрану авторизации
                  onComplete(); // Закрываем онбординг и переходим к Auth
                }}>
                <Text
                  style={[
                    onboardingStyles.regularText,
                    onboardingStyles.linkText,
                  ]}>
                  {t('Sign in')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Рендер экрана приветствия
  if (showWelcomeScreen) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent={true}
        statusBarBackgroundColor="transparent"
        presentationStyle="fullScreen">
        <View style={onboardingStyles.container}>
          {/* Фоновое изображение на всю страницу */}
          <Image
            source={require('../images/worker.png')}
            style={onboardingStyles.backgroundImage}
            resizeMode="cover"
          />

          {/* Белая нижняя панель с контентом */}
          <View
            style={[
              onboardingStyles.basePanel,
              onboardingStyles.bottomPanel,
              onboardingStyles.welcomePanel,
            ]}>
            {/* Заголовок с кнопкой языка */}
            <View style={onboardingStyles.welcomeHeaderContainer}>
              <Text
                style={[
                  onboardingStyles.baseTitle,
                  onboardingStyles.largeTitle,
                ]}>
                {t('Welcome to')} "Buildify"
              </Text>

              {/* Кнопка выбора языка */}
              <TouchableOpacity
                style={onboardingStyles.languageButton}
                onPress={() => {
                  setShowWelcomeScreen(false);
                  setShowLanguageSelection(true);
                }}>
                <Ionicons
                  name="language"
                  size={20}
                  color={styles.colors.primary}
                />
                <Text style={onboardingStyles.languageButtonText}>
                  {selectedLanguage === 'ar-SA' ? 'العربية' : 'English'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Контент с space-between */}
            <View
              style={[
                onboardingStyles.welcomeContent,
                !isFirstTime && onboardingStyles.welcomeContentNoTerms,
              ]}>
              {/* Чекбокс с соглашением - показываем только для первого входа */}
              {isFirstTime && (
                <View style={onboardingStyles.termsWrapper}>
                  <View style={onboardingStyles.termsContainer}>
                    <TouchableOpacity
                      style={onboardingStyles.checkboxContainer}
                      onPress={() => setAgreedToTerms(!agreedToTerms)}>
                      <View
                        style={[
                          onboardingStyles.checkbox,
                          agreedToTerms && onboardingStyles.checkedBox,
                        ]}>
                        {agreedToTerms && (
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color="#F9F9F9"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={onboardingStyles.termsTextContainer}>
                      <Text style={onboardingStyles.termsText}>
                        {t('I agree to the')}{' '}
                      </Text>
                      <TouchableOpacity onPress={openUserAgreement}>
                        <Text style={onboardingStyles.linkText}>
                          {t('User Agreement')}
                        </Text>
                      </TouchableOpacity>
                      <Text style={onboardingStyles.termsText}>
                        {' '}
                        {t('and')}{' '}
                      </Text>
                      <TouchableOpacity onPress={openPrivacyPolicy}>
                        <Text style={onboardingStyles.linkText}>
                          {t('Privacy Policy')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Нижняя секция с кнопкой и Sign In */}
              <View style={onboardingStyles.welcomeBottomSection}>
                {/* Кнопка Register */}
                <TouchableOpacity
                  style={[
                    onboardingStyles.baseButton,
                    onboardingStyles.primaryButton,
                    !agreedToTerms && onboardingStyles.disabledButton,
                    onboardingStyles.marginBottom24,
                  ]}
                  disabled={!agreedToTerms}
                  onPress={proceedFromWelcomeScreen}>
                  <Text
                    style={[
                      onboardingStyles.baseButtonText,
                      onboardingStyles.primaryButtonText,
                    ]}>
                    {isFirstTime ? t('Register') : t('Continue')}
                  </Text>
                </TouchableOpacity>

                {/* Уже есть аккаунт? Войти */}
                <View
                  style={[
                    onboardingStyles.signInLinkContainer,
                    onboardingStyles.signInLinkContainerWelcome,
                  ]}>
                  <Text style={onboardingStyles.signInRegularText}>
                    {t('Already have an account?')}
                  </Text>
                  <TouchableOpacity
                    style={onboardingStyles.signInButton}
                    onPress={() => {
                      // Переход к экрану авторизации
                      onComplete(); // Закрываем онбординг и переходим к Auth
                    }}>
                    <Text
                      style={[
                        onboardingStyles.regularText,
                        onboardingStyles.linkText,
                      ]}>
                      {t('Sign in')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Оверлей пользовательского соглашения */}
          {showUserAgreement && (
            <Animated.View
              style={[
                onboardingStyles.basePanel,
                onboardingStyles.agreementBottomPanel,
                {
                  transform: [{translateY: agreementTranslateY}],
                },
              ]}>
              {/* Хедер с индикатором и заголовком - обрабатывает свайпы */}
              <View {...swipeIndicatorPanResponder.panHandlers}>
                {/* Индикатор свайпа */}
                <View style={onboardingStyles.swipeIndicator} />

                {/* Заголовок с кнопкой назад */}
                <View style={onboardingStyles.agreementHeader}>
                  <TouchableOpacity
                    style={[
                      onboardingStyles.baseBackButton,
                      onboardingStyles.backButtonInHeader,
                    ]}
                    onPress={goBackToWelcome}>
                    <Ionicons name="arrow-back" size={14} color="#323232" />
                  </TouchableOpacity>
                  <Text style={onboardingStyles.mediumTitle}>
                    {t('User Agreement')}
                  </Text>
                </View>
              </View>

              {/* Текст соглашения - скроллируемый */}
              <ScrollView
                style={onboardingStyles.agreementTextContainer}
                showsVerticalScrollIndicator={false}>
                <Text style={onboardingStyles.agreementText}>
                  Lorem ipsum dolor sit amet consectetur. Tempus sagittis
                  dapibus ut amet. In facilisis eget ornare vulputate turpis
                  consequat donec consequat. Sed imperdiet rhoncus sed eget
                  pharetra ullamcorper tempus. In scelerisque arcu ultrices
                  tortor eget dolor netus in risus.
                  {'\n\n'}
                  Lorem ipsum dolor sit amet consectetur. Tempus sagittis
                  dapibus ut amet. In facilisis eget ornare vulputate turpis
                  consequat donec consequat. Sed imperdiet rhoncus sed eget
                  pharetra ullamcorper tempus. In scelerisque arcu ultrices
                  tortor eget dolor netus in risus.
                  {'\n\n'}
                  Lorem ipsum dolor sit amet consectetur. Tempus sagittis
                  dapibus ut amet. In facilisis eget ornare vulputate turpis
                  consequat donec consequat. Sed imperdiet rhoncus sed eget
                  pharetra ullamcorper tempus. In scelerisque arcu ultrices
                  tortor eget dolor netus in risus.
                </Text>
              </ScrollView>
            </Animated.View>
          )}

          {/* Оверлей политики конфиденциальности */}
          {showPrivacyPolicy && (
            <Animated.View
              style={[
                onboardingStyles.basePanel,
                onboardingStyles.agreementBottomPanel,
                {
                  transform: [{translateY: agreementTranslateY}],
                },
              ]}>
              {/* Хедер с индикатором и заголовком - обрабатывает свайпы */}
              <View {...swipeIndicatorPanResponder.panHandlers}>
                {/* Индикатор свайпа */}
                <View style={onboardingStyles.swipeIndicator} />

                {/* Заголовок с кнопкой назад */}
                <View style={onboardingStyles.agreementHeader}>
                  <TouchableOpacity
                    style={[
                      onboardingStyles.baseBackButton,
                      onboardingStyles.backButtonInHeader,
                    ]}
                    onPress={goBackToWelcome}>
                    <Ionicons name="arrow-back" size={14} color="#323232" />
                  </TouchableOpacity>
                  <Text style={onboardingStyles.mediumTitle}>
                    {t('Privacy Policy')}
                  </Text>
                </View>
              </View>

              {/* Текст политики - скроллируемый */}
              <ScrollView
                style={onboardingStyles.agreementTextContainer}
                showsVerticalScrollIndicator={false}>
                <Text style={onboardingStyles.agreementText}>
                  Lorem ipsum dolor sit amet consectetur. Tempus sagittis
                  dapibus ut amet. In facilisis eget ornare vulputate turpis
                  consequat donec consequat. Sed imperdiet rhoncus sed eget
                  pharetra ullamcorper tempus. In scelerisque arcu ultrices
                  tortor eget dolor netus in risus.
                  {'\n\n'}
                  Lorem ipsum dolor sit amet consectetur. Tempus sagittis
                  dapibus ut amet. In facilisis eget ornare vulputate turpis
                  consequat donec consequat. Sed imperdiet rhoncus sed eget
                  pharetra ullamcorper tempus. In scelerisque arcu ultrices
                  tortor eget dolor netus in risus.
                  {'\n\n'}
                  Lorem ipsum dolor sit amet consectetur. Tempus sagittis
                  dapibus ut amet. In facilisis eget ornare vulputate turpis
                  consequat donec consequat. Sed imperdiet rhoncus sed eget
                  pharetra ullamcorper tempus. In scelerisque arcu ultrices
                  tortor eget dolor netus in risus.
                </Text>
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </Modal>
    );
  }

  // Рендер страницы выбора языка
  if (showLanguageSelection) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent={true}
        statusBarBackgroundColor="transparent"
        presentationStyle="fullScreen">
        <View style={onboardingStyles.container}>
          {/* Фоновое изображение на всю страницу */}
          <Image
            source={require('../images/worker.png')}
            style={onboardingStyles.backgroundImage}
            resizeMode="cover"
          />

          {/* Белая нижняя панель с контентом */}
          <View
            style={[onboardingStyles.basePanel, onboardingStyles.bottomPanel]}>
            {/* Заголовок с кнопками навигации */}
            <View style={onboardingStyles.languageSelectionHeader}>
              {/* Кнопка назад - показываем только если не первый раз */}
              {!isFirstTime ? (
                <TouchableOpacity
                  style={[
                    onboardingStyles.baseBackButton,
                    onboardingStyles.backButtonOnly,
                  ]}
                  onPress={() => {
                    setShowLanguageSelection(false);
                    setShowWelcomeScreen(true);
                  }}>
                  <Ionicons name="arrow-back" size={14} color="#323232" />
                </TouchableOpacity>
              ) : (
                <View style={{width: 28}} />
              )}

              {/* Заголовок */}
              <Text
                style={[
                  onboardingStyles.baseTitle,
                  onboardingStyles.languageTitleCentered,
                ]}>
                {t('Choose language')}
              </Text>

              <View style={{width: 28}} />
            </View>

            {/* Контейнер с выбором языков */}
            <View style={onboardingStyles.languageOptionsContainerFigma}>
              {languageOptions.map(option => {
                const isSelected = selectedLanguage === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      onboardingStyles.baseCard,
                      onboardingStyles.languageOption,
                      isSelected
                        ? onboardingStyles.selectedCard
                        : onboardingStyles.unselectedCard,
                    ]}
                    onPress={() => changeLanguage(option.key)}>
                    {/* Показываем радио-кнопку только для выбранного языка */}
                    {isSelected && (
                      <View style={onboardingStyles.baseRadioButton}>
                        <View
                          style={[
                            onboardingStyles.baseRadioButton,
                            onboardingStyles.radioButtonSelected,
                          ]}>
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color="#FFFFFF"
                          />
                        </View>
                      </View>
                    )}

                    {/* Текст языка */}
                    <Text style={onboardingStyles.languageOptionTextFigma}>
                      {option.value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Кнопка Continue */}
            <TouchableOpacity
              style={[
                onboardingStyles.baseButton,
                onboardingStyles.primaryButton,
              ]}
              onPress={proceedFromLanguageSelection}>
              <Text
                style={[
                  onboardingStyles.baseButtonText,
                  onboardingStyles.primaryButtonText,
                ]}>
                {t('Continue')}
              </Text>
            </TouchableOpacity>

            {/* Уже есть аккаунт? Войти */}
            <View
              style={[
                onboardingStyles.signInLinkContainer,
                onboardingStyles.signInLinkContainerRegistration,
              ]}>
              <Text style={onboardingStyles.regularText}>
                {t('Already have an account?')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  // Переход к экрану авторизации
                  onComplete(); // Закрываем онбординг и переходим к Auth
                }}>
                <Text
                  style={[
                    onboardingStyles.regularText,
                    onboardingStyles.linkText,
                  ]}>
                  {t('Sign in')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Если дошли сюда, значит нет активных экранов
  return null;
};

const onboardingStyles = StyleSheet.create({
  // Базовые стили
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: screenWidth,
    height: '60%',
    resizeMode: 'stretch',
  },

  // Базовые стили для панелей
  basePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  bottomPanel: {
    height: 384,
  },
  bottomPanelRegistration: {
    height: 414,
  },
  agreementBottomPanel: {
    padding: 16,
    height: 552,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: 'rgba(168, 168, 168, 0.39)',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 1,
    shadowRadius: 31.8,
    elevation: 10,
  },

  // Базовые стили для кнопок
  baseButton: {
    borderRadius: 16,
    width: '100%',
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 6.2,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#3579F5',
    borderWidth: 1,
    borderColor: '#AFCCFF',
    shadowColor: 'rgba(26, 74, 163, 0.39)',
  },
  disabledButton: {
    backgroundColor: '#E9ECEF',
    borderColor: '#E9ECEF',
  },
  tryFreeButton: {
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
  },

  // Базовые стили для текста кнопок
  baseButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.006,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  tryFreeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3579F5',
  },
  disabledTryFreeText: {
    color: '#C7C8CA',
  },

  // Базовые стили для заголовков
  baseTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#323232',
    marginBottom: 24,
  },
  largeTitle: {
    fontSize: 24,
    lineHeight: 36,
  },
  mediumTitle: {
    fontSize: 17,
    lineHeight: 17,
    color: '#000000',
    zIndex: 1,
    fontWeight: '500',
    marginLeft: 12,
    top: 2,
  },

  // Базовые стили для текста
  baseText: {
    fontFamily: 'Inter',
    color: '#323232',
  },
  regularText: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '500',
    color: '#8A94A0',
    letterSpacing: -0.006,
  },
  linkText: {
    color: '#323232',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
    color: '#8A94A0',
  },

  // Базовые стили для карточек/опций
  baseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB', // Светло-серый цвет по умолчанию
    width: '100%',
  },
  languageOption: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectedCard: {
    borderColor: '#3579F5',
    paddingVertical: 20,
  },
  unselectedCard: {
    borderColor: '#EBEBEB',
    paddingVertical: 10,
    shadowColor: 'rgba(213, 213, 213, 0.25)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 16.9,
    elevation: 5,
  },
  roleCard: {
    height: 84,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 16,
  },

  // Базовые стили для кнопок назад
  baseBackButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonOnly: {
    alignSelf: 'flex-start',
  },
  backButtonInHeader: {
    position: 'relative',
    zIndex: 2,
    marginBottom: 0,
  },

  // Базовые стили для радиокнопок и чекбоксов
  baseRadioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    backgroundColor: '#3579F5',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#3579F5',
    borderColor: '#3579F5',
  },

  // Специфичные стили (которые не повторяются)
  cardsContainer: {
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  languageOptionsContainerFigma: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  roleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleTextContainer: {
    flex: 1,
    gap: 7,
  },
  roleCardTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '500',
    color: '#323232',
  },
  roleCardDescription: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#8A94A0',
  },
  languageOptionTextFigma: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '500',
    color: '#323232',
    flex: 1,
  },
  signInLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline', // Выравнивание по базовой линии!
    gap: 4,
    width: '100%',
  },
  welcomePanel: {
    // Убираем gap и используем justify-content для Welcome экрана
    paddingBottom: 0, // Убираем отступ снизу, так как SignIn уже имеет marginBottom: 40
  },
  welcomeHeaderContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: styles.colors.background || '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: styles.colors.border || '#E5E5E5',
    gap: 6,
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: styles.colors.primary,
  },
  roleSelectionHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  languageSelectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  languageTitleCentered: {
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 19, // Убираем отступ снизу, так как он в контейнере
  },
  welcomeContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeContentNoTerms: {
    justifyContent: 'flex-end',
  },
  welcomeBottomSection: {
    width: '100%',
    alignItems: 'flex-start',
  },
  signInLinkContainerDefault: {
    marginTop: 110,
    marginBottom: 40,
  },
  signInLinkContainerWelcome: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 40, // Единый отступ 40px для всех Sign in
  },
  signInButton: {},
  signInRegularText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#8A94A0',
    letterSpacing: -0.006,
    includeFontPadding: false, // Убираем лишние отступы шрифта (Android)
  },
  signInLinkText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#323232',
    letterSpacing: -0.006,
    includeFontPadding: false, // Убираем лишние отступы шрифта (Android)
    textDecorationLine: 'underline',
  },
  signInLinkContainerRegistration: {
    marginTop: 24,
    marginBottom: 40,
  },
  termsWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 361,
  },
  checkboxContainer: {
    // Убираем отступы, так как используем gap
  },
  termsTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  continueButtonContainerRegistration: {
    marginTop: 24,
    marginBottom: 0,
  },
  swipeIndicator: {
    width: 46,
    height: 6,
    backgroundColor: '#F1F1F1',
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 16,
  },
  agreementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  agreementTextContainer: {
    width: '100%',
    paddingTop: 8,
  },
  agreementText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#8A94A0',
    width: '100%',
  },

  // Компоновочные стили для комбинирования
  marginBottom24: {marginBottom: 24},
  marginBottom20: {marginBottom: 20},
  marginBottom16: {marginBottom: 16},
  marginBottom12: {marginBottom: 12},

  // Стили для экранов шагов (step screens)
  stepHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 98,
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  stepHeaderContent: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  stepHeaderDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 8,
  },
  stepBackButton: {
    position: 'absolute',
    left: 16,
    top: 4,
  },
  stepBackButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 25,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepImageFrame: {
    position: 'absolute',
    width: screenWidth,
    height: 361,
    left: 0,
    top: 129,
    overflow: 'hidden',
  },
  stepImagesContainer: {
    flexDirection: 'row',
    width: screenWidth * 3, // Ширина для 3 экранов
    height: 361,
  },
  stepSlide: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  stepBlueContainer: {
    width: 361,
    height: 361,
    backgroundColor: '#3579F5',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  stepDecorativeElement: {
    position: 'absolute',
    width: 530,
    height: 260,
    left: -113,
    top: -58,
    borderWidth: 16,
    borderColor: 'rgba(175, 204, 255, 0.45)',
    borderRadius: 0,
    transform: [{rotate: '-23.31deg'}],
  },
  stepImageWrapper: {
    position: 'absolute',
    width: 241,
    height: 325,
    left: (361 - 241) / 2,
    top: 36,
    borderWidth: 16,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  stepImage: {
    width: '100%',
    height: '100%',
  },
  stepBottomPanel: {
    position: 'absolute',
    width: screenWidth,
    height: 350,
    left: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepContentContainer: {
    width: '100%',
  },
  stepBottomContainer: {
    width: '100%',
    gap: 24,
    alignItems: 'center',
  },
  stepTitleText: {
    fontFamily: 'Inter',
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    color: '#323232',
    width: '100%',
    marginBottom: 12,
  },
  stepDescriptionText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#8A94A0',
    width: '100%',
  },

  stepPrimaryButton: {
    width: '100%',
    height: 49,
    backgroundColor: '#3579F5',
    borderWidth: 1,
    borderColor: '#AFCCFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(26, 74, 163, 0.39)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 6.2,
    elevation: 5,
  },
  stepPrimaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.006,
  },
  stepIndicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    width: 28,
    height: 8,
  },
  stepActiveIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#3579F5',
    borderRadius: 4,
  },
  stepInactiveIndicator: {
    width: 6,
    height: 6,
    backgroundColor: '#D9D9D9',
    borderRadius: 3,
  },

  // Стили для экрана разрешений
  permissionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 479,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  permissionsTopSection: {
    width: '100%',
    flexDirection: 'column',
  },
  permissionsContent: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  permissionsTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    color: '#323232',
    width: '100%',
  },
  permissionsDescription: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#8A94A0',
    width: '100%',
  },
  permissionsList: {
    width: '100%',
    gap: 12,
  },
  permissionCard: {
    width: '100%',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: 'rgba(213, 213, 213, 0.25)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 16.9,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    flex: 1,
    gap: 7,
  },
  permissionTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '500',
    color: '#323232',
  },
  permissionSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#8A94A0',
  },
  permissionsButton: {
    width: '100%',
    height: 49,
    backgroundColor: '#3579F5',
    borderWidth: 1,
    borderColor: '#AFCCFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(26, 74, 163, 0.39)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 6.2,
    elevation: 5,
  },
  permissionsButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.006,
  },
  permissionStatus: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default OnboardingModal;
