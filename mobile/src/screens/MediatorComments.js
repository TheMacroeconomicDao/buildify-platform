import React from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import HeaderBack from '../headers/HeaderBack';
import MediatorCommentsChat from '../components/MediatorCommentsChat';
import styles from '../styles';

export default function MediatorComments({navigation, route}) {
  const {t} = useTranslation();
  const {orderId, currentStep, orderTitle} = route.params;

  return (
    <View style={{flex: 1, backgroundColor: styles.colors.background}}>
      <HeaderBack
        title={`${t('Comments')} - ${
          orderTitle || `${t('Order')} #${orderId}`
        }`}
        action={() => navigation.goBack()}
      />

      <MediatorCommentsChat
        orderId={orderId}
        currentStep={currentStep}
        onCommentAdded={comment => {
          console.log('New comment added:', comment);
        }}
      />
    </View>
  );
}
