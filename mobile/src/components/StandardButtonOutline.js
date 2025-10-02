import React from 'react';
import {TouchableHighlight} from 'react-native';
import Text from './Text';
import styles from '../styles';

export default StandardButtonOutline = ({
  title = '',
  size = 'md',
  action = () => {},
  disabled = false,
  style = {},
  textStyle = {},
  color = styles.colors.black,
}) => {
  return (
    <TouchableHighlight
      underlayColor={styles.colors.highlight}
      style={{
        backgroundColor: disabled
          ? styles.colors.grayLight
          : styles.colors.white,
        borderRadius: 16,
        width: '100%',
        alignContent: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        paddingHorizontal: 30,
        borderWidth: 1.5,
        borderColor: color,
        ...style,
      }}
      onPress={() => !disabled && action()}>
      <Text
        style={{
          fontSize: styles.fonSize[size],
          color: color,
          fontWeight: '600',
          textAlign: 'center',
          ...textStyle,
        }}>
        {title}
      </Text>
    </TouchableHighlight>
  );
};
