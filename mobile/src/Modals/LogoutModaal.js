import React from 'react';
import {View, TouchableOpacity, Dimensions, Keyboard} from 'react-native';
import {useDispatch} from 'react-redux';
import Text from '../components/Text';
import StandardButton from '../components/StandardButton';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import {useChangePassword} from '../hooks/useChangePassword';
import {useKeyboardVisible} from '../hooks/useKeyboardVisible';
import StandardButtonOutline from '../components/StandardButtonOutline';
import {logout} from '../actions/auth';
export default LogoutModal = ({handleSubmit = () => {}, hide = () => {}}) => {
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const isKeyboardVisible = useKeyboardVisible();
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{
        position: 'absolute',
        zIndex: 9,
        width,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
      onPress={() => (!isKeyboardVisible ? hide() : Keyboard.dismiss())}>
      <View
        style={{
          width: '100%',
          maxHeight: '60%',
          backgroundColor: '#fff',
          alignItems: 'center',
          paddingHorizontal: 16,
          justifyContent: 'space-around',
          gap: 12,
          paddingVertical: 20,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -6},
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 20,
        }}>
        <Text
          style={{
            color: styles.colors.black,
            fontSize: styles.fonSize.h2,
            fontWeight: '600',
            width: '100%',
            lineHeight: 30,
          }}>
          {t('Log out').toUpperCase()}?
        </Text>

        <StandardButton
          style={{
            padding: 10,
            paddingHorizontal: 16,
            backgroundColor: styles.colors.primary,
            borderRadius: 12,
          }}
          title={t('Cancel')}
          action={hide}
        />
        <StandardButtonOutline
          title={t('Log out')}
          action={() => dispatch(logout())}
        />
      </View>
    </TouchableOpacity>
  );
};
