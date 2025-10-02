import React from 'react';
import {View, TouchableOpacity, Dimensions} from 'react-native';
import {useDispatch} from 'react-redux';
import Text from '../components/Text';
import StandardButton from '../components/StandardButton';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
export default ErrorsModal = ({errors = [], action = () => {}}) => {
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const dispatch = useDispatch();
  const {t} = useTranslation();
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{
        position: 'absolute',
        zIndex: 9,
        width,
        height,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
      onPress={() => dispatch({type: 'HIDE_MODAL'})}>
      <View
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '80%',
          backgroundColor: '#fff',
          alignItems: 'center',
          borderRadius: 16,
          padding: 20,
          justifyContent: 'space-around',
          gap: 12,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 12},
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 16,
        }}>
        <Text
          style={{
            color: styles.colors.black,
            fontSize: styles.fonSize.h1,
            fontWeight: '600',
            textAlign: 'center',
          }}>
          {t('Error')}
        </Text>
        {errors.map((item, index) => (
          <Text
            style={{
              color: styles.colors.black,
              fontSize: styles.fonSize.md,
              fontWeight: '500',
              width: '100%',
              lineHeight: 22,
            }}
            key={index}>
            {item.url}
            {' - '}
            <Text
              style={{
                color: styles.colors.red,
                fontSize: styles.fonSize.md,
                fontWeight: '500',
              }}>
              {item.message}
            </Text>
          </Text>
        ))}
        <StandardButton
          style={{
            padding: 10,
            paddingHorizontal: 16,
            backgroundColor: styles.colors.red,
            borderRadius: 12,
          }}
          title={t('Reload page')}
          action={action}
        />
      </View>
    </TouchableOpacity>
  );
};
