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

export default function ArchiveOrderModal({visible, onClose, onConfirm, t}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    await onConfirm(reason.trim());
    setIsSubmitting(false);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

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
                <Text style={localStyles.title}>{t('Archive Order')}</Text>
                <Text style={localStyles.subtitle}>
                  {t('Please provide a reason for archiving this order')}
                </Text>
              </View>

              {/* Поле для причины */}
              <View style={localStyles.inputSection}>
                <Text style={localStyles.inputLabel}>
                  {t('Reason')} <Text style={localStyles.required}>*</Text>
                </Text>
                <TextArea
                  placeholder={t('Enter reason for archiving...')}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  style={localStyles.reasonInput}
                  maxLength={500}
                />
                <Text style={localStyles.charCount}>
                  {reason.length}/500 {t('characters')}
                </Text>
              </View>

              {/* Кнопки */}
              <View style={localStyles.buttonsContainer}>
                <TouchableOpacity
                  style={[localStyles.button, localStyles.cancelButton]}
                  onPress={handleClose}
                  disabled={isSubmitting}>
                  <Text style={localStyles.cancelButtonText}>
                    {t('Cancel')}
                  </Text>
                </TouchableOpacity>

                <StandardButton
                  title={t('Archive')}
                  onPress={handleConfirm}
                  loading={isSubmitting}
                  disabled={!reason.trim()}
                  style={[
                    localStyles.button,
                    localStyles.confirmButton,
                    !reason.trim() && localStyles.disabledButton,
                  ]}
                  variant="destructive"
                />
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
  reasonInput: {
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
    backgroundColor: styles.colors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
};
