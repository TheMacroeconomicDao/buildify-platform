import React, {useState, useRef} from 'react';
import {
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import styles from '../styles';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

const DATE_MASK = 'DD.MM.YYYY';
const DATE_PATTERN = /^\d{2}\.\d{2}\.\d{4}$/;

const DateInput = ({
  width = '100%',
  placeholder,
  value = '',
  onChange = () => {},
  size = 'md',
  autoFocus = false,
  style = {},
  error = null,
  hideLabel = false,
  hideValidationIcon = false,
}) => {
  const {t} = useTranslation();
  const defaultPlaceholder = placeholder || t('DD.MM.YYYY');
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const inputRef = useRef(null);
  const currentYear = new Date().getFullYear();

  const formatDateInput = text => {
    let cleaned = text.replace(/\D/g, '');
    let result = '';

    // Обработка дней
    if (cleaned.length > 0) {
      let day = cleaned.slice(0, 2);
      if (day.length === 1) {
        if (parseInt(day) > 3) return result;
        result = day;
      } else if (day.length === 2) {
        const dayNum = parseInt(day);
        if (dayNum > 31 || dayNum === 0) {
          result = day[0];
        } else {
          result = day;
        }
      }
    }

    // Обработка месяцев
    if (cleaned.length > 2) {
      let month = cleaned.slice(2, 4);
      if (month.length === 1) {
        if (parseInt(month) > 1) return result;
        result += '.' + month;
      } else if (month.length === 2) {
        const monthNum = parseInt(month);
        if (monthNum > 12 || monthNum === 0) {
          result += '.' + month[0];
        } else {
          result += '.' + month;
        }
      }
    }

    // Обработка годов
    if (cleaned.length > 4) {
      let year = cleaned.slice(4, 8);
      if (year.length === 1) {
        // Первая цифра года может быть 1 или 2 (для 19XX, 20XX или 21XX)
        if (parseInt(year) < 1 || parseInt(year) > 2) return result;
        result += '.' + year;
      } else if (year.length === 2) {
        // Проверяем первые две цифры (19, 20 или 21)
        if (!['19', '20', '21'].includes(year)) return result + '.' + year[0];
        result += '.' + year;
      } else if (year.length === 3) {
        const yearPrefix = parseInt(year);
        if (yearPrefix < 190 || yearPrefix > 210)
          return result + '.' + year.slice(0, 2);
        result += '.' + year;
      } else if (year.length === 4) {
        const yearNum = parseInt(year);
        // Для даты рождения: год должен быть от 1900 до текущего года
        if (yearNum < 1900 || yearNum > currentYear) {
          result += '.' + year.slice(0, 3);
        } else {
          result += '.' + year;
        }
      }
    }

    return result;
  };

  const validateDate = text => {
    if (!DATE_PATTERN.test(text)) return false;

    try {
      const [day, month, year] = text.split('.').map(Number);

      // Проверка на корректность даты через moment
      const date = moment(text, DATE_MASK, true);

      // Дополнительные проверки
      if (!date.isValid()) {
        console.log('Дата не валидна по moment:', text);
        return false;
      }

      // Для даты рождения: год должен быть от 1900 до текущего года
      if (year < 1900 || year > currentYear) {
        console.log('Год вне допустимого диапазона для даты рождения:', year);
        return false;
      }

      // Проверяем, что дата не в будущем
      if (date.isAfter(moment(), 'day')) {
        console.log('Дата рождения не может быть в будущем:', text);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка при валидации даты:', error, text);
      return false;
    }
  };

  const handleChange = text => {
    try {
      const formatted = formatDateInput(text);
      setDisplayValue(formatted);

      if (DATE_PATTERN.test(formatted)) {
        const isValid = validateDate(formatted);
        if (isValid) {
          // Если дата валидна, возвращаем её в формате ДД.ММ.ГГГГ
          onChange(formatted);
        } else {
          // Если дата не прошла валидацию, очищаем значение
          onChange('');
        }
      } else {
        onChange('');
      }
    } catch (error) {
      console.error('Ошибка в handleChange:', error, text);
      onChange('');
    }
  };

  const getBorderColor = () => {
    if (error) return styles.colors.red;
    if (isFocused) return styles.colors.primary;
    return styles.colors.border;
  };

  return (
    <View style={[dateStyles.container, {width}]}>
      {!hideLabel && (
        <Text
          style={[
            dateStyles.placeholderLabel,
            displayValue?.length > 0 && dateStyles.activePlaceholder,
          ]}>
          {displayValue?.length > 0 && placeholder}
        </Text>
      )}

      <View
        style={[dateStyles.inputContainer, {borderColor: getBorderColor()}]}>
        <TextInput
          inputMode="numeric"
          autoFocus={autoFocus}
          value={displayValue}
          placeholder={!isFocused ? defaultPlaceholder : ''}
          onChangeText={handleChange}
          placeholderTextColor={'#8a94A0'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={10}
          ref={inputRef}
          style={[dateStyles.input, style]}
        />
        {displayValue?.length === 10 &&
          !error &&
          !hideValidationIcon &&
          validateDate(displayValue) && (
            <Ionicons style={dateStyles.checkmarkIcon} name={'checkmark'} />
          )}
      </View>

      {error && <Text style={dateStyles.errorText}>{error}</Text>}
    </View>
  );
};

const dateStyles = StyleSheet.create({
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
    borderRadius: 8,
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
  errorText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.red,
    paddingTop: 5,
  },
});

export default DateInput;
