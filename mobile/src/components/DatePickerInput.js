import React, {useState, useRef, useEffect} from 'react';
import {
  Platform,
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import styles from '../styles';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

// Простой календарь компонент
const Calendar = ({selectedDate, onDateSelect, onClose}) => {
  const {t} = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? moment(selectedDate, 'DD.MM.YYYY') : moment(),
  );
  const [showYearPicker, setShowYearPicker] = useState(false);
  const yearScrollRef = useRef(null);

  // Автоматически прокручиваем к текущему году при открытии
  useEffect(() => {
    if (showYearPicker && yearScrollRef.current) {
      const years = generateYearRange();
      const currentYearIndex = years.indexOf(currentMonth.year());
      if (currentYearIndex !== -1) {
        // Прокручиваем к текущему году с небольшой задержкой
        setTimeout(() => {
          yearScrollRef.current?.scrollTo({
            y: currentYearIndex * 45, // 45 - примерная высота элемента года
            animated: true,
          });
        }, 100);
      }
    }
  }, [showYearPicker, currentMonth]);

  const startOfMonth = currentMonth.clone().startOf('month');
  const endOfMonth = currentMonth.clone().endOf('month');
  const startOfWeek = startOfMonth.clone().startOf('week');
  const endOfWeek = endOfMonth.clone().endOf('week');

  const days = [];
  let day = startOfWeek.clone();

  while (day.isSameOrBefore(endOfWeek)) {
    days.push(day.clone());
    day.add(1, 'day');
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'month'));
  };

  const handleYearSelect = year => {
    setCurrentMonth(currentMonth.clone().year(year));
    setShowYearPicker(false);
  };

  const generateYearRange = () => {
    const currentYear = moment().year();
    const startYear = currentYear - 80; // 80 лет назад
    const endYear = currentYear; // до текущего года
    const years = [];

    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }

    return years;
  };

  const handleDatePress = date => {
    const formattedDate = date.format('DD.MM.YYYY');
    onDateSelect(formattedDate);
    onClose();
  };

  const isSelected = date => {
    return selectedDate && date.format('DD.MM.YYYY') === selectedDate;
  };

  const isToday = date => {
    return date.isSame(moment(), 'day');
  };

  const isCurrentMonth = date => {
    return date.isSame(currentMonth, 'month');
  };

  return (
    <View style={calendarStyles.container}>
      {/* Header */}
      <View style={calendarStyles.header}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={calendarStyles.navButton}>
          <Ionicons
            name="chevron-back"
            size={20}
            color={styles.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowYearPicker(!showYearPicker)}
          style={calendarStyles.monthYearButton}>
          <Text style={calendarStyles.monthYear}>
            {currentMonth.format('MMMM YYYY')}
          </Text>
          <Ionicons
            name={showYearPicker ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={styles.colors.primary}
            style={{marginLeft: 8}}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={calendarStyles.navButton}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={styles.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Year Picker */}
      {showYearPicker && (
        <View style={calendarStyles.yearPickerContainer}>
          <ScrollView
            ref={yearScrollRef}
            style={calendarStyles.yearScroll}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={calendarStyles.yearScrollContent}>
            {generateYearRange().map(year => (
              <TouchableOpacity
                key={year}
                style={[
                  calendarStyles.yearItem,
                  year === currentMonth.year() &&
                    calendarStyles.selectedYearItem,
                ]}
                onPress={() => handleYearSelect(year)}>
                <Text
                  style={[
                    calendarStyles.yearText,
                    year === currentMonth.year() &&
                      calendarStyles.selectedYearText,
                  ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Days of week */}
      <View style={calendarStyles.weekHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <Text key={dayName} style={calendarStyles.dayName}>
            {dayName}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={calendarStyles.week}>
          {week.map(date => (
            <TouchableOpacity
              key={date.format('YYYY-MM-DD')}
              style={[
                calendarStyles.day,
                isSelected(date) && calendarStyles.selectedDay,
                isToday(date) && !isSelected(date) && calendarStyles.todayDay,
                !isCurrentMonth(date) && calendarStyles.otherMonthDay,
              ]}
              onPress={() => handleDatePress(date)}>
              <Text
                style={[
                  calendarStyles.dayText,
                  isSelected(date) && calendarStyles.selectedDayText,
                  isToday(date) &&
                    !isSelected(date) &&
                    calendarStyles.todayDayText,
                  !isCurrentMonth(date) && calendarStyles.otherMonthDayText,
                ]}>
                {date.format('D')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Close button */}
      <TouchableOpacity onPress={onClose} style={calendarStyles.closeButton}>
        <Text style={calendarStyles.closeButtonText}>{t('Close')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const DatePickerInput = ({
  width = '100%',
  placeholder,
  value = '',
  onChange = () => {},
  size = 'md',
  style = {},
  error = null,
  hideLabel = false,
  hideValidationIcon = false,
}) => {
  const {t} = useTranslation();
  const defaultPlaceholder = placeholder || t('Select date');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  const formatDisplayValue = dateValue => {
    if (!dateValue) return '';
    // Если уже в формате DD.MM.YYYY, возвращаем как есть
    if (dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      return dateValue;
    }
    // Если в другом формате, пытаемся конвертировать
    const momentDate = moment(dateValue);
    if (momentDate.isValid()) {
      return momentDate.format('DD.MM.YYYY');
    }
    return dateValue;
  };

  const displayValue = formatDisplayValue(value);

  const handleDateSelect = selectedDate => {
    onChange(selectedDate);
  };

  const getBorderColor = () => {
    if (error) return styles.colors.red;
    return styles.colors.border;
  };

  const isValid =
    displayValue && moment(displayValue, 'DD.MM.YYYY', true).isValid();

  return (
    <View style={[datePickerStyles.container, {width}]}>
      {!hideLabel && displayValue && (
        <Text style={datePickerStyles.placeholderLabel}>{placeholder}</Text>
      )}

      <TouchableOpacity
        style={[
          datePickerStyles.inputContainer,
          {borderColor: getBorderColor()},
        ]}
        onPress={() => setIsCalendarVisible(true)}>
        <Text
          style={[
            datePickerStyles.inputText,
            !displayValue && datePickerStyles.placeholderText,
          ]}>
          {displayValue || defaultPlaceholder}
        </Text>

        <View style={datePickerStyles.iconContainer}>
          {isValid && !error && !hideValidationIcon && (
            <Ionicons name="checkmark" style={datePickerStyles.checkmarkIcon} />
          )}
          <Ionicons name="calendar" size={20} color={styles.colors.primary} />
        </View>
      </TouchableOpacity>

      {error && <Text style={datePickerStyles.errorText}>{error}</Text>}

      {/* Calendar Modal */}
      <Modal
        visible={isCalendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarVisible(false)}>
        <View style={datePickerStyles.modalOverlay}>
          <View style={datePickerStyles.modalContent}>
            <Calendar
              selectedDate={displayValue}
              onDateSelect={handleDateSelect}
              onClose={() => setIsCalendarVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const datePickerStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholderLabel: {
    position: 'absolute',
    top: -10,
    zIndex: 3,
    left: 12,
    padding: 3,
    backgroundColor: styles.colors.white,
    fontSize: styles.fonSize.sm,
    color: '#8a94a0',
  },
  inputContainer: {
    borderWidth: 1,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: styles.colors.white,
  },
  inputText: {
    fontSize: 14,
    color: styles.colors.input,
    flex: 1,
  },
  placeholderText: {
    color: '#8a94A0',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmarkIcon: {
    color: styles.colors.primary,
    fontSize: styles.fonSize.md + 5,
    fontWeight: '700',
  },
  errorText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.red,
    paddingTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
});

const calendarStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: styles.colors.black,
  },
  yearPickerContainer: {
    maxHeight: 200,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: styles.colors.border || '#E5E5E5',
    borderRadius: 8,
    backgroundColor: styles.colors.background || '#F8F9FA',
  },
  yearScroll: {
    maxHeight: 200,
  },
  yearScrollContent: {
    paddingVertical: 8,
  },
  yearItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: styles.colors.border || '#E5E5E5',
  },
  selectedYearItem: {
    backgroundColor: styles.colors.primaryLight || '#E3F2FD',
  },
  yearText: {
    fontSize: 16,
    color: styles.colors.black,
  },
  selectedYearText: {
    color: styles.colors.primary,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: styles.colors.gray,
    paddingVertical: 8,
  },
  week: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
    borderRadius: 6,
  },
  selectedDay: {
    backgroundColor: styles.colors.primary,
  },
  todayDay: {
    backgroundColor: styles.colors.primaryLight || '#E3F2FD',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: styles.colors.black,
  },
  selectedDayText: {
    color: styles.colors.white,
    fontWeight: '600',
  },
  todayDayText: {
    color: styles.colors.primary,
    fontWeight: '600',
  },
  otherMonthDayText: {
    color: styles.colors.gray,
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: styles.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: styles.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatePickerInput;
