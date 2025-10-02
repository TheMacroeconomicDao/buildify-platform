import React, {useState, useRef} from 'react';
import {
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import styles from '../styles';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TextField from './TextField';

const StandardInput = ({
  width = '100%',
  placeholder = '',
  label = '',
  value = '',
  onChange = () => {},
  secureTextEntry = false,
  size = 'md',
  autoFocus = false,
  style = {},
  mode = 'text',
  error = null,
  disabled = false,
  hideLabel = false,
  hideValidationIcon = false,
  onPress = null,
  editable = true,
}) => {
  const [is_secure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  // Функция определения цвета границы
  const getBorderColor = () => {
    if (error) return styles.colors.red;
    if (isFocused) return styles.colors.primary;
    return styles.colors.border;
  };

  if (disabled) {
    return (
      <TextField
        placeholder={placeholder}
        value={value}
        size={size}
        width={width}
        style={style}
      />
    );
  }

  const inputContent = (
    <View style={[inputStyles.container, {width}]}>
      {!hideLabel && (value.length > 0 || isFocused) && (
        <Text
          style={[
            inputStyles.placeholderLabel,
            (value.length > 0 || isFocused) && inputStyles.activePlaceholder,
          ]}>
          {label || placeholder}
        </Text>
      )}

      <View
        style={[inputStyles.inputContainer, {borderColor: getBorderColor()}]}>
        <TextInput
          inputMode={mode}
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChangeText={onChange}
          secureTextEntry={is_secure}
          placeholderTextColor={'#8a94A0'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[inputStyles.input, style]}
          editable={editable && !onPress}
        />
        {!hideValidationIcon &&
          !secureTextEntry &&
          value.length > 0 &&
          !error && (
            <Ionicons style={inputStyles.checkmarkIcon} name={'checkmark'} />
          )}
        {secureTextEntry && value.length > 0 && (
          <TouchableOpacity onPress={() => setIsSecure(!is_secure)}>
            <Ionicons
              style={inputStyles.eyeIcon}
              name={is_secure ? 'eye-off-outline' : 'eye-outline'}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={inputStyles.errorText}>{error}</Text>}
    </View>
  );

  // Если есть onPress, оборачиваем в TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inputContent}
      </TouchableOpacity>
    );
  }

  return inputContent;
};

const inputStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholderLabel: {
    position: 'absolute',
    top: -10,
    zIndex: 3,
    left: 12,
    padding: 0,
    backgroundColor: styles.colors.white,
    fontSize: styles.fonSize.sm,
    color: '#8a94a0',
  },
  activePlaceholder: {
    padding: 3,
  },
  inputContainer: {
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 50,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    fontSize: 14,
    width: '80%',
    alignContent: 'center',
    justifyContent: 'center',
    color: styles.colors.input,
  },
  checkmarkIcon: {
    color: styles.colors.primary,
    fontSize: styles.fonSize.md + 5,
    marginRight: 10,
    fontWeight: '700',
  },
  eyeIcon: {
    color: '#9da0ae',
    fontSize: styles.fonSize.md + 3,
    marginRight: 10,
  },
  errorText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.red,
    paddingTop: 5,
  },
});

export default StandardInput;
