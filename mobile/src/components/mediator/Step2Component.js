import React, {useState, useEffect} from 'react';
import {View, TouchableOpacity, Alert} from 'react-native';
import styles from '../../styles';
import Text from '../Text';
import StandardInput from '../StandardInput';
import TextArea from '../TextArea';
import StandardButton from '../StandardButton';
import {formatPrice} from '../../utils/orderUtils';

export default function Step2Component({
  orderData,
  stepData,
  updateStepData,
  onNextStep,
  openModal,
  navigation,
  t,
}) {
  const [executorName, setExecutorName] = useState(() => {
    return stepData[2]?.executor_contact_name || '';
  });
  const [executorPhone, setExecutorPhone] = useState(() => {
    return stepData[2]?.executor_contact_phone || '';
  });
  const [executorCost, setExecutorCost] = useState(() => {
    return stepData[2]?.executor_cost?.toString() || '';
  });
  const [margin, setMargin] = useState(0);
  const [notes, setNotes] = useState(() => {
    return stepData[2]?.notes || '';
  });
  const [isSaving, setIsSaving] = useState(false);

  // Автоматический расчет маржи
  useEffect(() => {
    const cost = parseFloat(executorCost) || 0;
    const budget = orderData?.max_amount || 0;
    const calculatedMargin = budget - cost;
    setMargin(calculatedMargin);
  }, [executorCost, orderData?.max_amount]);

  const handleSaveData = async () => {
    // Валидация
    if (!executorName.trim()) {
      Alert.alert(t('Error'), t('Executor name is required'));
      return false;
    }
    if (!executorPhone.trim()) {
      Alert.alert(t('Error'), t('Executor phone is required'));
      return false;
    }
    if (!executorCost.trim()) {
      Alert.alert(t('Error'), t('Executor cost is required'));
      return false;
    }

    const cost = parseFloat(executorCost);
    if (isNaN(cost) || cost <= 0) {
      Alert.alert(t('Error'), t('Please enter valid executor cost'));
      return false;
    }

    if (cost >= (orderData?.max_amount || 0)) {
      Alert.alert(
        t('Warning'),
        t('Executor cost is equal or higher than budget. Continue?'),
        [
          {text: t('Cancel'), style: 'cancel'},
          {text: t('Continue'), onPress: () => saveData()},
        ],
      );
      return false;
    }

    return await saveData();
  };

  const saveData = async () => {
    setIsSaving(true);
    const success = await updateStepData(2, {
      executor_contact_name: executorName.trim(),
      executor_contact_phone: executorPhone.trim(),
      executor_cost: parseFloat(executorCost),
      notes,
    });
    setIsSaving(false);
    return success;
  };

  const handleNextStep = async () => {
    const success = await handleSaveData();
    if (success) {
      onNextStep();
    }
  };

  const handleCostChange = text => {
    setExecutorCost(text);
  };

  const handleNameChange = text => {
    setExecutorName(text);
  };

  const handlePhoneChange = text => {
    setExecutorPhone(text);
  };

  const handleNotesChange = text => {
    setNotes(text);
  };

  const handleSearchExecutors = () => {
    // Навигация к экрану поиска исполнителей
    navigation.navigate('MediatorExecutorSearch', {
      orderId: orderData.id,
      orderData: orderData,
      onSelectExecutor: executor => {
        setExecutorName(executor.name);
        setExecutorPhone(executor.phone);
        // Автоматически сохраняем данные при выборе исполнителя
        updateStepData(2, {
          executor_contact_name: executor.name,
          executor_contact_phone: executor.phone,
        });
      },
    });
  };

  return (
    <View style={localStyles.container}>
      {/* Информация из предыдущего шага */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('Order Details')}</Text>

        <View style={localStyles.infoCard}>
          <View style={localStyles.infoRow}>
            <Text style={localStyles.infoLabel}>{t('Budget')}:</Text>
            <Text style={localStyles.infoValue}>
              {formatPrice(orderData.max_amount)}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={localStyles.infoLabel}>{t('Customer')}:</Text>
            <Text style={localStyles.infoValue}>
              {orderData.customer?.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Поиск исполнителя */}
      <View style={localStyles.section}>
        <View style={localStyles.sectionHeader}>
          <Text style={localStyles.sectionTitle}>{t('Executor Search')}</Text>
          <TouchableOpacity
            style={localStyles.searchButton}
            onPress={handleSearchExecutors}>
            <Text style={localStyles.searchButtonText}>
              {t('Search in App')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={localStyles.executorForm}>
          <StandardInput
            label={t('Executor Name')}
            placeholder={t('Enter executor full name')}
            value={executorName}
            onChange={handleNameChange}
            required
          />

          <View style={localStyles.phoneRow}>
            <StandardInput
              label={t('Executor Phone')}
              placeholder={t('Enter executor phone number')}
              value={executorPhone}
              onChange={handlePhoneChange}
              keyboardType="phone-pad"
              style={localStyles.phoneInput}
              required
            />
          </View>

          <StandardInput
            label={t('Executor Cost')}
            placeholder={t('Enter executor cost in AED')}
            value={executorCost}
            onChange={handleCostChange}
            keyboardType="numeric"
            required
          />
        </View>
      </View>

      {/* Расчет маржи */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('Margin Calculation')}</Text>

        <View style={localStyles.marginCard}>
          <View style={localStyles.marginRow}>
            <Text style={localStyles.marginLabel}>{t('Order Budget')}:</Text>
            <Text style={localStyles.marginValue}>
              {formatPrice(orderData.max_amount)}
            </Text>
          </View>

          <View style={localStyles.marginRow}>
            <Text style={localStyles.marginLabel}>{t('Executor Cost')}:</Text>
            <Text style={localStyles.marginValue}>
              -{formatPrice(parseFloat(executorCost) || 0)}
            </Text>
          </View>

          <View style={localStyles.marginDivider} />

          <View style={localStyles.marginRow}>
            <Text style={localStyles.marginTotalLabel}>
              {t('Your Margin')}:
            </Text>
            <Text
              style={[
                localStyles.marginTotalValue,
                margin < 0 && localStyles.negativeMargin,
              ]}>
              {formatPrice(margin)}
            </Text>
          </View>
        </View>
      </View>

      {/* Заметки */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('Notes')}</Text>
        <TextArea
          placeholder={t('Add notes about executor negotiation...')}
          value={notes}
          onChange={handleNotesChange}
          multiline
          numberOfLines={3}
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
          action={handleNextStep}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: styles.fonSize.md,
    fontWeight: '600',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.md,
  },
  searchButton: {
    backgroundColor: styles.colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  searchButtonText: {
    fontSize: styles.fonSize.xs,
    fontWeight: '600',
    color: styles.colors.primary,
    lineHeight: styles.lineHeight.xs,
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
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.sm,
  },
  infoValue: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.sm,
  },
  executorForm: {
    gap: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  phoneInput: {
    flex: 1,
  },

  marginCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marginLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.sm,
  },
  marginValue: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.sm,
  },
  marginDivider: {
    height: 1,
    backgroundColor: styles.colors.border,
    marginVertical: 8,
  },
  marginTotalLabel: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.black,
    lineHeight: styles.lineHeight.smd,
  },
  marginTotalValue: {
    fontSize: styles.fonSize.smd,
    fontWeight: '700',
    color: styles.colors.success,
    lineHeight: styles.lineHeight.smd,
  },
  negativeMargin: {
    color: styles.colors.error,
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
