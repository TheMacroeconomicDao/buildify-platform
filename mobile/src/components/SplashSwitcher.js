import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text from '../components/Text';
import styles from '../styles';

export default SplashSwitcher = ({
  value,
  select,
  variants,
  size = 'md',
  width = '100%',
  same = true
}) => {
  if (!(value && select && variants)) {
    return null;
  }
  return (
    <View style={{width: '100%', flexDirection: 'row'}}>
      {variants.map(item => (
        <TouchableOpacity
          key={item.key}
          underlayColor={styles.colors.selectHighlight}
          style={{
            backgroundColor:
              value === item.key
                ? styles.colors.selectHighlight
                : styles.colors.transparent,
            borderBottomWidth: 2,
            borderColor:
              value === item.key
                ? styles.colors.primary
                : styles.colors.placeholderColor,
            borderRadius: styles.borderR,
            padding: styles.padding[size],
            width: same ? '50%' : 'auto',
            alignContent: 'center',
            justifyContent: 'center',
          }}
          onPress={() => select(item.key)}>
          <Text
            style={{
              fontSize: styles.fonSize[size],
              color:
                value === item.key
                  ? styles.colors.primary
                  : styles.colors.placeholderColor,
              textAlign: 'center',
              fontWeight:'500'
            }}>
            {item.value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
