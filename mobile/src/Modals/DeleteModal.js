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
import {deleteAccount} from '../actions/auth';
import {api, retryApiCall} from '../services/index';

export default DeleteModal = ({handleSubmit = () => {}, hide = () => {}}) => {
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
            fontSize: styles.fonSize.h1,
            fontWeight: '1000',
            width: '100%',
          }}>
          {t('Delete account').toUpperCase()}
        </Text>
        <Text
          style={{
            color: '#777',
            fontSize: styles.fonSize.md,
            fontWeight: '400',
            width: '100%',
            textAlign: 'left',
            lineHeight: 22,
          }}>
          {t(
            'Are you sure you want to delete your account?\n\nYour training progress will be lost and your subscription money will not be refunded.',
          )}
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
          title={t('Delete')}
          action={() => {
            retryApiCall(() => api.user.apiUserDelete({})).then(res => {
              console.log(res);
              dispatch(deleteAccount());
            });
          }}
        />
      </View>
    </TouchableOpacity>
  );
};
