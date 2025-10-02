import React, {useState, useEffect} from 'react';
import {View, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-community/async-storage';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import RadioSelect from '../components/RadioSelect';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {api, retryApiCall} from '../services/index';

export default function Language({navigation}) {
  const {t, i18n} = useTranslation();
  const dispatch = useDispatch();
  const userData = useSelector(state => state.auth.userData);

  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [isLoading, setIsLoading] = useState(false);

  // Опции языков: только английский и арабский (как в онбординге)
  const languageOptions = [
    {key: 'en-US', value: 'English'},
    {key: 'ar-SA', value: 'العربية'},
  ];

  // Инициализация выбранного языка
  useEffect(() => {
    const currentLanguage = userData?.localization || i18n.language || 'en-US';
    setSelectedLanguage(currentLanguage);
  }, [userData, i18n.language]);

  // Принудительная перерендеризация при смене языка
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [i18n.language]);

  // Функция для изменения языка
  const changeLanguage = async languageCode => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Изменяем язык в i18n
      await i18n.changeLanguage(languageCode);

      // Сохраняем в AsyncStorage
      await AsyncStorage.setItem('language', languageCode);

      // Обновляем выбранный язык в состоянии
      setSelectedLanguage(languageCode);

      // Отправляем на сервер (если пользователь залогинен)
      if (userData) {
        await retryApiCall(() =>
          api.user.apiUserSettingsUpdateCorrect({
            localization: languageCode,
          }),
        );

        // Обновляем userData в Redux
        dispatch({
          type: 'SET_USERDATA',
          payload: {localization: languageCode},
        });
      }
    } catch (error) {
      console.error('Ошибка при смене языка:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={localStyles.container}>
      <HeaderBack title={t('Language')} action={() => navigation.goBack()} />

      <ScrollView
        style={localStyles.content}
        showsVerticalScrollIndicator={false}>
        <View style={localStyles.languageContainer}>
          <Text style={localStyles.title}>{t('Choose your language')}</Text>

          <Text style={localStyles.subtitle}>
            {t('Select the language you want to use in the app')}
          </Text>

          <View style={localStyles.optionsContainer}>
            {languageOptions.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  localStyles.languageOption,
                  selectedLanguage === item.key && localStyles.selectedOption,
                ]}
                onPress={() => changeLanguage(item.key)}
                disabled={isLoading}>
                <Text
                  style={[
                    localStyles.languageText,
                    selectedLanguage === item.key && localStyles.selectedText,
                  ]}>
                  {item.value}
                </Text>

                {selectedLanguage === item.key && (
                  <Ionicons
                    name="checkmark"
                    size={22}
                    color={styles.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  content: {
    flex: 1,
  },
  languageContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: styles.colors.black,
    textAlign: 'left',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: styles.colors.regular,
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    borderColor: styles.colors.primary,
    backgroundColor: '#F8FBFF',
  },
  languageText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#222222',
  },
  selectedText: {
    color: styles.colors.primary,
  },
});
