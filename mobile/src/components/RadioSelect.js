import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text from './Text';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Fontisto';

export default RadioSelect = ({
  value,
  select,
  variants,
  size = 'md',
  width = '100%',
}) => {
  return (
    <View style={{width, flexDirection: 'row', justifyContent:'space-between', paddingRight:3}}>
      {variants.map(item => (
        <TouchableOpacity
          key={item.key}
          underlayColor={styles.colors.selectHighlight}
          style={{
            flexDirection: 'row',
            backgroundColor: styles.colors.transparent,
            padding: styles.padding[size],
            width: 'auto',
            alignContent: 'center',
            alignItems:'center',
            justifyContent: 'center',
            gap:2
          }}
          onPress={() => select(item.key)}>
          <Ionicons
            name={
              value === item.key
                ? 'radio-btn-active'
                : 'radio-btn-passive'
            }
            size={15}
            color={value === item.key
              ? styles.colors.primary
              : styles.colors.input}
          />
          <Text
            style={{
              fontSize: styles.fonSize[size],
              color:styles.colors.input,
              textAlign: 'center',
              fontWeight: '500',
            }}>
            {item.value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
