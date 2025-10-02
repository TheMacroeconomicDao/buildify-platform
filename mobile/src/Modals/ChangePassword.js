import React from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import Text from '../components/Text';
import StandardButton from '../components/StandardButton';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import {useChangePassword} from '../hooks/useChangePassword';
import {useKeyboardVisible} from '../hooks/useKeyboardVisible';
export default ChangePasswordModal = ({hide = () => {}}) => {
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const {formData, errors, handleInputChange, handleSubmit, status} =
    useChangePassword();
  const {password, new_password, confirmed_password} = formData;
  const isKeyboardVisible = useKeyboardVisible();
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{
        position: 'absolute',
        zIndex: 8,
        width,
        height: '100%',
        backgroundColor: '#00000066',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
      onPress={() => (!isKeyboardVisible ? hide() : Keyboard.dismiss())}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Поведение для iOS и Android
        style={{
          width: '100%',
          maxHeight: '80%',
        }}
     >
        <TouchableOpacity
          style={{
            zIndex: 9,
            width: '100%',
            backgroundColor: '#fff',
            alignItems: 'center',
            padding: styles.paddingHorizontal,
            justifyContent: 'space-around',
            gap: 10,
            paddingVertical: 20,
          }}>
          <Text
            style={{
              color: styles.colors.black,
              fontSize: styles.fonSize.h1,
              fontWeight: '1000',
              width: '100%',
            }}>
            {t('Change password').toUpperCase()}
          </Text>
          <StandardInput
            value={password}
            onChange={val => handleInputChange('password', val)}
            placeholder={` ${t('Old password')}`}
            size="md"
            width="100%"
            secureTextEntry
            error={errors?.find(e => e.path === 'password')?.message || null}
          />
          <StandardInput
            value={new_password}
            onChange={val => handleInputChange('new_password', val)}
            placeholder={` ${t('New password')}`}
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
            placeholder={` ${t('Retype your password')}`}
            size="md"
            width="100%"
            secureTextEntry
            error={
              errors?.find(e => e.path === 'confirmed_password')?.message ||
              null
            }
          />

          <StandardButton
            style={{
              padding: 5,
              paddingHorizontal: styles.paddingHorizontal,
              backgroundColor: styles.colors.primary,
            }}
            title={t('Save')}
            action={handleSubmit}
          />
          <Text
            style={{
              color: styles.colors.gray,
              fontSize: styles.fonSize.sm,
              marginBottom: 5,
            }}>
            {status}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableOpacity>
  );
};
