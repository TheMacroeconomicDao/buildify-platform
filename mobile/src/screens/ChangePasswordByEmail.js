import React from 'react';
import {View, Dimensions, ActivityIndicator, Image} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import StandardButton from '../components/StandardButton';
import StandardInput from '../components/StandardInput';
import CodeInput from '../components/CodeInput';
import HeaderBack from '../headers/HeaderBack';
import {useChangePasswordByEmail} from '../hooks/useChangePasswordByEmail';
import {useTranslation} from 'react-i18next';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';

// Импорт изображения
const checkMarkImage = require('../images/check_mark.png');

function ChangePasswordByEmail({navigation}) {
  const {t} = useTranslation();
  const {
    step,
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit,
    getUserEmail,
  } = useChangePasswordByEmail();

  const {code, new_password, confirmed_password} = formData;

  const getTitle = () => {
    switch (step) {
      case 0:
      case 1:
      case 2:
        return t('Password');
      case 3:
        return '';
      default:
        return t('Password');
    }
  };

  const getButtonText = () => {
    switch (step) {
      case 0:
        return t('Send code');
      case 1:
        return t('Confirm');
      case 2:
        return t('Save password');
      case 3:
        return t('Login');
      default:
        return t('Continue');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        // Шаг 1: Отправка кода
        return (
          <View style={{width: '100%', gap: 20}}>
            <Text style={styles.changePassword.description}>
              {t('For security purposes, we will send you a code to email')}{' '}
              {getUserEmail()}
            </Text>
            <StandardButton
              title={getButtonText()}
              action={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        );

      case 1:
        // Шаг 2: Ввод кода
        return (
          <View style={{width: '100%', gap: 20}}>
            <Text style={styles.changePassword.description}>
              {t('We send code to')} {getUserEmail()}
            </Text>
            <CodeInput
              value={code}
              onChange={val => handleInputChange('code', val)}
              onCodeComplete={() => {}}
              error={errors?.find(e => e.path === 'code')?.message || null}
            />
            <StandardButton
              title={getButtonText()}
              action={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !code}
            />
          </View>
        );

      case 2:
        // Шаг 3: Ввод нового пароля
        return (
          <View style={{width: '100%', gap: 20}}>
            <Text style={styles.changePassword.description}>
              {t('Come up with a new password for your account')}
            </Text>
            <StandardInput
              value={new_password}
              onChange={val => handleInputChange('new_password', val)}
              placeholder={t('New password')}
              size="md"
              width="100%"
              secureTextEntry
              error={
                errors?.find(e => e.path === 'new_password')?.message || null
              }
            />
            <StandardInput
              value={confirmed_password}
              onChange={val => handleInputChange('confirmed_password', val)}
              placeholder={t('Repeat new password')}
              size="md"
              width="100%"
              secureTextEntry
              error={
                errors?.find(e => e.path === 'confirmed_password')?.message ||
                null
              }
            />
            <StandardButton
              title={getButtonText()}
              action={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !new_password || !confirmed_password}
            />
          </View>
        );

      case 3:
        // Шаг 4: Успех
        return (
          <View style={styles.changePassword.successContainer}>
            <View style={{flex: 1, justifyContent: 'center'}}>
              <View style={styles.changePassword.checkmarkContainer}>
                <View style={styles.changePassword.checkmark}>
                  <Image
                    source={checkMarkImage}
                    style={styles.changePassword.checkmarkImage}
                  />
                </View>
              </View>
              <Text style={styles.changePassword.successTitle}>
                {t('New password saved')}
              </Text>
            </View>
            <StandardButton
              title={getButtonText()}
              action={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingScrollView
      contentContainerStyle={{
        minHeight: Dimensions.get('window').height,
        alignItems: 'flex-start',
        backgroundColor: styles.colors.background,
      }}
      style={{
        height: Dimensions.get('window').height,
        backgroundColor: styles.colors.background,
      }}>
      {step !== 3 && (
        <HeaderBack action={() => navigation.goBack()} title={getTitle()} />
      )}

      <View style={styles.changePassword.container}>{renderContent()}</View>
    </KeyboardAvoidingScrollView>
  );
}

export default ChangePasswordByEmail;
