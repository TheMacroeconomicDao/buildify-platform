import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Text from '../components/Text';
import StandardButton from '../components/StandardButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import styles from '../styles';
import {formatPrice} from '../utils/orderUtils';

const {width} = Dimensions.get('window');

export default function OrderCompletionModal({
  visible,
  onClose,
  orderData,
  onViewOrder,
  onAcceptWork,
  onRejectWork,
}) {
  const {t} = useTranslation();

  if (!orderData) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={localStyles.overlay}>
        <View style={localStyles.container}>
          {/* Header */}
          <View style={localStyles.header}>
            <View style={localStyles.iconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={styles.colors.green}
              />
            </View>
            <TouchableOpacity style={localStyles.closeButton} onPress={onClose}>
              <Ionicons
                name="close"
                size={20}
                color={styles.colors.actionGray}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={localStyles.content}>
            <Text style={localStyles.title}>{t('Work Completed')}</Text>
            <Text style={localStyles.message}>
              {t('The executor has completed work on your order')} "
              {orderData.title}"
            </Text>

            {/* Order Info */}
            <View style={localStyles.orderInfo}>
              <View style={localStyles.infoRow}>
                <Text style={localStyles.label}>{t('Order')}:</Text>
                <Text style={localStyles.value}>#{orderData.id}</Text>
              </View>
              <View style={localStyles.infoRow}>
                <Text style={localStyles.label}>{t('Cost')}:</Text>
                <Text style={localStyles.value}>
                  {formatPrice(orderData.max_amount)}
                </Text>
              </View>
              {orderData.executor && (
                <View style={localStyles.infoRow}>
                  <Text style={localStyles.label}>{t('Executor')}:</Text>
                  <Text style={localStyles.value}>
                    {orderData.executor.name}
                  </Text>
                </View>
              )}
            </View>

            <Text style={localStyles.actionText}>
              {t(
                'Please review the work and confirm completion or request changes',
              )}
            </Text>
          </View>

          {/* Actions */}
          <View style={localStyles.actions}>
            <TouchableOpacity
              style={localStyles.secondaryButton}
              onPress={onViewOrder}>
              <Text style={localStyles.secondaryButtonText}>
                {t('View Order')}
              </Text>
            </TouchableOpacity>

            <View style={localStyles.primaryActions}>
              <TouchableOpacity
                style={[localStyles.actionButton, localStyles.rejectButton]}
                onPress={onRejectWork}>
                <Text style={localStyles.rejectButtonText}>
                  {t('Request Changes')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[localStyles.actionButton, localStyles.acceptButton]}
                onPress={onAcceptWork}>
                <Text style={localStyles.acceptButtonText}>
                  {t('Accept Work')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    width: width - 40,
    maxWidth: 400,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: styles.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  orderInfo: {
    backgroundColor: styles.colors.background,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    fontWeight: '500',
  },
  value: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.titles,
    fontWeight: '600',
  },
  actionText: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
    textAlign: 'center',
    lineHeight: 16,
  },
  actions: {
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    fontWeight: '500',
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  rejectButtonText: {
    fontSize: styles.fonSize.sm,
    color: '#D63031',
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: styles.colors.green,
  },
  acceptButtonText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.white,
    fontWeight: '600',
  },
});
