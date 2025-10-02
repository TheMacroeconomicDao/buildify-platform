import {useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import {useSelector} from 'react-redux';

const ONBOARDING_KEY = 'onboarding_completed';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useSelector(state => state.auth);
  const userType = auth?.userData?.type || '0';

  // Проверяем, нужно ли показывать онбординг
  const checkOnboardingStatus = useCallback(async () => {
    try {
      console.log('useOnboarding: Checking onboarding status', {
        logged: auth.logged,
        userId: auth.userData?.id,
        userData: auth.userData,
      });

      if (!auth.logged) {
        console.log(
          'useOnboarding: User not logged in, not showing onboarding',
        );
        setIsLoading(false);
        return;
      }

      const userId = auth.userData?.id;
      if (!userId) {
        console.log('useOnboarding: No user ID, not showing onboarding');
        setIsLoading(false);
        return;
      }

      // Проверяем персональный онбординг для пользователя
      const onboardingKey = `${ONBOARDING_KEY}_${userId}`;
      const completed = await AsyncStorage.getItem(onboardingKey);
      console.log('useOnboarding: Onboarding check result', {
        onboardingKey,
        completed,
        willShowOnboarding: !completed,
      });

      if (!completed) {
        console.log('useOnboarding: Showing onboarding for user', userId);
        setShowOnboarding(true);
      } else {
        console.log(
          'useOnboarding: Onboarding already completed for user',
          userId,
        );
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [auth.logged, auth.userData?.id]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const completeOnboarding = async () => {
    try {
      // Сохраняем состояние завершения онбординга для конкретного пользователя
      const userId = auth.userData?.id;
      if (userId) {
        const onboardingKey = `${ONBOARDING_KEY}_${userId}`;
        await AsyncStorage.setItem(onboardingKey, 'true');
      }
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      setShowOnboarding(false);
    }
  };

  // Функция для сброса онбординга (для тестирования)
  const resetOnboarding = async () => {
    try {
      const userId = auth.userData?.id;
      if (userId) {
        const onboardingKey = `${ONBOARDING_KEY}_${userId}`;
        await AsyncStorage.removeItem(onboardingKey);
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return {
    showOnboarding,
    isLoading,
    userType,
    completeOnboarding,
    resetOnboarding,
  };
};

export default useOnboarding;
