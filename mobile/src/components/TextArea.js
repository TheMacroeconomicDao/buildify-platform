import React, {useState, useRef} from 'react';
import {Platform, TextInput, TouchableOpacity, View} from 'react-native';
import styles from '../styles'; // Предполагается, что styles импортируется из внешнего файла
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TextField from './TextField';

const TextArea = ({
  width = '100%',
  placeholder = '',
  value = '',
  onChange = () => {},
  secureTextEntry = false, // Оставим для совместимости, хотя для TextArea это редко используется
  size = 'md',
  autoFocus = false,
  style = {},
  mode = 'text',
  error = null,
  minHeight = 100,
  maxLength = 500,
  disabled = false,
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

  return (
    <View style={{width}}>
      <Text
        style={{
          position: 'absolute',
          top: -10,
          zIndex: 3,
          left: 12,
          padding: (value || '').length > 0 ? 3 : 0,
          backgroundColor: styles.colors.white,
          fontSize: styles.fonSize.sm, // Исправлено "fonSize" на "fontSize"
          color: '#8a94a0',
        }}>
        {(value || '').length > 0 && placeholder}
      </Text>

      <View
        style={{
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 10, // Добавлен вертикальный отступ для удобства
          minHeight, // Используем динамическую минимальную высоту
          borderColor: getBorderColor(),
          borderRadius: 16,
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <TextInput
          inputMode={mode}
          autoFocus={autoFocus}
          value={value || ''}
          placeholder={placeholder}
          onChangeText={onChange}
          secureTextEntry={is_secure}
          placeholderTextColor={'#8a94a0'}
          multiline={true} // Включаем многострочность
          maxLength={maxLength} // Ограничение длины текста
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontSize: 14,
            width: '80%',
            color: styles.colors.input,
            textAlignVertical: 'top', // Текст начинается с верхней части
            minHeight: minHeight - 20, // Учитываем padding
            ...style,
          }}
        />
        {!secureTextEntry && (value || '').length > 0 && !error && (
          <Ionicons
            style={{
              color: styles.colors.primary,
              fontSize: styles.fonSize[size] + 5,
              marginRight: 10,
              fontWeight: '700',
            }}
            name={'checkmark'}
          />
        )}
        {secureTextEntry && (value || '').length > 0 && (
          <TouchableOpacity onPress={() => setIsSecure(!is_secure)}>
            <Ionicons
              style={{
                color: '#9da0ae',
                fontSize: styles.fonSize[size] + 3,
                marginRight: 10,
              }}
              name={is_secure ? 'eye-off-outline' : 'eye-outline'}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={{
            fontSize: styles.fonSize.smd, // Исправлено "fonSize" на "fontSize"
            color: styles.colors.red,
            paddingTop: 5,
          }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default TextArea;
