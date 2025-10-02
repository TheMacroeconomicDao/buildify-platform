import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './en.json'; // English (United States)
import ar from './ar.json'; // Arabic
import {Platform, NativeModules} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

// Function to get saved language from AsyncStorage
const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    return savedLanguage || null; // Return saved language or null if none
  } catch (error) {
    console.error('Error getting language from AsyncStorage:', error);
    return null;
  }
};

// Function to initialize i18next
const initializeI18n = async () => {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0]
      : NativeModules.I18nManager.localeIdentifier;

  // Get saved language
  const savedLanguage = await getSavedLanguage();

  if (!savedLanguage) {
    AsyncStorage.setItem('language', 'en-US');
  }

  // Determine language for initialization
  const lng = savedLanguage || 'en-US';

  const resources = {
    'en-US': en, // English (United States)
    'ar-SA': ar, // Arabic (Saudi Arabia)
  };

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    resources,
    lng: lng, // Use saved language, device language, or English by default
    fallbackLng: 'en-US', // Default language if selected language is unavailable
    interpolation: {
      escapeValue: false, // Don't escape HTML tags in translations
    },
  });
};

initializeI18n();

export default {i18n};
