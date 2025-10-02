import React, {useState, useEffect, useCallback} from 'react';
import {View, TouchableOpacity, Alert} from 'react-native';
import styles from '../../styles';
import Text from '../Text';
import TextArea from '../TextArea';
import StandardButton from '../StandardButton';
import DatePickerInput from '../DatePickerInput';
import {formatPrice} from '../../utils/orderUtils';
import {notifySuccess} from '../../services/notify';

export default function Step3Component({
  orderData,
  stepData,
  updateStepData,
  onCompleteSuccess,
  onCompleteRejection,
  openModal,
  t,
}) {
  const [deadline, setDeadline] = useState(() => {
    const initialDeadline = stepData[3]?.project_deadline || '';
    return initialDeadline;
  });
  const [notes, setNotes] = useState(() => {
    return stepData[3]?.notes || '';
  });
  const [isSaving, setIsSaving] = useState(false);

  // Синхронизация формы с сохраненными данными при изменении stepData
  useEffect(() => {
    if (
      stepData[3]?.project_deadline &&
      stepData[3].project_deadline !== deadline
    ) {
      setDeadline(stepData[3].project_deadline);
    }

    if (stepData[3]?.notes && stepData[3].notes !== notes) {
      setNotes(stepData[3].notes);
    }
  }, [stepData, deadline, notes]);

  const handleSaveData = useCallback(async () => {
    setIsSaving(true);

    const success = await updateStepData(3, {
      project_deadline: deadline,
      notes: notes,
    });

    if (success) {
      notifySuccess(t('Success'), t('Progress saved successfully'));
    }

    setIsSaving(false);
    return success;
  }, [deadline, notes, updateStepData]);

  const handleDeadlineChange = date => {
    setDeadline(date);
  };

  const handleNotesChange = text => {
    setNotes(text);
  };

  const handleCompleteSuccess = () => {
    Alert.alert(
      t('Complete Order'),
      t('Are you sure you want to mark this order as successfully completed?'),
      [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: t('Complete'),
          style: 'default',
          onPress: async () => {
            await handleSaveData();
            onCompleteSuccess(notes);
          },
        },
      ],
    );
  };

  const handleCompleteRejection = () => {
    Alert.alert(
      t('Reject Order'),
      t('Are you sure you want to reject this order?'),
      [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: t('Reject'),
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              t('Rejection Reason'),
              t('Please provide a reason for rejection:'),
              [
                {text: t('Cancel'), style: 'cancel'},
                {
                  text: t('Reject'),
                  style: 'destructive',
                  onPress: async reason => {
                    if (reason?.trim()) {
                      await handleSaveData();
                      onCompleteRejection(reason.trim());
                    } else {
                      Alert.alert(t('Error'), t('Reason is required'));
                    }
                  },
                },
              ],
              'plain-text',
            );
          },
        },
      ],
    );
  };

  return (
    <View style={localStyles.container}>
      {/* Сводка по заказу */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('Order Summary')}</Text>

        <View style={localStyles.summaryCard}>
          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>{t('Customer')}:</Text>
            <Text style={localStyles.summaryValue}>
              {orderData.customer?.name}
            </Text>
          </View>

          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>{t('Executor')}:</Text>
            <Text style={localStyles.summaryValue}>
              {orderData.executor_contact_name || t('Not specified')}
            </Text>
          </View>

          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>{t('Order Budget')}:</Text>
            <Text style={localStyles.summaryValue}>
              {formatPrice(orderData.max_amount)}
            </Text>
          </View>

          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>{t('Executor Cost')}:</Text>
            <Text style={localStyles.summaryValue}>
              {formatPrice(orderData.executor_cost)}
            </Text>
          </View>

          <View style={localStyles.summaryDivider} />

          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryTotalLabel}>
              {t('Your Margin')}:
            </Text>
            <Text
              style={[
                localStyles.summaryTotalValue,
                (orderData.mediator_margin || 0) < 0 &&
                  localStyles.negativeMargin,
              ]}>
              {formatPrice(orderData.mediator_margin)}
            </Text>
          </View>
        </View>
      </View>

      {/* Управление проектом */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('Project Management')}</Text>

        <View style={localStyles.managementForm}>
          <DatePickerInput
            label={t('Project Deadline')}
            placeholder={t('Select project completion deadline')}
            value={deadline}
            onChange={handleDeadlineChange}
            minimumDate={new Date()}
          />
        </View>
      </View>

      {/* Заметки о реализации */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>
          {t('Implementation Notes')}
        </Text>
        <TextArea
          placeholder={t('Add notes about project implementation progress...')}
          value={notes}
          onChange={handleNotesChange}
          multiline
          numberOfLines={4}
          style={localStyles.notesInput}
        />
      </View>

      {/* Кнопка сохранения */}
      <View style={localStyles.saveSection}>
        <StandardButton
          title={t('Save Progress')}
          action={handleSaveData}
          loading={isSaving}
          style={localStyles.saveButton}
        />
      </View>

      {/* Кнопки завершения */}
      <View style={localStyles.actionsSection}>
        {/* Кнопка архивации */}
        <TouchableOpacity
          style={[localStyles.actionButton, localStyles.archiveButton]}
          onPress={() => openModal('archive')}>
          <Text style={localStyles.archiveButtonText}>{t('Archive')}</Text>
        </TouchableOpacity>

        {/* Кнопки завершения */}
        <View style={localStyles.completionButtons}>
          <TouchableOpacity
            style={[localStyles.completionButton, localStyles.rejectButton]}
            onPress={handleCompleteRejection}>
            <Text style={localStyles.rejectButtonText}>
              {t('Complete with Rejection')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.completionButton, localStyles.successButton]}
            onPress={handleCompleteSuccess}>
            <Text style={localStyles.successButtonText}>
              {t('Successful Completion')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const localStyles = {
  container: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: styles.fonSize.md,
    fontWeight: '600',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.md,
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.sm,
  },
  summaryValue: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.sm,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: styles.colors.border,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.smd,
  },
  summaryTotalValue: {
    fontSize: styles.fonSize.smd,
    fontWeight: '700',
    color: styles.colors.success,
    lineHeight: styles.lineHeight.smd,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  negativeMargin: {
    color: styles.colors.error,
  },
  managementForm: {
    gap: 16,
  },
  notesInput: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    fontSize: 14,
    color: styles.colors.black,
    textAlignVertical: 'top',
  },
  actionsSection: {
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  archiveButton: {
    backgroundColor: styles.colors.white,
    borderColor: styles.colors.error,
  },
  archiveButtonText: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.error,
    lineHeight: styles.lineHeight.sm,
  },
  completionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  completionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: styles.colors.errorLight,
    borderWidth: 1,
    borderColor: styles.colors.error,
  },
  rejectButtonText: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.error,
    lineHeight: styles.lineHeight.sm,
  },
  successButton: {
    backgroundColor: styles.colors.success,
  },
  successButtonText: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.white,
    lineHeight: styles.lineHeight.sm,
  },
  saveSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: styles.colors.primary,
  },
};
