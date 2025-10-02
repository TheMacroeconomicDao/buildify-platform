import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {api, retryApiCall} from '../services';
import {notifyError, notifySuccess} from '../services/notify';
import styles from '../styles';
import {LoadingComponent} from './Loading';
import {formatPrice} from '../utils/orderUtils';

const STATUS_COLORS = {
  0: '#FFA500', // SearchExecutor - orange
  1: '#FF6B6B', // Cancelled - red
  2: '#4ECDC4', // SelectingExecutor - turquoise
  3: '#45B7D1', // ExecutorSelected - blue
  4: '#96CEB4', // InWork - green
  5: '#FFEAA7', // AwaitingConfirmation - yellow
  6: '#FF7675', // Rejected - red
  7: '#00B894', // Closed - dark green
  8: '#6C5CE7', // Completed - purple
  // Новые цвета для статусов посредника
  10: '#55A3FF', // Step 1 - blue
  11: '#FD79A8', // Step 2 - pink
  12: '#FDCB6E', // Step 3 - yellow
  13: '#636E72', // Archived - gray
};

const STATUS_NAMES = {
  0: 'Looking for performer',
  1: 'Cancelled',
  2: 'Selecting performer',
  3: 'Performer selected',
  4: 'In progress',
  5: 'Awaiting confirmation',
  6: 'Rejected',
  7: 'Closed',
  8: 'Completed',
  // Новые статусы для посредника
  10: 'Step 1: Details',
  11: 'Step 2: Executor',
  12: 'Step 3: Implementation',
  13: 'Archived',
};

