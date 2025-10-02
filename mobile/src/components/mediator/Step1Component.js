import React, {useState, useEffect, useRef} from 'react';
import {View, TouchableOpacity, Linking} from 'react-native';
import styles from '../../styles';
import Text from '../Text';
import TextArea from '../TextArea';
import StandardButton from '../StandardButton';
import {formatPrice} from '../../utils/orderUtils';

export default function Step1Component({
  orderData,
  stepData,
  updateStepData,
  onNextStep,
  openModal,
  t,
}) {
  const [notes, setNotes] = useState(() => {
    return stepData[1]?.notes || '';
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotes = async () => {
    console.log('Step1Component: Saving notes:', notes);
    setIsSaving(true);
    const success = await updateStepData(1, {notes});
    console.log('Step1Component: Save result:', success);
    setIsSaving(false);
    return success;
  };

  const handleNextStep = async () => {
    console.log('Step1Component: Next step clicked, current notes:', notes);

    // Пытаемся сохранить заметки, но не блокируем переход при ошибке
    try {
      await handleSaveNotes();
      console.log('Step1Component: Notes saved successfully');
    } catch (error) {
      console.log(
        'Step1Component: Failed to save notes, but proceeding anyway:',
        error,
      );
    }

    console.log('Step1Component: Calling onNextStep');
    onNextStep();
  };

  const handleNotesChange = text => {
    console.log('Step1Component: Notes changed to:', text);
    setNotes(text);
  };

  const handleCallCustomer = () => {
    if (orderData.customer?.phone) {
      Linking.openURL(`tel:${orderData.customer.phone}`);
    }
  };

  return (
    <View style={localStyles.container}>
      {/* Информация о заказе */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('Order Information')}</Text>

        <View style={localStyles.infoCard}>
          <View style={localStyles.infoRow}>
            <Text style={localStyles.infoLabel}>{t('Title')}:</Text>
            <Text style={localStyles.infoValue}>{orderData.title}</Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={localStyles.infoLabel}>{t('Budget')}:</Text>
            <Text style={localStyles.infoValue}>
              {formatPrice(orderData.max_amount)} AED
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={localStyles.infoLabel}>{t('Location')}:</Text>
            <Text style={localStyles.infoValue}>
              {orderData.city}, {orderData.address}
            </Text>
          </View>

          {orderData.description && (
            <View style={localStyles.infoColumn}>
              <Text style={localStyles.infoLabel}>{t('Description')}:</Text>
              <Text style={localStyles.infoDescription}>
                {orderData.description}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Контакты заказчика */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('Customer Contacts')}</Text>

        <View style={localStyles.contactCard}>
          <View style={localStyles.contactInfo}>
            <Text style={localStyles.contactName}>
              {orderData.customer?.name || t('Customer')}
            </Text>
            <Text style={localStyles.contactPhone}>
              {orderData.customer?.phone || t('Phone not available')}
            </Text>
            {orderData.customer?.email && (
              <Text style={localStyles.contactEmail}>
                {orderData.customer.email}
              </Text>
            )}
          </View>

          {orderData.customer?.phone && (
            <TouchableOpacity
              style={localStyles.callButton}
              onPress={handleCallCustomer}>
              <Text style={localStyles.callButtonText}>{t('Call')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Заметки */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('Notes')}</Text>
        <TextArea
          placeholder={t('Add notes about communication with customer...')}
          value={notes}
          onChange={handleNotesChange}
          multiline
          numberOfLines={4}
          style={localStyles.notesInput}
        />
      </View>

      {/* Кнопки действий */}
      <View style={localStyles.actionsSection}>
        <View style={localStyles.actionButtons}>
          <TouchableOpacity
            style={[localStyles.actionButton, localStyles.returnButton]}
            onPress={() => openModal('returnToApp')}>
            <Text style={localStyles.returnButtonText}>
              {t('Return to App')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.actionButton, localStyles.archiveButton]}
            onPress={() => openModal('archive')}>
            <Text style={localStyles.archiveButtonText}>{t('Archive')}</Text>
          </TouchableOpacity>
        </View>

        <StandardButton
          title={t('Next Step')}
          action={() => {
            console.log('Step1Component: Next Step button pressed');
            handleNextStep();
          }}
          loading={isSaving}
          style={localStyles.nextButton}
        />
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
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoColumn: {
    gap: 8,
  },
  infoLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.sm,
    flex: 1,
  },
  infoValue: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.sm,
    flex: 2,
    textAlign: 'right',
  },
  infoDescription: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.sm,
  },
  contactCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactInfo: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.smd,
  },
  contactPhone: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.primary,
    lineHeight: styles.lineHeight.sm,
  },
  contactEmail: {
    fontSize: styles.fonSize.xs,
    fontWeight: '400',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.xs,
  },
  callButton: {
    backgroundColor: styles.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  callButtonText: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.white,
    lineHeight: styles.lineHeight.sm,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  returnButton: {
    backgroundColor: styles.colors.white,
    borderColor: styles.colors.primary,
  },
  returnButtonText: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.primary,
    lineHeight: styles.lineHeight.sm,
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
  nextButton: {
    marginTop: 8,
  },
};
