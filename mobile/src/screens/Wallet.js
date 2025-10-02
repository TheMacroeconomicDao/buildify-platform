import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import styles from '../styles';
import {LoadingComponent} from './Loading';import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import {useTranslation} from 'react-i18next';
import walletService from '../services/walletService';

export default function Wallet({navigation}) {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('aed');
  const [transactions, setTransactions] = useState([]);
  const [amountInput, setAmountInput] = useState('10'); // default 10 AED
  const [processing, setProcessing] = useState(false);

  const amountCents = useMemo(() => {
    const num = parseFloat((amountInput || '0').replace(',', '.'));
    if (Number.isNaN(num) || num <= 0) return 0;
    return Math.round(num * 100);
  }, [amountInput]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wallet, txs] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(),
      ]);
      setBalance(wallet.balance || 0);
      setCurrency('aed'); // Always use AED
      setTransactions(Array.isArray(txs) ? txs : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onTopup = async () => {
    if (!amountCents || amountCents < 100) return; // min 1 AED
    setProcessing(true);
    try {
      const url = await walletService.topup(amountCents, currency);
      navigation.navigate('WebPagePay', {url, context: 'wallet_topup'});
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const formatBalance = cents => {
    const value = (cents || 0) / 100;
    return value.toFixed(2);
  };

  return (
    <View style={{flex: 1, backgroundColor: styles.colors.background}}>
      <HeaderBack action={() => navigation.goBack()} title={t('Balance')} />

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <LoadingComponent text={t('Loading...')} />
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            paddingHorizontal: styles.paddingHorizontal,
            paddingTop: 24,
          }}>
          <View style={localStyles.card}>
            <Text style={localStyles.balanceLabel}>{t('Balance')}</Text>
            <Text style={localStyles.balanceValue}>
              {formatBalance(balance)} AED
            </Text>
          </View>

          <View style={localStyles.card}>
            <Text style={localStyles.sectionTitle}>{t('Top up wallet')}</Text>
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                marginTop: 12,
              }}>
              <TextInput
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="decimal-pad"
                placeholder={t('Amount')}
                style={localStyles.input}
              />
              <TouchableOpacity
                style={[
                  localStyles.currencyBtn,
                  currency === 'aed' && localStyles.currencyBtnActive,
                ]}
                onPress={() => setCurrency('aed')}>
                <Text style={localStyles.currencyText}>AED</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={onTopup}
              disabled={processing || amountCents < 100}
              style={[
                localStyles.actionButton,
                (processing || amountCents < 100) && {opacity: 0.6},
              ]}>
              {processing ? (
                <ActivityIndicator size="small" color={styles.colors.white} />
              ) : (
                <Text style={localStyles.actionButtonText}>{t('Top up')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={localStyles.card}>
            <Text style={localStyles.sectionTitle}>
              {t('Last transactions')}
            </Text>
            {transactions.length === 0 ? (
              <Text style={{color: styles.colors.actionGray, marginTop: 12}}>
                {t('No transactions yet')}
              </Text>
            ) : (
              transactions.map(tx => (
                <View key={tx.id} style={localStyles.txRow}>
                  <Text
                    style={{
                      color: styles.colors.titles,
                      fontSize: styles.fonSize.sm,
                    }}>
                    {tx.type}
                  </Text>
                  <Text
                    style={{
                      color: styles.colors.titles,
                      fontSize: styles.fonSize.sm,
                      fontWeight: '500',
                    }}>
                    {formatBalance(tx.amount)} AED
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24, // Spacing between blocks: 24 units
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    fontWeight: '400',
  },
  balanceValue: {
    fontSize: styles.fonSize.h2,
    fontWeight: '500', // No bold fonts in app
    color: styles.colors.titles,
    marginTop: 8,
    lineHeight: 30,
  },
  sectionTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '500', // No bold fonts in app
    color: styles.colors.titles,
    marginBottom: 12, // Spacing between elements: 12 units
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: styles.colors.white,
    fontSize: styles.fonSize.sm,
    color: styles.colors.titles,
  },
  currencyBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: styles.colors.border,
    backgroundColor: styles.colors.white,
  },
  currencyBtnActive: {
    borderColor: styles.colors.primary,
    backgroundColor: styles.colors.primaryLight,
  },
  currencyText: {
    color: styles.colors.titles,
    fontWeight: '500', // No bold fonts in app
    fontSize: styles.fonSize.sm,
  },
  actionButton: {
    width: '100%',
    padding: 16,
    backgroundColor: styles.colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: styles.colors.white,
    fontWeight: '500', // No bold fonts in app
    fontSize: styles.fonSize.smd,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12, // Spacing between elements: 12 units
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
});
