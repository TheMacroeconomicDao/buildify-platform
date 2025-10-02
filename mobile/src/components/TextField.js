import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import styles from '../styles';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default TextField = ({
  width = '100%',
  placeholder = '',
  value = '',
  size = 'md',
  style = {},
  error = null,
}) => {
  // Используем ту же функцию определения цвета границы, но без состояния фокуса
  const getBorderColor = () => {
    if (error) return styles.colors.red;
    return styles.colors.border;
  };

  return (
    <View style={{width}}>
      <Text
        style={{
          position: 'absolute',
          top: -10,
          zIndex: 3,
          left: 12,
          paddingHorizontal: value.length > 0 ? 3 : 0,
          backgroundColor: styles.colors.white,
          fontSize: styles.fonSize.sm, // Исправил опечатку fonSize -> fontSize
          color: '#8a94a0',
        }}>
        {placeholder}
      </Text>

      <View
        style={{
          borderWidth: 1,
          padding: 10,
          minHeight: 50,
          maxHeight: 500,
          borderColor: getBorderColor(),
          borderRadius: 16,
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text
          numberOfLines={20}
          style={{
            fontSize: 14,
            width: '95%',
            alignContent: 'center',
            justifyContent: 'center',
            color: styles.colors.input,
            ...style,
          }}>
          {value}
        </Text>
      </View>

      {error && (
        <Text
          style={{
            fontSize: styles.fonSize.smd, // Исправил опечатку fonSize -> fontSize
            color: styles.colors.red,
            paddingTop: 5,
          }}>
          {error}
        </Text>
      )}
    </View>
  );
};
