import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import Text from './Text';
import DatePickerInput from './DatePickerInput';
import {useTranslation} from 'react-i18next';

const EditableDataField = ({
  label,
  value,
  onChangeText,
  isEdit = false,
  isMultiline = false,
  fieldType = 'text', // 'text', 'email', 'phone', 'date', 'number'
  placeholder = '',
  keyboardType = 'default',
  maxLength,
  required = false,
  error = null,
}) => {
  const {t} = useTranslation();

  const getKeyboardType = () => {
    switch (fieldType) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'number':
        return 'numeric';
      default:
        return keyboardType;
    }
  };

  const renderInput = () => {
    if (fieldType === 'date') {
      return (
        <DatePickerInput
          value={value}
          onChange={onChangeText}
          placeholder={placeholder || t('Select date')}
          hideLabel={true}
          hideValidationIcon={true}
          error={error}
        />
      );
    }

    return (
      <TextInput
        style={[
          styles.textInput,
          isMultiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A94A0"
        keyboardType={getKeyboardType()}
        autoCapitalize={fieldType === 'email' ? 'none' : 'sentences'}
        multiline={isMultiline}
        numberOfLines={isMultiline ? 3 : 1}
        maxLength={maxLength}
        autoCorrect={false}
        spellCheck={false}
      />
    );
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldLabelContainer}>
        <Text style={[styles.fieldLabel, required && styles.requiredLabel]}>
          {label}
          {required && ' *'}
        </Text>
      </View>

      {isEdit ? (
        fieldType === 'date' ? (
          <View>{renderInput()}</View>
        ) : (
          <View>
            {renderInput()}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )
      ) : (
        <Text
          style={[
            styles.fieldValue,
            isMultiline && styles.fieldValueMultiline,
            (!value || value.trim() === '') && styles.fieldValueEmpty,
          ]}>
          {value && value.trim() !== '' ? value : t('Not specified')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#323232',
  },
  requiredLabel: {
    color: '#323232',
  },
  fieldValue: {
    fontSize: 16,
    color: '#323232',
    lineHeight: 22,
    minHeight: 22,
  },
  fieldValueMultiline: {
    minHeight: 66,
  },
  fieldValueEmpty: {
    color: '#8A94A0',
    fontStyle: 'italic',
  },
  textInput: {
    fontSize: 16,
    color: '#323232',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});

export default EditableDataField;
