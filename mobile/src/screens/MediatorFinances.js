import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import DatePickerInput from '../components/DatePickerInput';
import StandardButton from '../components/StandardButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {api, retryApiCall} from '../services';
import {notifyError, notifySuccess} from '../services/notify';
import styles from '../styles';
import {formatPrice} from '../utils/orderUtils';
import {LoadingComponent} from './Loading';

const TRANSACTION_TYPES = {
  commission: 'Комиссия',
  bonus: 'Бонус',
  penalty: 'Штраф',
  withdrawal: 'Вывод средств',
};

const TRANSACTION_STATUS = {
  pending: 'Ожидает',
  completed: 'Завершена',
  cancelled: 'Отменена',
  failed: 'Ошибка',
};

export default function MediatorFinances({navigation}) {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Фильтр по периоду
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterApplied, setFilterApplied] = useState(false);

  // Настройки комиссии
  const [marginPercentage, setMarginPercentage] = useState('');
  const [fixedFee, setFixedFee] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [notes, setNotes] = useState('');

  const goBack = () => {
    navigation.goBack();
  };

  // Загрузка статистики
  const loadStats = async () => {
    try {
      const response = await retryApiCall(() => api.mediator.getStats());
      if (response.success) {
        setStats(response.result || {});
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      notifyError(t('Error'), t('Failed to load statistics'));
    }
  };

  // Загрузка истории транзакций
  const loadTransactions = async (filters = {}) => {
    try {
      const params = {};

      // Добавляем фильтр по периоду если установлен
      if (filters.from_date || fromDate) {
        params.from_date = filters.from_date || fromDate;
      }
      if (filters.to_date || toDate) {
        params.to_date = filters.to_date || toDate;
      }

      const response = await retryApiCall(() =>
        api.mediator.getTransactionHistory(params),
      );
      if (response.success) {
        setTransactions(response.result || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      notifyError(t('Error'), t('Failed to load transaction history'));
    }
  };

  // Загрузка всех данных
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadTransactions()]);
    } finally {
      setLoading(false);
    }
  };

  // Обновление данных
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Применить фильтр по периоду
  const applyPeriodFilter = async () => {
    if (!fromDate && !toDate) {
      Alert.alert(t('Error'), t('Please select at least one date'));
      return;
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      Alert.alert(t('Error'), t('Start date cannot be later than end date'));
      return;
    }

    setFilterApplied(true);
    setShowPeriodFilter(false);
    await loadTransactions();
  };

  // Сбросить фильтр
  const clearPeriodFilter = async () => {
    setFromDate(null);
    setToDate(null);
    setFilterApplied(false);
    await loadTransactions();
  };

  // Получить текст примененного фильтра
  const getFilterText = () => {
    if (!filterApplied) return null;

    const formatDate = date => {
      if (!date) return null;
      return new Date(date).toLocaleDateString('ru-RU');
    };

    if (fromDate && toDate) {
      return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
    } else if (fromDate) {
      return `${t('From')} ${formatDate(fromDate)}`;
    } else if (toDate) {
      return `${t('Until')} ${formatDate(toDate)}`;
    }
    return null;
  };

  // Быстрые фильтры по периодам
  const applyQuickFilter = async period => {
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(today);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        endDate = new Date(today);
        break;
      default:
        return;
    }

    setFromDate(startDate.toISOString().split('T')[0]);
    setToDate(endDate.toISOString().split('T')[0]);
    setFilterApplied(true);
    setShowPeriodFilter(false);
    await loadTransactions();
  };

  // Сохранение настроек комиссии
  const saveCommissionSettings = async () => {
    try {
      const data = {};

      if (marginPercentage) {
        data.margin_percentage = parseFloat(marginPercentage);
      }
      if (fixedFee) {
        data.fixed_fee = parseFloat(fixedFee);
      }
      if (agreedPrice) {
        data.agreed_price = parseFloat(agreedPrice);
      }
      if (notes) {
        data.notes = notes;
      }

      const response = await api.mediator.updateCommissionSettings(data);
      if (response.success) {
        notifySuccess(t('Settings saved successfully'));
        setShowSettings(false);
      } else {
        notifyError(
          t('Error'),
          response.message || t('Failed to save settings'),
        );
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      notifyError(t('Error'), t('Failed to save settings'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Рендер статистической карточки
  const renderStatCard = (
    title,
    value,
    icon,
    color = styles.colors.primary,
  ) => (
    <View style={financeStyles.statCard}>
      <View style={[financeStyles.statIcon, {backgroundColor: color}]}>
        <Ionicons name={icon} size={24} color={styles.colors.white} />
      </View>
      <View style={financeStyles.statContent}>
        <Text style={financeStyles.statValue}>{value}</Text>
        <Text style={financeStyles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  // Рендер транзакции
  const renderTransaction = transaction => {
    const isPositive =
      transaction.type === 'commission' || transaction.type === 'bonus';
    const statusColor =
      transaction.status === 'completed'
        ? '#00B894'
        : transaction.status === 'pending'
        ? '#FDCB6E'
        : transaction.status === 'cancelled'
        ? '#E17055'
        : '#D63031';

    return (
      <View key={transaction.id} style={financeStyles.transactionCard}>
        <View style={financeStyles.transactionHeader}>
          <View style={financeStyles.transactionInfo}>
            <Text style={financeStyles.transactionType}>
              {TRANSACTION_TYPES[transaction.type] || transaction.type}
            </Text>
            <Text style={financeStyles.transactionDate}>
              {new Date(transaction.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={financeStyles.transactionAmount}>
            <Text
              style={[
                financeStyles.amountText,
                {color: isPositive ? '#00B894' : '#D63031'},
              ]}>
              {isPositive ? '+' : '-'}
              {formatPrice(Math.abs(transaction.commission_amount))}
            </Text>
            <View
              style={[
                financeStyles.statusBadge,
                {backgroundColor: statusColor},
              ]}>
              <Text style={financeStyles.statusText}>
                {TRANSACTION_STATUS[transaction.status] || transaction.status}
              </Text>
            </View>
          </View>
        </View>

        {transaction.order && (
          <Text style={financeStyles.orderInfo}>
            {t('Order')}: {transaction.order.title}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={financeStyles.container}>
        <HeaderBack title={t('Finances')} action={goBack} center={false} />
        <LoadingComponent text={t('Loading...')} />
      </View>
    );
  }

  return (
    <View style={financeStyles.container}>
      <HeaderBack
        title={t('Finances')}
        action={goBack}
        center={false}
        rightAction={() => setShowSettings(!showSettings)}
        rightIcon="settings-outline"
      />

      <ScrollView
        style={financeStyles.scrollView}
        contentContainerStyle={financeStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Статистика */}
        <View style={financeStyles.statsSection}>
          <View style={financeStyles.sectionHeader}>
            <Text style={financeStyles.sectionTitle}>{t('Statistics')}</Text>
          </View>

          {/* Фильтр периода */}
          <TouchableOpacity
            style={financeStyles.periodFilterCard}
            onPress={() => setShowPeriodFilter(true)}>
            <View style={financeStyles.periodFilterContent}>
              <View style={financeStyles.periodFilterLeft}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={styles.colors.primary}
                />
                <Text style={financeStyles.periodFilterLabel}>
                  {t('Period Filter')}
                </Text>
              </View>
              <View style={financeStyles.periodFilterRight}>
                <Text style={financeStyles.periodFilterValue}>
                  {filterApplied ? getFilterText() : t('All time')}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={styles.colors.actionGray}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Индикатор примененного фильтра */}
          {filterApplied && (
            <View style={financeStyles.filterIndicatorTop}>
              <Text style={financeStyles.filterTextTop}>
                {t('Showing data for')}: {getFilterText()}
              </Text>
              <TouchableOpacity
                style={financeStyles.clearFilterButtonTop}
                onPress={clearPeriodFilter}>
                <Ionicons
                  name="close"
                  size={14}
                  color={styles.colors.actionGray}
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={financeStyles.statsGrid}>
            {renderStatCard(
              t('Total Earnings'),
              formatPrice(stats.total_earnings || 0),
              'cash',
              '#00B894',
            )}
            {renderStatCard(
              t('Pending Earnings'),
              formatPrice(stats.pending_earnings || 0),
              'time',
              '#FDCB6E',
            )}
            {renderStatCard(
              t('Completed Deals'),
              stats.completed_deals || 0,
              'checkmark-circle',
              '#6C5CE7',
            )}
            {renderStatCard(
              t('Success Rate'),
              `${stats.success_rate || 0}%`,
              'trending-up',
              '#74B9FF',
            )}
          </View>

          <View style={financeStyles.averageCommission}>
            <Text style={financeStyles.averageTitle}>
              {t('Average Commission')}
            </Text>
            <Text style={financeStyles.averageValue}>
              {formatPrice(stats.average_commission || 0)}
            </Text>
          </View>

          {/* Статистика workflow */}
          {stats.workflow_stats && (
            <View style={financeStyles.workflowSection}>
              <Text style={financeStyles.workflowTitle}>
                {t('Workflow Statistics')}
              </Text>

              <View style={financeStyles.workflowGrid}>
                {renderStatCard(
                  t('Step 1: Details'),
                  stats.workflow_stats.step1_count || 0,
                  'clipboard',
                  '#55A3FF',
                )}
                {renderStatCard(
                  t('Step 2: Executor'),
                  stats.workflow_stats.step2_count || 0,
                  'people',
                  '#FD79A8',
                )}
                {renderStatCard(
                  t('Step 3: Implementation'),
                  stats.workflow_stats.step3_count || 0,
                  'construct',
                  '#FDCB6E',
                )}
                {renderStatCard(
                  t('Archived'),
                  stats.archived_deals || 0,
                  'archive',
                  '#636E72',
                )}
              </View>

              {/* Эффективность */}
              <View style={financeStyles.efficiencySection}>
                <View style={financeStyles.efficiencyItem}>
                  <Text style={financeStyles.efficiencyLabel}>
                    {t('Completion Rate')}
                  </Text>
                  <Text style={financeStyles.efficiencyValue}>
                    {stats.workflow_efficiency?.completion_rate || 0}%
                  </Text>
                </View>
                <View style={financeStyles.efficiencyItem}>
                  <Text style={financeStyles.efficiencyLabel}>
                    {t('Average Margin')}
                  </Text>
                  <Text style={financeStyles.efficiencyValue}>
                    {formatPrice(stats.average_margin || 0)} AED
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Настройки комиссии */}
        {showSettings && (
          <View style={financeStyles.settingsSection}>
            <Text style={financeStyles.sectionTitle}>
              {t('Commission Settings')}
            </Text>

            <View style={financeStyles.settingRow}>
              <Text style={financeStyles.settingLabel}>
                {t('Margin Percentage')} (%)
              </Text>
              <TextInput
                style={financeStyles.settingInput}
                value={marginPercentage}
                onChangeText={setMarginPercentage}
                placeholder="10"
                keyboardType="numeric"
              />
            </View>

            <View style={financeStyles.settingRow}>
              <Text style={financeStyles.settingLabel}>
                {t('Fixed Fee')} (AED)
              </Text>
              <TextInput
                style={financeStyles.settingInput}
                value={fixedFee}
                onChangeText={setFixedFee}
                placeholder="50"
                keyboardType="numeric"
              />
            </View>

            <View style={financeStyles.settingRow}>
              <Text style={financeStyles.settingLabel}>
                {t('Agreed Price')} (AED)
              </Text>
              <TextInput
                style={financeStyles.settingInput}
                value={agreedPrice}
                onChangeText={setAgreedPrice}
                placeholder="100"
                keyboardType="numeric"
              />
            </View>

            <View style={financeStyles.settingRow}>
              <Text style={financeStyles.settingLabel}>{t('Notes')}</Text>
              <TextInput
                style={[financeStyles.settingInput, financeStyles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t(
                  'Additional notes about your commission structure',
                )}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={financeStyles.saveButton}
              onPress={saveCommissionSettings}>
              <Text style={financeStyles.saveButtonText}>
                {t('Save Settings')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* История транзакций */}
        <View style={financeStyles.transactionsSection}>
          <Text style={financeStyles.sectionTitle}>
            {t('Transaction History')}
          </Text>

          {transactions.length > 0 ? (
            transactions.map(renderTransaction)
          ) : (
            <View style={financeStyles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={styles.colors.actionGray}
              />
              <Text style={financeStyles.emptyTitle}>
                {t('No Transactions')}
              </Text>
              <Text style={financeStyles.emptySubtitle}>
                {t('Your transaction history will appear here')}
              </Text>
            </View>
          )}
        </View>

        <View style={financeStyles.bottomSpacer} />
      </ScrollView>

      {/* Модальное окно фильтра по периоду */}
      <Modal
        visible={showPeriodFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPeriodFilter(false)}>
        <View style={financeStyles.modalOverlay}>
          <View style={financeStyles.modalContent}>
            <View style={financeStyles.modalHeader}>
              <Text style={financeStyles.modalTitle}>
                {t('Filter by Period')}
              </Text>
              <TouchableOpacity
                style={financeStyles.modalCloseButton}
                onPress={() => setShowPeriodFilter(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={styles.colors.actionGray}
                />
              </TouchableOpacity>
            </View>

            <View style={financeStyles.modalBody}>
              {/* Быстрые фильтры */}
              <Text style={financeStyles.quickFiltersLabel}>
                {t('Quick Filters')}
              </Text>
              <View style={financeStyles.quickFiltersRow}>
                <TouchableOpacity
                  style={financeStyles.quickFilterButton}
                  onPress={() => applyQuickFilter('today')}>
                  <Text style={financeStyles.quickFilterText}>
                    {t('Today')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={financeStyles.quickFilterButton}
                  onPress={() => applyQuickFilter('week')}>
                  <Text style={financeStyles.quickFilterText}>{t('Week')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={financeStyles.quickFilterButton}
                  onPress={() => applyQuickFilter('month')}>
                  <Text style={financeStyles.quickFilterText}>
                    {t('Month')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={financeStyles.quickFilterButton}
                  onPress={() => applyQuickFilter('quarter')}>
                  <Text style={financeStyles.quickFilterText}>
                    {t('Quarter')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Кастомный период */}
              <Text style={financeStyles.customPeriodLabel}>
                {t('Custom Period')}
              </Text>

              <Text style={financeStyles.dateLabel}>{t('From Date')}</Text>
              <DatePickerInput
                value={fromDate}
                onChangeDate={setFromDate}
                placeholder={t('Select start date')}
                style={financeStyles.dateInput}
              />

              <Text style={financeStyles.dateLabel}>{t('To Date')}</Text>
              <DatePickerInput
                value={toDate}
                onChangeDate={setToDate}
                placeholder={t('Select end date')}
                style={financeStyles.dateInput}
              />

              <View style={financeStyles.modalActions}>
                <TouchableOpacity
                  style={[
                    financeStyles.modalButton,
                    financeStyles.cancelButton,
                  ]}
                  onPress={() => setShowPeriodFilter(false)}>
                  <Text style={financeStyles.cancelButtonText}>
                    {t('Cancel')}
                  </Text>
                </TouchableOpacity>

                <StandardButton
                  title={t('Apply Filter')}
                  onPress={applyPeriodFilter}
                  style={financeStyles.applyButton}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const financeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: styles.paddingHorizontal,
    paddingTop: 16,
  },

  // Секции
  statsSection: {
    marginBottom: 24,
  },
  settingsSection: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: styles.colors.border,
  },
  transactionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.lg,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  periodFilterCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  periodFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  periodFilterLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: '#323232',
    fontFamily: 'Inter',
  },
  periodFilterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodFilterValue: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.primary,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  filterIndicatorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: styles.colors.primary,
  },
  filterTextTop: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.primary,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  clearFilterButtonTop: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },

  // Статистика
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: styles.fonSize.md,
    fontWeight: '700',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.md,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
    lineHeight: styles.lineHeight.xs,
  },
  averageCommission: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: styles.colors.border,
  },
  averageTitle: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
    lineHeight: styles.lineHeight.smd,
    marginBottom: 8,
  },
  averageValue: {
    fontSize: styles.fonSize.xl,
    fontWeight: '700',
    color: styles.colors.primary,
    lineHeight: styles.lineHeight.xl,
  },

  // Workflow статистика
  workflowSection: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    padding: 20,
    borderWidth: 1,
    borderColor: styles.colors.border,
    marginTop: 16,
  },
  workflowTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.lg,
    marginBottom: 16,
    textAlign: 'center',
  },
  workflowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  efficiencySection: {
    flexDirection: 'row',
    gap: 16,
  },
  efficiencyItem: {
    flex: 1,
    backgroundColor: styles.colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  efficiencyLabel: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
    lineHeight: styles.lineHeight.xs,
    marginBottom: 4,
    textAlign: 'center',
  },
  efficiencyValue: {
    fontSize: styles.fonSize.md,
    fontWeight: '700',
    color: styles.colors.primary,
    lineHeight: styles.lineHeight.md,
    textAlign: 'center',
  },

  // Настройки
  settingRow: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.sm,
    marginBottom: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    backgroundColor: styles.colors.white,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: styles.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: styles.colors.white,
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    lineHeight: styles.lineHeight.sm,
  },

  // Транзакции
  transactionCard: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.sm,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
    lineHeight: styles.lineHeight.xs,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: styles.fonSize.md,
    fontWeight: '700',
    lineHeight: styles.lineHeight.md,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.white,
    fontWeight: '500',
    lineHeight: styles.lineHeight.xs,
  },
  orderInfo: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
    lineHeight: styles.lineHeight.xs,
    fontStyle: 'italic',
  },

  // Пустое состояние
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 24,
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
    lineHeight: styles.lineHeight.smd,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 80,
  },

  // Стили для фильтра
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    display: 'flex',
    height: 40,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: styles.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: styles.colors.border,
    marginTop: -10,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: styles.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.primary,
    fontWeight: '500',
    lineHeight: styles.lineHeight.sm,
  },
  clearFilterButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: styles.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Стили модального окна
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  modalTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.lg,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: styles.colors.background,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  quickFiltersLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 12,
    lineHeight: styles.lineHeight.sm,
  },
  quickFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  quickFilterButton: {
    backgroundColor: styles.colors.background,
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '22%',
    alignItems: 'center',
  },
  quickFilterText: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
    fontWeight: '500',
    lineHeight: styles.lineHeight.xs,
  },
  customPeriodLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 12,
    marginTop: 8,
    lineHeight: styles.lineHeight.sm,
  },
  dateLabel: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 8,
    marginTop: 16,
    lineHeight: styles.lineHeight.sm,
  },
  dateInput: {
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: styles.colors.background,
    borderWidth: 1,
    borderColor: styles.colors.border,
  },
  cancelButtonText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    fontWeight: '500',
    lineHeight: styles.lineHeight.sm,
  },
  applyButton: {
    flex: 1,
  },
});
