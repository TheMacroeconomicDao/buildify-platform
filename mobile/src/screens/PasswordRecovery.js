import React from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StandardButton from '../components/StandardButton';
import StandardInput from '../components/StandardInput';
import {usePasswordRecovery} from '../hooks/usePasswordRecovery';
import {useTranslation} from 'react-i18next';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import HeaderBack from '../headers/HeaderBack';
import CodeInput from '../components/CodeInput';

function PasswordRecovery({navigation}) {
  const {t} = useTranslation();
  let lang = useTranslation().i18n.language;
  console.log(lang);
  const {step, formData, errors, handleInputChange, handleSubmit} =
    usePasswordRecovery();
  const {email, code, password, confirmed_password} = formData;

  const textByStep = step => {
    switch (step) {
      case 0:
        return t('Send code');
      case 1:
        return t('Save');
      default:
        return '';
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
      <HeaderBack action={() => navigation.pop()} title={t("Password recovery")} />
      <View
        style={{
          flex: 1,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 20,
          padding: 16,
        }}>
        {step == 0 && (
          <Text
            style={{
              color: styles.colors.regular,
              fontSize: styles.fonSize.md,
              fontWeight: '300',
              textAlign: 'left',
              width: '100%',
            }}>
            {t('Input your email address')}
          </Text>
        )}

        {step == 1 && (
          <Text
            style={{
              color: styles.colors.regular,
              fontSize: styles.fonSize.md,
              fontWeight: '300',
              textAlign: 'left',
              width: '100%',
            }}>
            {t('We send code to')}
            <Text
              style={{
                color: styles.colors.black,
                fontSize: styles.fonSize.md,
                fontWeight: '400',
                textAlign: 'left',
                width: '100%',
              }}>
              {' '}
              {formData.email}
            </Text>
          </Text>
        )}

        <View
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}>
          {step === 0 && (
            <View style={{width: '100%'}}>
              <StandardInput
                value={email}
                autoComplete="email"
                onChange={val => handleInputChange('email', val)}
                placeholder={`${t('Email')}`}
                size="md"
                width="100%"
                error={errors?.find(e => e.path === 'email')?.message || null}
              />
            </View>
          )}
          {step === 1 && (
            <View style={{width: '100%', gap: 10}}>
              <CodeInput
                value={code}
                onChange={val => handleInputChange('code', val)}
                onCodeComplete={() => {}}
                error={errors?.find(e => e.path === 'code')?.message || null}
              />
              
              <StandardInput
                value={password}
                onChange={val => handleInputChange('password', val)}
                placeholder={`${t('New password')}`}
                size="md"
                width="100%"
                secureTextEntry
                error={
                  errors?.find(e => e.path === 'password')?.message || null
                }
              />
              <StandardInput
                value={confirmed_password}
                onChange={val => handleInputChange('confirmed_password', val)}
                placeholder={`${t('Confirm password')}`}
                size="md"
                width="100%"
                secureTextEntry
                error={
                  errors?.find(e => e.path === 'confirmed_password')?.message ||
                  null
                }
              />
            </View>
          )}
          <StandardButton
            title={textByStep(step)}
            action={handleSubmit}
            disabled={step === 1 ? !password.length || password !== confirmed_password: !email.length}
            style={{}}
          />
        </View>
      </View>
      <View style={{height: 80}}></View>
    </KeyboardAvoidingScrollView>
  );
}

export default PasswordRecovery;
