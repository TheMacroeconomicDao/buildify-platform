import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {useReferrals} from '../hooks/useReferrals';
import styles from '../styles';
import {LoadingComponent} from './Loading';

const ReferralCodeCard = ({code, onCopy, onShare}) => {
  const {t} = useTranslation();

  return (
    <View style={referralStyles.codeCard}>
      <Text style={referralStyles.codeTitle}>{t('My Referral Code')}</Text>
      <View style={referralStyles.codeContainer}>
        <Text style={referralStyles.code}>{code}</Text>
        <TouchableOpacity
          onPress={() => onCopy(code)}
          style={referralStyles.copyButton}>
          <Ionicons name="copy" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={referralStyles.shareButton}
        onPress={() => onShare(code)}>
        <Text style={referralStyles.shareButtonText}>{t('Share')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const ReferralStats = ({stats, formatCurrency}) => {
  const {t} = useTranslation();

  if (!stats) {
    return (
      <View style={referralStyles.statsCard}>
        <Text style={referralStyles.statsTitle}>{t('Statistics')}</Text>
        <Text style={{textAlign: 'center', color: '#666'}}>
          {t('Loading...')}
        </Text>
      </View>
    );
  }

  return (
    <View style={referralStyles.statsCard}>
      <Text style={referralStyles.statsTitle}>{t('Statistics')}</Text>

      <View style={referralStyles.statsRow}>
        <Text style={referralStyles.statsLabel}>{t('Total Invited')}:</Text>
        <Text style={referralStyles.statsValue}>
          {stats.total_referrals} {t('people')}
        </Text>
      </View>

      <View style={referralStyles.statsRow}>
        <Text style={referralStyles.statsLabel}>{t('Active Referrals')}:</Text>
        <Text style={referralStyles.statsValue}>
          {stats.active_referrals} {t('people')}
        </Text>
      </View>

      <View style={referralStyles.statsRow}>
        <Text style={referralStyles.statsLabel}>{t('Total Earnings')}:</Text>
        <Text style={referralStyles.statsValue}>
          {formatCurrency(stats.total_earnings_aed)}
        </Text>
      </View>

      <View style={referralStyles.cashbackInfo}>
        <Text style={referralStyles.cashbackText}>
          {t('You earn')} {stats.cashback_percentage}%{' '}
          {t('from referral top-ups')}
        </Text>
      </View>
    </View>
  );
};

const BonusBalance = ({balance, formatCurrency, onUse}) => {
  const {t} = useTranslation();

  return (
    <View style={referralStyles.balanceCard}>
      <View style={referralStyles.balanceHeader}>
        <Ionicons name="gift" size={24} color="#FF6B35" />
        <Text style={referralStyles.balanceTitle}>{t('Bonus Balance')}</Text>
      </View>
      <Text style={referralStyles.balanceAmount}>
        {formatCurrency(balance)}
      </Text>

      {balance > 0 && (
        <TouchableOpacity style={referralStyles.useButton} onPress={onUse}>
          <Text style={referralStyles.useButtonText}>
            {t('Use for Payment')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const ReferralItem = ({referral, formatCurrency}) => {
  const {t} = useTranslation();

  return (
    <View style={referralStyles.referralItem}>
      <View style={referralStyles.statusIndicator}>
        <Ionicons
          name={referral.status === 'active' ? 'checkmark-circle' : 'time'}
          size={20}
          color={referral.status === 'active' ? '#28a745' : '#ffc107'}
        />
      </View>

      <View style={referralStyles.referralInfo}>
        <Text style={referralStyles.referralName}>
          {referral.referred_user.name}
        </Text>
        <Text style={referralStyles.referralEarnings}>
          {t('Earned')}: {formatCurrency(referral.total_earned_aed)}
        </Text>
        <Text style={referralStyles.referralDate}>
          {t('Registered')}:{' '}
          {new Date(referral.registered_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

const ReferralList = ({referrals, formatCurrency}) => {
  const {t} = useTranslation();

  if (!referrals || referrals.length === 0) {
    return (
      <View style={referralStyles.emptyList}>
        <Ionicons name="people-outline" size={48} color="#ccc" />
        <Text style={referralStyles.emptyText}>{t('No referrals yet')}</Text>
        <Text style={referralStyles.emptySubtext}>
          {t('Share your referral code to invite executors')}
        </Text>
      </View>
    );
  }

  return (
    <View style={referralStyles.referralsList}>
      <Text style={referralStyles.listTitle}>{t('My Referrals')}</Text>
      {referrals.map(referral => (
        <ReferralItem
          key={referral.id}
          referral={referral}
          formatCurrency={formatCurrency}
        />
      ))}
    </View>
  );
};

const UseBonusModal = ({
  visible,
  onClose,
  bonusBalance,
  formatCurrency,
  onUse,
}) => {
  const {t} = useTranslation();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUse = async () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('Error'), t('Please enter a valid amount'));
      return;
    }

    if (numAmount > bonusBalance) {
      Alert.alert(t('Error'), t('Amount exceeds available balance'));
      return;
    }

    setLoading(true);
    try {
      const result = await onUse(numAmount);
      if (result) {
        setAmount('');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={referralStyles.modalOverlay}>
        <View style={referralStyles.modalContent}>
          <Text style={referralStyles.modalTitle}>
            {t('Use Bonus Balance')}
          </Text>
          <Text style={referralStyles.modalSubtitle}>
            {t('Available')}: {formatCurrency(bonusBalance)}
          </Text>

          <TextInput
            style={referralStyles.amountInput}
            placeholder={t('Amount to use')}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!loading}
          />

          <View style={referralStyles.modalButtons}>
            <TouchableOpacity
              style={referralStyles.cancelButton}
              onPress={onClose}
              disabled={loading}>
              <Text style={referralStyles.cancelButtonText}>{t('Cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                referralStyles.confirmButton,
                loading && referralStyles.disabledButton,
              ]}
              onPress={handleUse}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={referralStyles.confirmButtonText}>{t('Use')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function Referrals({navigation}) {
  console.log('🎯 Referrals screen rendered');
  const {t} = useTranslation();
  const userData = useSelector(state => state.auth.userData);

  const {
    stats,
    referrals,
    loading,
    refreshing,
    fetchReferralStats,
    fetchReferrals,
    copyReferralCode,
    shareReferralCode,
    useBonusBalance,
    formatCurrency,
    refresh,
  } = useReferrals();

  const [showUseBonusModal, setShowUseBonusModal] = useState(false);

  // Загружаем данные при фокусе экрана
  useFocusEffect(
    React.useCallback(() => {
      fetchReferralStats();
      fetchReferrals();
    }, [fetchReferralStats, fetchReferrals]),
  );

  const handleShareCode = async () => {
    if (stats?.referral_code) {
      const shareText = `Join Buildlify and use my referral code ${stats.referral_code} during registration! Get access to the best executors 🎯`;
      await shareReferralCode(stats.referral_code, shareText);
    }
  };

  const handleUseBonusBalance = async amount => {
    const result = await useBonusBalance(amount, 'manual_use');
    return result !== null;
  };

  if (loading && !stats) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <HeaderBack navigation={navigation} title={t('Referral Program')} />
        <LoadingComponent text={t('Loading...')} />
        <Text style={{marginTop: 16}}>{t('Loading referral data')}...</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <HeaderBack
        navigation={navigation}
        title={t('Referral Program')}
        action={() => navigation.goBack()}
      />

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 50}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Промокод - всегда показываем */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#333',
              marginBottom: 12,
              textAlign: 'center',
            }}>
            {t('My Referral Code')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#007AFF',
                letterSpacing: 2,
                lineHeight: 24,
              }}>
              {stats?.referral_code || 'LOADING...'}
            </Text>
            <TouchableOpacity
              onPress={() => copyReferralCode(stats?.referral_code || '')}
              style={{padding: 8}}>
              <Ionicons name="copy" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: '#007AFF',
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
            }}
            onPress={handleShareCode}>
            <Text
              style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16,
              }}>
              {t('Share')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Статистика - всегда показываем */}
        <View style={referralStyles.statsCard}>
          <Text style={referralStyles.statsTitle}>{t('Statistics')}</Text>

          <View style={referralStyles.statsRow}>
            <Text style={referralStyles.statsLabel}>{t('Total Invited')}:</Text>
            <Text style={referralStyles.statsValue}>
              {stats?.total_referrals || 0} {t('people')}
            </Text>
          </View>

          <View style={referralStyles.statsRow}>
            <Text style={referralStyles.statsLabel}>
              {t('Active Referrals')}:
            </Text>
            <Text style={referralStyles.statsValue}>
              {stats?.active_referrals || 0} {t('people')}
            </Text>
          </View>

          <View style={referralStyles.statsRow}>
            <Text style={referralStyles.statsLabel}>
              {t('Total Earnings')}:
            </Text>
            <Text style={referralStyles.statsValue}>
              {formatCurrency(stats?.total_earnings_aed || 0)}
            </Text>
          </View>

          <View style={referralStyles.cashbackInfo}>
            <Text style={referralStyles.cashbackText}>
              {t('You earn')} {stats?.cashback_percentage || 10}%{' '}
              {t('from referral top-ups')}
            </Text>
          </View>
        </View>

        {/* Бонусный баланс - всегда показываем */}
        <View style={referralStyles.balanceCard}>
          <View style={referralStyles.balanceHeader}>
            <Ionicons name="gift" size={24} color="#FF6B35" />
            <Text style={referralStyles.balanceTitle}>
              {t('Bonus Balance')}
            </Text>
          </View>
          <Text style={referralStyles.balanceAmount}>
            {formatCurrency(stats?.referral_balance_aed || 0)}
          </Text>

          {(stats?.referral_balance_aed || 0) > 0 && (
            <TouchableOpacity
              style={referralStyles.useButton}
              onPress={() => setShowUseBonusModal(true)}>
              <Text style={referralStyles.useButtonText}>
                {t('Use for Payment')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Список рефералов или заглушка */}
        {!referrals || referrals.length === 0 ? (
          <View style={referralStyles.emptyList}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={referralStyles.emptyText}>
              {t('No referrals yet')}
            </Text>
            <Text style={referralStyles.emptySubtext}>
              {t('Share your referral code to invite executors')}
            </Text>
          </View>
        ) : (
          <View style={referralStyles.referralsList}>
            <Text style={referralStyles.listTitle}>{t('My Referrals')}</Text>
            {referrals.map(referral => (
              <ReferralItem
                key={referral.id}
                referral={referral}
                formatCurrency={formatCurrency}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <UseBonusModal
        visible={showUseBonusModal}
        onClose={() => setShowUseBonusModal(false)}
        bonusBalance={stats?.referral_balance_aed || 0}
        formatCurrency={formatCurrency}
        onUse={handleUseBonusBalance}
      />
    </View>
  );
}

const referralStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
  },

  codeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  codeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },

  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },

  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: 2,
  },

  copyButton: {
    padding: 8,
  },

  shareButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },

  shareButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  statsLabel: {
    fontSize: 14,
    color: '#666',
  },

  statsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  cashbackInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },

  cashbackText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },

  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  balanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },

  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28a745',
    marginVertical: 8,
    lineHeight: 32,
  },

  useButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },

  useButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  referralsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },

  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  statusIndicator: {
    marginRight: 12,
  },

  referralInfo: {
    flex: 1,
  },

  referralName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  referralEarnings: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 2,
  },

  referralDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  emptyList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },

  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },

  confirmButton: {
    flex: 1,
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },

  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.6,
  },
});
