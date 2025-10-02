import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import CustomerOrderCard from '../components/CustomerOrderCard';
import useArchivedOrders from '../hooks/useArchivedOrders';
import styles from '../styles';
import {LoadingComponent} from './Loading';

export default function ArchivedOrders({navigation}) {
  const {t} = useTranslation();
  const {
    orders,
    loading,
    refreshing,
    error,
    hasMore,
    loadingMore,
    loadMore,
    refresh,
    retry,
  } = useArchivedOrders();

  const goBack = () => {
    navigation.goBack();
  };

  const navigateToOrder = orderId => {
    navigation.navigate('Order', {orderId});
  };

  const renderOrder = ({item}) => (
    <CustomerOrderCard
      key={item.id}
      order={item}
      onPress={() => navigateToOrder(item.id)}
      showArchiveStatus={true}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={localStyles.footer}>
        <ActivityIndicator size="small" color={styles.colors.primary} />
        <Text style={localStyles.footerText}>{t('Loading more...')}</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={localStyles.emptyContainer}>
        <Text style={localStyles.emptyTitle}>{t('No archived orders')}</Text>
        <Text style={localStyles.emptySubtitle}>
          {t('Completed orders will appear here')}
        </Text>
      </View>
    );
  };

  const renderError = () => (
    <View style={localStyles.errorContainer}>
      <Text style={localStyles.errorTitle}>{t('Error')}</Text>
      <Text style={localStyles.errorText}>{error}</Text>
      <TouchableOpacity style={localStyles.retryButton} onPress={retry}>
        <Text style={localStyles.retryButtonText}>{t('Retry')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={localStyles.container}>
        <HeaderBack title={t('Archived Orders')} action={goBack} />
        <LoadingComponent text={t('Loading...')} />
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <HeaderBack title={t('Archived Orders')} action={goBack} />

      {error ? (
        renderError()
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={localStyles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
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
  listContainer: {
    paddingHorizontal: styles.paddingHorizontal,
    paddingTop: 16,
    paddingBottom: 100,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.red,
    marginBottom: 8,
  },
  errorText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: styles.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: styles.colors.white,
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
  },
});
