import React from 'react';
import {
  ScrollView, TouchableOpacity
} from 'react-native';
import Text from './Text';
import styles from '../styles';

export default ScrollSelect = ({
  selected = '',
  handleSelect = () => {},
  variants = [],
  default_value = {key: '', name: 'All'},
}) => {
  const list = [default_value, ...variants];
  return (
    <ScrollView
      horizontal
      contentContainerStyle={{
        minWidth:'100%',
        flexDirection: 'row',
        gap: 8,
      }}>
      {list.map(item => (
        <TouchableOpacity
          key={item.key}
          style={{
            backgroundColor:
              item.key === selected
                ? styles.colors.primary
                : styles.colors.selectHighlight,
            borderRadius: styles.borderR,
            paddingHorizontal: 10,
            paddingVertical:3,
          }}
          onPress={() => handleSelect(item.key)}>
          <Text
            style={{
              fontSize: styles.fonSize.smd,
              color:
                selected === item.key
                  ? styles.colors.white
                  : styles.colors.gray,
              fontWeight: '400',
            }}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
