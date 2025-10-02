import React, {useState} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import styles from '../../styles';
import Text from '../Text';
import TextArea from '../TextArea';
import StandardButton from '../StandardButton';

export default function CompleteOrderModal({
  visible,
  onClose,
  onCompleteSuccess,
  onCompleteRejection,
  t,
}) {
  const [completionType, setCompletionType] = useState(null); // 'success' или 'rejection'
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectType = type => {
    setCompletionType(type);
    setNotes('');
  };

  const handleConfirm = async () => {
    if (!notes.trim() && completionType === 'rejection') {
      return;
    }

    setIsSubmitting(true);

    if (completionType === 'success') {
      await onCompleteSuccess(notes.trim());
    } else if (completionType === 'rejection') {
      await onCompleteRejection(notes.trim());
    }

    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setCompletionType(null);
    setNotes('');
    onClose();
  };

  const renderTypeSelection = () => (
    <View style={localStyles.typeSelection}>
      <TouchableOpacity
        style={[
          localStyles.typeButton,
          localStyles.successTypeButton,
          completionType === 'success' && localStyles.selectedTypeButton,
        ]}
        onPress={() => handleSelectType('success')}>
        <Text
          style={[
            localStyles.typeButtonText,
            localStyles.successTypeText,
            completionType === 'success' && localStyles.selectedTypeText,
          ]}>
          ✅ {t('Successful Completion')}
        </Text>
        <Text style={localStyles.typeDescription}>
          {t('Project completed successfully')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          localStyles.typeButton,
          localStyles.rejectionTypeButton,
          completionType === 'rejection' && localStyles.selectedTypeButton,
        ]}
        onPress={() => handleSelectType('rejection')}>
        <Text
          style={[
            localStyles.typeButtonText,
            localStyles.rejectionTypeText,
            completionType === 'rejection' && localStyles.selectedTypeText,
          ]}>
          ❌ {t('Complete with Rejection')}
        </Text>
        <Text style={localStyles.typeDescription}>
          {t('Project could not be completed')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNotesInput = () => (
    <View style={localStyles.inputSection}>
      <Text style={localStyles.inputLabel}>
        {completionType === 'success'
          ? t('Completion Notes')
          : t('Rejection Reason')}
        {completionType === 'rejection' && (
          <Text style={localStyles.required}> *</Text>
        )}
      </Text>
      <TextArea
        placeholder={
          completionType === 'success'
            ? t('Add notes about successful completion...')
            : t('Enter reason for rejection...')
        }
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={localStyles.notesInput}
        maxLength={500}
      />
      <Text style={localStyles.charCount}>
        {notes.length}/500 {t('characters')}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={localStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={localStyles.keyboardView}>
          <View style={localStyles.modalContainer}>
            <View style={localStyles.modalContent}>
              {/* Заголовок */}
              <View style={localStyles.header}>
                <Text style={localStyles.title}>{t('Complete Order')}</Text>
                <Text style={localStyles.subtitle}>
                  {t('Choose how you want to complete this order')}
                </Text>
              </View>

              {/* Выбор типа завершения */}
              {!completionType && renderTypeSelection()}

              {/* Поле для заметок */}
              {completionType && renderNotesInput()}

              {/* Кнопки */}
              <View style={localStyles.buttonsContainer}>
                <TouchableOpacity
                  style={[localStyles.button, localStyles.cancelButton]}
                  onPress={
                    completionType ? () => setCompletionType(null) : handleClose
                  }
                  disabled={isSubmitting}>
                  <Text style={localStyles.cancelButtonText}>
                    {completionType ? t('Back') : t('Cancel')}
                  </Text>
                </TouchableOpacity>

                {completionType && (
                  <StandardButton
                    title={
                      completionType === 'success'
                        ? t('Complete Successfully')
                        : t('Reject Order')
                    }
                    onPress={handleConfirm}
                    loading={isSubmitting}
                    disabled={completionType === 'rejection' && !notes.trim()}
                    style={[
                      localStyles.button,
                      localStyles.confirmButton,
                      completionType === 'rejection' &&
                        !notes.trim() &&
                        localStyles.disabledButton,
                    ]}
                    variant={
                      completionType === 'success' ? 'primary' : 'destructive'
                    }
                  />
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const localStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: styles.fonSize.lg,
    fontWeight: '700',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.sm,
    textAlign: 'center',
  },
  typeSelection: {
    gap: 12,
  },
  typeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 4,
  },
  successTypeButton: {
    backgroundColor: styles.colors.successLight,
    borderColor: styles.colors.success,
  },
  rejectionTypeButton: {
    backgroundColor: styles.colors.errorLight,
    borderColor: styles.colors.error,
  },
  selectedTypeButton: {
    borderWidth: 3,
  },
  typeButtonText: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    lineHeight: styles.lineHeight.smd,
    textAlign: 'center',
  },
  successTypeText: {
    color: styles.colors.success,
  },
  rejectionTypeText: {
    color: styles.colors.error,
  },
  selectedTypeText: {
    fontWeight: '700',
  },
  typeDescription: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.xs,
    textAlign: 'center',
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.smd,
  },
  required: {
    color: styles.colors.error,
  },
  notesInput: {
    backgroundColor: styles.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: styles.colors.border,
    fontSize: 14,
    color: styles.colors.black,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.xs,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: styles.colors.background,
    borderWidth: 1,
    borderColor: styles.colors.border,
  },
  cancelButtonText: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.smd,
  },
  confirmButton: {
    backgroundColor: styles.colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
};
