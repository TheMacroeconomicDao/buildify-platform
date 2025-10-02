import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import styles from '../styles';
import Text from '../components/Text';
import {useTranslation} from 'react-i18next';
import HeaderBack from '../headers/HeaderBack';
import OrderMiniCard from '../components/OrderMiniCard';
import VerificationWarning from '../components/VerificationWarning';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useSearchOrders from '../hooks/useSearchOrders';
import useVerification from '../hooks/useVerification';
import {LoadingComponent} from './Loading';

const SearchOrders = ({navigation}) => {
  const {t} = useTranslation();
  const {
    orders,
    loading,
    loadingMore,
    page,
    sortType,
    sortDirection,
    error,
    toggleSort,
    loadMore,
    navigateToOrder,
    retryFetch,
    handleScroll,
  } = useSearchOrders();

  const {needsVerification, canRespondToOrders, getVerificationMessage} =
    useVerification();

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={{paddingVertical: 20}}>
        <ActivityIndicator size="small" color={styles.colors.primary} />
      </View>
    );
  };

  if (loading && page === 1) {
    return <LoadingComponent text={t('Loading...')} />;
  }

  return (
    <View style={{flex: 1, backgroundColor: styles.colors.background}}>
      <ScrollView
        style={localStyles.container}
        contentContainerStyle={{
          paddingHorizontal: styles.paddingHorizontal,
          paddingVertical: 20,
          alignItems: 'center',
        }}
        onScroll={({nativeEvent}) => handleScroll({nativeEvent})}
        scrollEventThrottle={400}>
        <HeaderBack title={t('Search orders')} no_back center />

        {/* Verification Warning */}
        {needsVerification &&
          (() => {
            const verificationMessage = getVerificationMessage();
            return verificationMessage ? (
              <VerificationWarning
                title={verificationMessage.title}
                message={verificationMessage.message}
                type={verificationMessage.type}
                actionText={t('Go to profile')}
                onActionPress={() => navigation.navigate('PersonalData')}
                style={{marginHorizontal: 16, marginBottom: 16}}
              />
            ) : null;
          })()}

        <View style={localStyles.infoContainer}>
          <Text style={localStyles.infoText}>
            {t(
              'Orders are displayed in your selected service categories. You can edit them in your profile',
            )}
          </Text>
          <TouchableOpacity
            style={localStyles.profileButton}
            onPress={() => navigation.navigate('PersonalData')}>
            <Text style={localStyles.profileButtonText}>{t('Profile')}</Text>
          </TouchableOpacity>
        </View>

        <View style={localStyles.sortContainer}>
          <Text style={localStyles.sectionTitle}>{t('Sort')}</Text>
          <View style={localStyles.sortButtons}>
            <TouchableOpacity
              style={[
                localStyles.sortButton,
                sortType === 'created_at' && localStyles.activeSortButton,
              ]}
              onPress={() => toggleSort('created_at')}>
              <Text
                style={[
                  localStyles.sortText,
                  sortType === 'created_at' && localStyles.activeSortButtonText,
                ]}>
                {t('By date')}
              </Text>
              {sortType === 'created_at' && (
                <Ionicons
                  name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={styles.colors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                localStyles.sortButton,
                sortType === 'max_amount' && localStyles.activeSortButton,
              ]}
              onPress={() => toggleSort('max_amount')}>
              <Text
                style={[
                  localStyles.sortText,
                  sortType === 'max_amount' && localStyles.activeSortButtonText,
                ]}>
                {t('By price')}
              </Text>
              {sortType === 'max_amount' && (
                <Ionicons
                  name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={styles.colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {!canRespondToOrders ? (
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>
              {t('Complete verification to access orders')}
            </Text>
            <Text style={localStyles.emptySubText}>
              {t('Upload your license to start working with orders')}
            </Text>
          </View>
        ) : error ? (
          <View style={localStyles.errorContainer}>
            <Text style={localStyles.errorText}>{error}</Text>
            <TouchableOpacity
              style={localStyles.retryButton}
              onPress={retryFetch}>
              <Text style={localStyles.retryText}>{t('Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>
              {t('There are no orders in your selected categories')}
            </Text>
            <Text style={localStyles.emptySubText}>
              {t('Check orders later or update categories in profile')}
            </Text>
          </View>
        ) : (
          <View style={localStyles.ordersContainer}>
            {orders.map(order => (
              <OrderMiniCard
                key={order.id}
                order={order}
                onPress={() => navigateToOrder(order.id)}
              />
            ))}
            {renderFooter()}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    color: styles.colors.regular,
    marginBottom: 12,
  },
  profileButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: styles.colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: styles.colors.primary,
  },
  profileButtonText: {
    color: styles.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sortContainer: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: styles.colors.black,
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortButton: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: styles.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: styles.colors.border,
  },
  activeSortButton: {
    borderColor: styles.colors.primary,
  },
  sortButtonText: {
    color: styles.colors.regular,
    fontWeight: 'bold',
    marginRight: 5,
  },
  activeSortButtonText: {
    color: styles.colors.primary,
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: styles.colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: styles.colors.gray,
    textAlign: 'center',
  },
  ordersContainer: {
    width: '100%',
    rowGap: 10,
  },
  errorContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: styles.colors.red,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: styles.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: styles.colors.white,
  },
  activeSort: {
    backgroundColor: styles.colors.primary,
  },
  sortText: {
    color: styles.colors.black,
    marginRight: 5,
  },
  activeSortText: {
    color: styles.colors.white,
  },
});

export default SearchOrders;