export default function MediatorDeals({navigation}) {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deals, setDeals] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'available'

  const goBack = () => {
    navigation.goBack();
  };

  // Loading active deals
  const loadActiveDeals = async () => {
    try {
      const response = await retryApiCall(() => api.mediator.getActiveDeals());
      if (response.success) {
        const dealsData = response.result || [];
        // Сортируем активные сделки от новых к старым по дате создания
        const sortedDeals = dealsData.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime(); // Убывающий порядок (новые первые)
        });
        setDeals(sortedDeals);
      }
    } catch (error) {
      console.error('Error loading active deals:', error);
      notifyError(t('Error'), t('Failed to load active deals'));
    }
  };

  // Loading available orders
  const loadAvailableOrders = async () => {
    try {
      const response = await retryApiCall(() =>
        api.mediator.getAvailableOrders(),
      );
      if (response.success) {
        const ordersData = response.result || [];
        // Сортируем доступные заказы от новых к старым по дате создания
        const sortedOrders = ordersData.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime(); // Убывающий порядок (новые первые)
        });
        setAvailableOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Error loading available orders:', error);
      notifyError(t('Error'), t('Failed to load available orders'));
    }
  };

  // Loading all data
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadActiveDeals(), loadAvailableOrders()]);
    } finally {
      setLoading(false);
    }
  };

  // Data refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Take order to work
  const takeOrder = async orderId => {
    try {
      const response = await api.mediator.takeOrder(orderId);
      if (response.success) {
        notifySuccess(t('Order taken successfully'));
        await loadData(); // Refresh data

        // Автоматически переходим к workflow для взятого заказа
        navigation.navigate('MediatorOrderSteps', {orderId});
      } else {
        notifyError(t('Error'), response.message || t('Failed to take order'));
      }
    } catch (error) {
      console.error('Error taking order:', error);
      notifyError(t('Error'), t('Failed to take order'));
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await api.mediator.updateOrderStatus(orderId, {
        status: newStatus,
      });
      if (response.success) {
        notifySuccess(t('Status updated successfully'));
        await loadActiveDeals(); // Refresh active deals
      } else {
        notifyError(
          t('Error'),
          response.message || t('Failed to update status'),
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
      notifyError(t('Error'), t('Failed to update status'));
    }
  };

  // Navigate to order details
  const navigateToOrderDetails = (orderId, orderStatus) => {
    // Посредник всегда использует свой специальный экран MediatorOrderSteps
    // чтобы избежать проблем с доступом к откликам на заказы
    navigation.navigate('MediatorOrderSteps', {orderId});
  };

  useEffect(() => {
    loadData();
  }, []);

  // Рендер карточки активной сделки
  const renderActiveDeal = deal => (
    <TouchableOpacity
      key={deal.id}
      style={dealStyles.dealCard}
      onPress={() => navigateToOrderDetails(deal.id, deal.status)}>
      <View style={dealStyles.dealHeader}>
        <Text style={dealStyles.dealTitle} numberOfLines={2}>
          {deal.title}
        </Text>
        <View
          style={[
            dealStyles.statusBadge,
            {backgroundColor: STATUS_COLORS[deal.status] || '#gray'},
          ]}>
          <Text style={dealStyles.statusText}>
            {STATUS_NAMES[deal.status] || 'Unknown'}
          </Text>
        </View>
      </View>

      <View style={dealStyles.dealInfo}>
        <View style={dealStyles.infoRow}>
          <Ionicons name="person" size={16} color={styles.colors.actionGray} />
          <Text style={dealStyles.infoText}>
            {t('Customer')}: {deal.customer?.name || t('Unknown')}
          </Text>
        </View>

        {deal.executor && (
          <View style={dealStyles.infoRow}>
            <Ionicons
              name="construct"
              size={16}
              color={styles.colors.actionGray}
            />
            <Text style={dealStyles.infoText}>
              {t('Executor')}: {deal.executor.name}
            </Text>
          </View>
        )}

        <View style={dealStyles.infoRow}>
          <Ionicons name="cash" size={16} color={styles.colors.actionGray} />
          <Text style={dealStyles.infoText}>
            {t('Amount')}: {formatPrice(deal.max_amount)}
          </Text>
        </View>

        <View style={dealStyles.infoRow}>
          <Ionicons
            name="trending-up"
            size={16}
            color={styles.colors.primary}
          />
          <Text style={[dealStyles.infoText, {color: styles.colors.primary}]}>
            {t('Commission')}: {formatPrice(deal.commission)}
          </Text>
        </View>
      </View>

      <View style={dealStyles.dealFooter}>
        <Text style={dealStyles.dateText}>
          {new Date(deal.created_at).toLocaleDateString()}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={styles.colors.actionGray}
        />
      </View>
    </TouchableOpacity>
  );

  // Рендер карточки доступного заказа
  const renderAvailableOrder = order => (
    <TouchableOpacity
      key={order.id}
      style={dealStyles.orderCard}
      onPress={() =>
        navigation.navigate('MediatorOrderPreview', {
          orderId: order.id,
          orderData: order,
        })
      }>
      <View style={dealStyles.orderHeader}>
        <Text style={dealStyles.orderTitle} numberOfLines={2}>
          {order.title}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={styles.colors.actionGray}
        />
      </View>

      <Text style={dealStyles.orderDescription} numberOfLines={3}>
        {order.description}
      </Text>

      <View style={dealStyles.orderInfo}>
        <View style={dealStyles.infoRow}>
          <Ionicons name="person" size={16} color={styles.colors.actionGray} />
          <Text style={dealStyles.infoText}>
            {order.customer?.name || t('Unknown')}
          </Text>
        </View>

        <View style={dealStyles.infoRow}>
          <Ionicons
            name="location"
            size={16}
            color={styles.colors.actionGray}
          />
          <Text style={dealStyles.infoText}>{order.city}</Text>
        </View>

        <View style={dealStyles.infoRow}>
          <Ionicons name="cash" size={16} color={styles.colors.actionGray} />
          <Text style={dealStyles.infoText}>
            {t('Budget')}: {formatPrice(order.max_amount)}
          </Text>
        </View>

        <View style={dealStyles.infoRow}>
          <Ionicons
            name="trending-up"
            size={16}
            color={styles.colors.primary}
          />
          <Text
            style={[
              dealStyles.infoText,
              {color: styles.colors.primary, fontWeight: '600'},
            ]}>
            {t('Potential commission')}:{' '}
            {formatPrice(order.potential_commission)}
          </Text>
        </View>
      </View>

      <Text style={dealStyles.dateText}>
        {new Date(order.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={dealStyles.container}>
        <HeaderBack title={t('My Deals')} action={goBack} center={false} />
        <LoadingComponent text={t('Loading...')} />
      </View>
    );
  }

  return (
    <View style={dealStyles.container}>
      <HeaderBack title={t('My Deals')} action={goBack} center={false} />

      {/* Табы */}
      <View style={dealStyles.tabsContainer}>
        <TouchableOpacity
          style={[
            dealStyles.tab,
            activeTab === 'active' && dealStyles.activeTab,
          ]}
          onPress={() => setActiveTab('active')}>
          <Text
            style={[
              dealStyles.tabText,
              activeTab === 'active' && dealStyles.activeTabText,
            ]}>
            {t('Active Deals')} ({deals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dealStyles.tab,
            activeTab === 'available' && dealStyles.activeTab,
          ]}
          onPress={() => setActiveTab('available')}>
          <Text
            style={[
              dealStyles.tabText,
              activeTab === 'available' && dealStyles.activeTabText,
            ]}>
            {t('Available Orders')} ({availableOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={dealStyles.scrollView}
        contentContainerStyle={dealStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {activeTab === 'active' ? (
          deals.length > 0 ? (
            deals.map(renderActiveDeal)
          ) : (
            <View style={dealStyles.emptyContainer}>
              <Ionicons
                name="briefcase-outline"
                size={64}
                color={styles.colors.actionGray}
              />
              <Text style={dealStyles.emptyTitle}>{t('No Active Deals')}</Text>
              <Text style={dealStyles.emptySubtitle}>
                {t('Take some orders to start earning commissions')}
              </Text>
            </View>
          )
        ) : availableOrders.length > 0 ? (
          availableOrders.map(renderAvailableOrder)
        ) : (
          <View style={dealStyles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={64}
              color={styles.colors.actionGray}
            />
            <Text style={dealStyles.emptyTitle}>
              {t('No Available Orders')}
            </Text>
            <Text style={dealStyles.emptySubtitle}>
              {t('Check back later for new opportunities')}
            </Text>
          </View>
        )}

        <View style={dealStyles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const dealStyles = StyleSheet.create({
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: styles.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: styles.colors.primary,
  },
  tabText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    fontWeight: '500',
  },
  activeTabText: {
    color: styles.colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: styles.paddingHorizontal,
    paddingTop: 16,
  },

  // Стили для активных сделок
  dealCard: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealTitle: {
    flex: 1,
    fontSize: styles.fonSize.md,
    fontWeight: '600',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.md,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.white,
    fontWeight: '500',
    lineHeight: styles.lineHeight.xs,
  },
  dealInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: styles.lineHeight.sm,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: styles.colors.border,
  },
  dateText: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
  },

  // Стили для доступных заказов
  orderCard: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderTitle: {
    flex: 1,
    fontSize: styles.fonSize.md,
    fontWeight: '600',
    color: styles.colors.titles,
    lineHeight: styles.lineHeight.md,
    marginRight: 12,
  },
  takeButton: {
    backgroundColor: styles.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  takeButtonText: {
    color: styles.colors.white,
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    lineHeight: styles.lineHeight.sm,
  },
  orderDescription: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: styles.lineHeight.sm,
    marginBottom: 12,
  },
  orderInfo: {
    marginBottom: 12,
  },

  // Пустое состояние
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
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
});
