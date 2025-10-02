import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import Text from './Text';

import styles from '../styles';

const CodeInput = ({
  value = '',
  onChange = () => {},
  codeLength = 4,
  onCodeComplete,
  error = null,
}) => {
  const inputRef = useRef();
  const [focused, setFocused] = useState(false);
  const animatedValues = useRef(
    [...Array(codeLength)].map(() => new Animated.Value(0)),
  ).current;

  // Создаем массив для отображения отдельных цифр
  const codeDigitsArray = new Array(codeLength).fill(0);

  const handleCodeChange = text => {
    // Убираем все нецифровые символы
    const newCode = text.replace(/[^0-9]/g, '');

    // Ограничиваем длину кода
    if (newCode.length <= codeLength) {
      onChange(newCode);

      // Анимация для заполненных ячеек
      animatedValues.forEach((animValue, index) => {
        if (index < newCode.length) {
          Animated.spring(animValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
          }).start();
        } else {
          Animated.spring(animValue, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
          }).start();
        }
      });
    }
  };

  useEffect(() => {
    if (value.length === codeLength) {
      onCodeComplete?.();
    }
  }, [value, codeLength, onCodeComplete]);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  const getCurrentActiveIndex = () => {
    return Math.min(value.length, codeLength - 1);
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={stylesd.container}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleCodeChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="number-pad"
          maxLength={codeLength}
          style={stylesd.hiddenInput}
          autoFocus={false}
        />
        <View style={stylesd.cellsContainer}>
          {codeDigitsArray.map((_, index) => {
            const digit = value[index] || '';
            const isActive =
              focused && index === getCurrentActiveIndex() && !digit;
            const isFilled = !!digit;
            const hasError = error && value.length === codeLength;

            const animatedStyle = {
              transform: [
                {
                  scale: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                },
              ],
            };

            return (
              <Animated.View
                key={index}
                style={[stylesd.cellContainer, animatedStyle]}>
                <View
                  style={[
                    stylesd.cell,
                    isActive && stylesd.activeCell,
                    isFilled && stylesd.filledCell,
                    hasError && stylesd.errorCell,
                  ]}>
                  <Text
                    style={[
                      stylesd.digit,
                      isActive && stylesd.activeDigit,
                      hasError && stylesd.errorDigit,
                    ]}>
                    {digit}
                  </Text>
                  {isActive && <View style={stylesd.cursor} />}
                </View>
              </Animated.View>
            );
          })}
        </View>
        {error && <Text style={stylesd.errorText}>{error}</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
};

const stylesd = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 24,
  },
  hiddenInput: {
    position: 'absolute',
    zIndex: 9,
    opacity: 0,
    width: 1,
    height: 1,
  },
  cellsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 264,
    height: 61,
    gap: 8,
  },
  cellContainer: {
    alignItems: 'center',
  },
  cell: {
    width: 60,
    height: 61,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#D5D5D5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16.9,
    elevation: 8,
    paddingHorizontal: 8, // Уменьшил горизонтальный padding
    paddingVertical: 8, // Уменьшил вертикальный padding
  },
  activeCell: {
    borderColor: '#3579F5',
    backgroundColor: '#FFFFFF',
  },
  filledCell: {
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  errorCell: {
    borderColor: styles.colors.red,
    backgroundColor: '#FFFFFF',
  },
  digit: {
    fontFamily: 'Inter-Regular',
    fontSize: 26, // Уменьшил размер шрифта
    fontWeight: '400',
    color: '#343434',
    lineHeight: 30, // Уменьшил lineHeight для лучшего размещения
    textAlign: 'center',
    letterSpacing: -0.32,
  },
  activeDigit: {
    color: '#3579F5',
  },
  errorDigit: {
    color: styles.colors.red,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 18, // Уменьшил высоту курсора под новый размер шрифта
    backgroundColor: '#3579F5',
    borderRadius: 1,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: styles.colors.red,
    lineHeight: 17,
    textAlign: 'center',
    width: '100%',
    marginTop: 8,
  },
});

export default CodeInput;
