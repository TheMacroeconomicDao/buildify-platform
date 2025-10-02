import React from 'react';
import { TextInput, View } from 'react-native';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
export default SearchInput = ({
  placeholder = '',
  value = '',
  onChange = () => {},
  secureTextEntry = false,
  autoFocus = false,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: styles.colors.inputBackground,
        margin: 5,
        marginHorizontal: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        gap: 10,
      }}>
      <Ionicons
        name={'search'}
        size={styles.fonSize.xl}
        color={styles.colors.placeholderColor}
        style={{
          fontSize: styles.fonSize.lg,
          color: styles.colors.placeholderColor,
        }}
      />
      <TextInput
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChangeText={onChange}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={styles.colors.placeholderColor}
        style={{
          width: '80%',
          fontSize: styles.fonSize.md,
          color: styles.colors.gray,
          fontWeight: '500',
        }}></TextInput>
    </View>
  );
};
