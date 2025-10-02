import React from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StandardButton from '../components/StandardButton';
import StandardInput from '../components/StandardInput';
import {useRegistration} from '../hooks/useRegistration';
import {useTranslation} from 'react-i18next';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import CodeInput from '../components/CodeInput';
import DatePickerInput from '../components/DatePickerInput';
import PhoneInput from '../components/PhoneInput';
import HeaderBack from '../headers/HeaderBack';
import LicenseFileUpload from '../components/LicenseFileUpload';

function Registration({navigation, route}) {
  // Проверяем, пришёл ли пользователь из онбординга и получаем выбранную роль
  const fromOnboarding = route?.params?.fromOnboarding || false;
  const selectedRole = route?.params?.selectedRole || null;

  const {
    step,
    formData,
    errors,
    setStep,
    handleInputChange,
    handleSubmit,
    loading,
    licenseFile,
    handleLicenseFileSelect,
    workDirections,
    workTypes,
    workTypesLoading,
    selectedDirections,
    toggleWorkDirection,
    toggleWorkType,
  } = useRegistration(selectedRole);
  const {
    email,
    name,
    birthDate,
    password,
    confirmed_password,
    code,
    phone,
    license,
    type,
    work_types,
    promo_code,
  } = formData;
  const {t} = useTranslation();

  const titleByStep = step => {
    switch (step) {
      case 1:
        return t('Sign up as customer');
      case 2:
        return t('Sign up as worker');
      case 3:
        return t('Confirmation code');
      default:
        return t('Sign up');
    }
  };

  const backByStep = () => {
    switch (step) {
      case 1:
      case 2:
        // Возвращаемся к онбордингу если пришли оттуда, иначе закрываем экран
        return fromOnboarding
          ? navigation.replace('Loading')
          : navigation.pop();
      case 3:
        return setStep(type === '0' ? 2 : 1);
      default:
        return navigation.pop();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="height"
      style={{
        height: Dimensions.get('window').height,
        alignItems: 'center',
        backgroundColor: styles.colors.background,
        flex: 1,
      }}>
      <HeaderBack action={() => backByStep()} title={titleByStep(step)} />

      <ScrollView
        style={{flex: 1, width: '100%'}}
        contentContainerStyle={{
          width: '100%',
          alignItems: 'center',
          paddingHorizontal: '5%',
          paddingBottom: 50,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {(step === 1 || step === 2) && (
            <View style={{width: '100%', gap: 12}}>
              <StandardInput
                value={name}
                mode="name"
                autoComplete="name"
                onChange={val => handleInputChange('name', val)}
                placeholder={
                  type === '0' ? `${t('Company name')}` : `${t('Name')}`
                }
                size="md"
                width="100%"
                error={errors?.find(e => e.path === 'name')?.message || null}
              />
              {type === '1' && (
                <DatePickerInput
                  value={birthDate}
                  onChange={val => handleInputChange('birthDate', val)}
                  placeholder={`${t('Birth date')}`}
                  size="md"
                  width="100%"
                  error={
                    errors?.find(e => e.path === 'birthDate')?.message || null
                  }
                />
              )}
              <PhoneInput
                value={phone}
                onChange={val => handleInputChange('phone', val)}
                placeholder={`${t('Phone number')}`}
                size="md"
                width="100%"
                error={errors?.find(e => e.path === 'phone')?.message || null}
              />
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
              {type == '0' && (
                <StandardInput
                  value={promo_code || ''}
                  onChange={val =>
                    handleInputChange('promo_code', val.toUpperCase())
                  }
                  placeholder={`${t('Referral code')} (${t('optional')})`}
                  size="md"
                  width="100%"
                  autoCapitalize="characters"
                  maxLength={20}
                  error={
                    errors?.find(e => e.path === 'promo_code')?.message || null
                  }
                  help={t(
                    'If you have a referral code from another executor, enter it here',
                  )}
                />
              )}
              {type == '0' && (
                <>
                  <View style={{width: '100%', marginTop: 8}}>
                    <Text
                      style={{
                        color: styles.colors.black,
                        fontSize: 14,
                        fontWeight: '500',
                        marginBottom: 8,
                      }}>
                      {t('Select work categories')} *
                    </Text>
                    {errors?.find(e => e.path === 'work_types')?.message && (
                      <Text
                        style={{
                          color: styles.colors.danger,
                          fontSize: 12,
                          marginBottom: 8,
                        }}>
                        {errors.find(e => e.path === 'work_types').message}
                      </Text>
                    )}
                    {workTypesLoading ? (
                      <Text
                        style={{
                          color: styles.colors.regular,
                          fontSize: 12,
                          textAlign: 'center',
                          paddingVertical: 20,
                        }}>
                        {t('Loading work categories...')}
                      </Text>
                    ) : (
                      <ScrollView
                        style={{
                          maxHeight: 200,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: styles.colors.grayLight,
                          borderRadius: 8,
                          backgroundColor: styles.colors.background,
                        }}
                        contentContainerStyle={{
                          padding: 8,
                        }}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}>
                        {/* Work Directions */}
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: styles.colors.black,
                            marginBottom: 8,
                          }}>
                          {t('Work Directions')}:
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 16,
                          }}>
                          {workDirections.map(direction => (
                            <TouchableOpacity
                              key={direction.key}
                              style={{
                                backgroundColor: selectedDirections.includes(
                                  direction.key,
                                )
                                  ? styles.colors.primaryLight
                                  : styles.colors.background,
                                borderWidth: 1,
                                borderColor: selectedDirections.includes(
                                  direction.key,
                                )
                                  ? styles.colors.primary
                                  : styles.colors.grayLight,
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                              }}
                              onPress={() =>
                                toggleWorkDirection(direction.key)
                              }>
                              <Text
                                style={{
                                  color: selectedDirections.includes(
                                    direction.key,
                                  )
                                    ? styles.colors.primary
                                    : styles.colors.regular,
                                  fontSize: 12,
                                  fontWeight: '500',
                                }}>
                                {direction.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Work Types for selected directions */}
                        {selectedDirections.length > 0 && (
                          <>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: styles.colors.black,
                                marginBottom: 8,
                              }}>
                              {t('Work Types')}:
                            </Text>
                            {selectedDirections.map(directionKey => {
                              const direction = workDirections.find(
                                d => d.key === directionKey,
                              );
                              const directionTypes =
                                workTypes[directionKey] || [];

                              if (directionTypes.length === 0) return null;

                              return (
                                <View
                                  key={directionKey}
                                  style={{marginBottom: 12}}>
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight: '500',
                                      color: styles.colors.regular,
                                      marginBottom: 6,
                                    }}>
                                    {direction?.name}:
                                  </Text>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      flexWrap: 'wrap',
                                      gap: 6,
                                      marginLeft: 8,
                                    }}>
                                    {directionTypes.map(workType => (
                                      <TouchableOpacity
                                        key={workType.key}
                                        style={{
                                          backgroundColor: work_types.includes(
                                            workType.key,
                                          )
                                            ? styles.colors.primaryLight
                                            : '#f8f9fa',
                                          borderWidth: 1,
                                          borderColor: work_types.includes(
                                            workType.key,
                                          )
                                            ? styles.colors.primary
                                            : '#e9ecef',
                                          borderRadius: 12,
                                          paddingVertical: 6,
                                          paddingHorizontal: 10,
                                        }}
                                        onPress={() =>
                                          toggleWorkType(workType.key)
                                        }>
                                        <Text
                                          style={{
                                            color: work_types.includes(
                                              workType.key,
                                            )
                                              ? styles.colors.primary
                                              : styles.colors.regular,
                                            fontSize: 11,
                                            fontWeight: '500',
                                          }}>
                                          {workType.name}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              );
                            })}
                          </>
                        )}
                      </ScrollView>
                    )}
                  </View>
                  <LicenseFileUpload
                    onFileSelect={handleLicenseFileSelect}
                    selectedFile={licenseFile}
                    error={
                      errors?.find(e => e.path === 'license')?.message || null
                    }
                  />
                </>
              )}
              <StandardButton
                title={t('Send code')}
                action={handleSubmit}
                style={{padding: 5}}
                disabled={
                  !email.length ||
                  !name.length ||
                  !phone.length ||
                  !password.length ||
                  (type === '1' && !birthDate.length) ||
                  (type === '0' && work_types.length === 0)
                }
                loading={loading}
              />
            </View>
          )}
          {step == 3 && (
            <View style={{width: '100%', gap: 20}}>
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

              <CodeInput
                value={code}
                onChange={val => handleInputChange('code', val)}
                onCodeComplete={() => {}}
                error={errors?.find(e => e.path === 'code')?.message || null}
              />
              <StandardButton
                title={t('Complete registration')}
                action={handleSubmit}
                style={{padding: 5}}
                disabled={!email.length || !password.length}
                loading={loading}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default Registration;
