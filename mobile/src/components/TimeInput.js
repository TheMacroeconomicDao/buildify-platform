import React, {useState, useRef} from 'react';
import {
  Platform,
  TextInput,
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

// Список доступных вариантов времени
const TIME_OPTIONS = ['morning', 'afternoon', 'evening'];

// Компонент для выбора времени из списка
const TimePicker = ({selectedTime, onTimeSelect, onClose}) => {
  const {t} = useTranslation();

  const handleTimePress = time => {
    onTimeSelect(time);
    onClose();
  };

  return (
    <View style={timePickerStyles.container}>
      <View style={timePickerStyles.header}>
        <Text style={timePickerStyles.title}>{t('Select time')}</Text>
        <TouchableOpacity
          onPress={onClose}
          style={timePickerStyles.closeHeaderButton}>
          <Ionicons name="close" size={24} color={styles.colors.gray} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={timePickerStyles.timeList}
        showsVerticalScrollIndicator={false}>
        {TIME_OPTIONS.map(time => (
          <TouchableOpacity
            key={time}
            style={[
              timePickerStyles.timeOption,
              selectedTime === time && timePickerStyles.selectedTimeOption,
            ]}
            onPress={() => handleTimePress(time)}>
            <Text
              style={[
                timePickerStyles.timeText,
                selectedTime === time && timePickerStyles.selectedTimeText,
              ]}>
              {t(time)}
            </Text>
            {selectedTime === time && (
              <Ionicons
                name="checkmark"
                size={20}
                color={styles.colors.white}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={onClose} style={timePickerStyles.closeButton}>
        <Text style={timePickerStyles.closeButtonText}>{t('Close')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const TimeInput = ({
  width = '100%',
  placeholder,
  value = '',
  onChange = () => {},
  size = 'md',
  autoFocus = false,
  style = {},
  error = null,
  hideLabel = false,
}) => {
  const {t} = useTranslation();
  const defaultPlaceholder = placeholder || t('Select time');
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const handleTimeSelect = selectedTime => {
    onChange(selectedTime);
  };

  const getBorderColor = () => {
    if (error) return styles.colors.red;
    return styles.colors.border;
  };

  const isValid = value && TIME_OPTIONS.includes(value);

  return (
    <View style={[timeStyles.container, {width}, style]}>
      {!hideLabel && value && (
        <Text style={timeStyles.placeholderLabel}>{placeholder}</Text>
      )}

      <TouchableOpacity
        style={[timeStyles.inputContainer, {borderColor: getBorderColor()}]}
        onPress={() => setIsPickerVisible(true)}>
        <Text
          style={[timeStyles.inputText, !value && timeStyles.placeholderText]}>
          {value ? t(value) : defaultPlaceholder}
        </Text>

        <View style={timeStyles.iconContainer}>
          {isValid && !error && (
            <Ionicons name="checkmark" style={timeStyles.checkmarkIcon} />
          )}
          <Ionicons name="time" size={20} color={styles.colors.primary} />
        </View>
      </TouchableOpacity>

      {error && <Text style={timeStyles.errorText}>{error}</Text>}

      {/* Time Picker Modal */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}>
        <View style={timeStyles.modalOverlay}>
          <View style={timeStyles.modalContent}>
            <TimePicker
              selectedTime={value}
              onTimeSelect={handleTimeSelect}
              onClose={() => setIsPickerVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const timeStyles = StyleSheet.create({
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
    borderRadius: 8,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: styles.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
});

const timePickerStyles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: styles.colors.black,
  },
  closeHeaderButton: {
    padding: 4,
  },
  timeList: {
    maxHeight: 300,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedTimeOption: {
    backgroundColor: styles.colors.primary,
  },
  timeText: {
    fontSize: 16,
    color: styles.colors.black,
  },
  selectedTimeText: {
    color: styles.colors.white,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
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

export default TimeInput;
