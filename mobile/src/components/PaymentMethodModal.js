import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import styles from '../styles';
import Text from './Text';
import {useTranslation} from 'react-i18next';
import walletService from '../services/walletService';

const PaymentMethodModal = ({
  visible,
  onClose,
  tariff,
  onPaymentMethodSelected,
}) => {
  const {t} = useTranslation();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadWalletBalance();
    }
  }, [visible]);

  const loadWalletBalance = async () => {
    try {
      setLoading(true);
      const wallet = await walletService.getWallet();
      setWalletBalance(wallet.balance || 0);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const tariffPriceCents = (tariff?.price || 0) * 100;
  const hasEnoughBalance = walletBalance >= tariffPriceCents;
  const balanceInAED = walletBalance / 100;

  const handleWalletPayment = () => {
    if (!hasEnoughBalance) return;
    onPaymentMethodSelected('wallet');
    onClose();
  };

  const handleCardPayment = () => {
    onPaymentMethodSelected('card');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={localStyles.overlay}>
        <View style={localStyles.modal}>
          <Text style={localStyles.title}>Choose Payment Method</Text>
          <Text style={localStyles.subtitle}>
            Subscription: {tariff?.name} - {tariff?.price} AED
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={styles.colors.primary} />
          ) : (
            <View style={localStyles.methods}>
              {/* Wallet Payment */}
              <TouchableOpacity
                style={[
                  localStyles.methodCard,
                  !hasEnoughBalance && localStyles.methodCardDisabled,
                ]}
                onPress={handleWalletPayment}
                disabled={!hasEnoughBalance}>
                <View style={localStyles.methodHeader}>
                  <Text style={localStyles.methodTitle}>💳 Wallet</Text>
                  <Text
                    style={[
                      localStyles.methodBalance,
                      {
                        color: hasEnoughBalance
                          ? styles.colors.green
                          : styles.colors.red,
                      },
                    ]}>
                    {balanceInAED.toFixed(2)} AED
                  </Text>
                </View>
                {!hasEnoughBalance && (
                  <Text style={localStyles.insufficientText}>
                    Insufficient balance
                  </Text>
                )}
              </TouchableOpacity>

              {/* Card Payment */}
              <TouchableOpacity
                style={localStyles.methodCard}
                onPress={handleCardPayment}>
                <Text style={localStyles.methodTitle}>💳 Credit Card</Text>
                <Text style={localStyles.methodDescription}>
                  Pay with Stripe
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={localStyles.cancelButton} onPress={onClose}>
            <Text style={localStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: styles.fonSize.lg,
    fontWeight: '500',
    color: styles.colors.titles,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  methods: {
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: styles.colors.white,
  },
  methodCardDisabled: {
    opacity: 0.5,
    backgroundColor: styles.colors.background,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodTitle: {
    fontSize: styles.fonSize.md,
    fontWeight: '500',
    color: styles.colors.titles,
  },
  methodBalance: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
  },
  methodDescription: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
  },
  insufficientText: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.red,
    marginTop: 4,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: styles.fonSize.md,
    color: styles.colors.actionGray,
  },
});

export default PaymentMethodModal;
