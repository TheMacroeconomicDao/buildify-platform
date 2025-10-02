import React from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import StandardButton from '../components/StandardButton';
import StandardInput from '../components/StandardInput';
import {useAuth} from '../hooks/useAuth';
import {useTranslation} from 'react-i18next';
import HeaderBack from '../headers/HeaderBack';

function Auth({navigation, route}) {
  // Проверяем, пришёл ли пользователь из онбординга
  const fromOnboarding = route?.params?.fromOnboarding || false;

  const {formData, errors, handleInputChange, handleSubmit, loading} =
    useAuth();
  const {email, password} = formData;
  const {t} = useTranslation();

  return (
    <KeyboardAvoidingView
      behavior="height"
      style={{
        height: Dimensions.get('window').height,
        alignItems: 'center',
        backgroundColor: styles.colors.background,
      }}>
      <HeaderBack
        no_back={!fromOnboarding}
        title={t('Sign in')}
        action={() => fromOnboarding && navigation.replace('Loading')}
      />
      <View
        style={{
          flex: 1,
          width: '90%',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: 20,
        }}>
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={{width: '100%', gap: 15}}>
            <StandardInput
              value={email}
              mode="email"
              autoComplete="email"
              onChange={val => handleInputChange('email', val)}
              placeholder={`${t('Email')}`}
              size="md"
              width="100%"
              error={errors?.find(e => e.path === 'email')?.message || null}
            />
            <StandardInput
              value={password}
              onChange={val => handleInputChange('password', val)}
              placeholder={`${t('Password')}`}
              size="md"
              width="100%"
              secureTextEntry
              error={errors?.find(e => e.path === 'password')?.message || null}
            />
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}>
              <TouchableOpacity
                onPress={() => navigation.push('PasswordRecovery')}>
                <Text
                  style={{
                    color: styles.colors.actionGray,
                    fontSize: styles.fonSize.sm,
                  }}>
                  {t('Forgot password?')}
                </Text>
              </TouchableOpacity>
            </View>

            <StandardButton
              title={t('Sign in')}
              action={handleSubmit}
              style={{padding: 5}}
              disabled={!email.length || !password.length}
              loading={loading}
            />

            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
                gap: 5,
              }}>
              <Text
                style={{
                  color: styles.colors.actionGray,
                  fontSize: styles.fonSize.sm,
                }}>
                {t("Don't have an account?")}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Loading', {showOnboarding: true})
                }>
                <Text
                  style={{
                    color: styles.colors.primary,
                    fontSize: styles.fonSize.sm,
                    fontWeight: '600',
                  }}>
                  {t('Sign up')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default Auth;
