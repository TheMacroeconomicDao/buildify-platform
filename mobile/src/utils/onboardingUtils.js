import AsyncStorage from '@react-native-community/async-storage';

/**
 * Функция для очистки всех данных онбординга
 * Используется при выходе из аккаунта и удалении аккаунта
 */
export const clearOnboardingData = async () => {
  try {
    console.log('OnboardingUtils: Starting onboarding data cleanup...');

    // Получаем все ключи перед очисткой
    const allKeysBefore = await AsyncStorage.getAllKeys();
    const onboardingKeysBefore = allKeysBefore.filter(
      key => key.includes('onboarding') || key.includes('Onboarding'),
    );

    console.log(
      'OnboardingUtils: Found onboarding keys before cleanup:',
      onboardingKeysBefore,
    );

    // Очищаем основные ключи онбординга
    await AsyncStorage.removeItem('onboarding_completed');
    await AsyncStorage.removeItem('hasCompletedOnboarding');

    // Очищаем персональные ключи онбординга для всех пользователей
    const personalOnboardingKeys = allKeysBefore.filter(key =>
      key.startsWith('onboarding_completed_'),
    );

    if (personalOnboardingKeys.length > 0) {
      await AsyncStorage.multiRemove(personalOnboardingKeys);
      console.log(
        'OnboardingUtils: Removed personal onboarding keys:',
        personalOnboardingKeys,
      );
    }

    // Проверяем результат очистки
    const allKeysAfter = await AsyncStorage.getAllKeys();
    const onboardingKeysAfter = allKeysAfter.filter(
      key => key.includes('onboarding') || key.includes('Onboarding'),
    );

    console.log(
      'OnboardingUtils: Remaining onboarding keys after cleanup:',
      onboardingKeysAfter,
    );

    if (onboardingKeysAfter.length === 0) {
      console.log(
        '✅ OnboardingUtils: All onboarding data cleared successfully',
      );
    } else {
      console.warn(
        '⚠️ OnboardingUtils: Some onboarding keys remain:',
        onboardingKeysAfter,
      );
    }

    return true;
  } catch (error) {
    console.error('❌ OnboardingUtils: Error clearing onboarding data:', error);
    return false;
  }
};
