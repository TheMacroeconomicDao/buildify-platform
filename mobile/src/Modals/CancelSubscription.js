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
export default CancelSubscriptionModal = ({
  handleSubmit = () => {},
  hide = () => {},
}) => {
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
        backgroundColor: '#00000066',
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
          {t('Cancel Subscription').toUpperCase()}
        </Text>
        <Text
          style={{
            color: '#777',
            fontSize: styles.fonSize.md,
            fontWeight: '400',
            width: '100%',
            textAlign: 'left',
            marginBottom: 10,
          }}>
          {t('Are you sure you want to cancel your subscription?')}
        </Text>
        <View
          style={{
            width: '100%',
            backgroundColor: '#f8f9fa',
            padding: 15,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: '#ffc107',
            marginBottom: 10,
          }}>
          <Text
            style={{
              color: '#856404',
              fontSize: styles.fonSize.sm,
              fontWeight: '600',
              marginBottom: 5,
            }}>
            {t('Important billing information')}
          </Text>
          <Text
            style={{
              color: '#856404',
              fontSize: styles.fonSize.sm,
              lineHeight: 18,
            }}>
            {t('Cancel subscription billing disclaimer')}
          </Text>
        </View>
        <StandardButton
          style={{
            padding: 5,
            paddingHorizontal: styles.paddingHorizontal,
            backgroundColor: styles.colors.primary,
          }}
          title={t('Cancel')}
          action={hide}
        />
        <StandardButtonOutline title={t('Delete')} action={handleSubmit} />
      </View>
    </TouchableOpacity>
  );
};
