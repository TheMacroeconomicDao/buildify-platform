import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Image,
  Linking,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import styles from '../styles';
import HeaderBack from '../headers/HeaderBack';
import Text from '../components/Text';
import StandardInput from '../components/StandardInput';
import StandardButton from '../components/StandardButton';
import {api, retryApiCall} from '../services';
import {notifyError, notifySuccess} from '../services/notify';
import {LoadingComponent} from './Loading';
import {formatPrice} from '../services/utils';

export default function MediatorExecutorSearch({navigation, route}) {
  const {t} = useTranslation();
  const {orderId, orderData, onSelectExecutor} = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [executors, setExecutors] = useState([]);
  const [filteredExecutors, setFilteredExecutors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  // Загрузка исполнителей
  const loadExecutors = async () => {
    try {
      setLoading(true);

      // Загружаем исполнителей по категории заказа
      const response = await retryApiCall(() =>
        api.user.getExecutors({
          search: '',
          sort_by: 'rating',
          sort_direction: 'desc',
          limit: 50,
        }),
      );

      if (response.success && response.result) {
        setExecutors(response.result.data || response.result);
        setFilteredExecutors(response.result.data || response.result);
      } else {
        notifyError(t('Error'), t('Failed to load executors'));
      }
    } catch (error) {
      console.error('Error loading executors:', error);
      notifyError(t('Error'), t('Failed to load executors'));
    } finally {
      setLoading(false);
    }
  };

  // Загрузка категорий
  const loadCategories = async () => {
    try {
      const response = await retryApiCall(() => api.user.getAppSettings());
      if (response.success && response.result?.direction_work) {
        setCategories(response.result.direction_work);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Фильтрация исполнителей
  useEffect(() => {
    let filtered = executors;

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        executor =>
          executor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          executor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          executor.phone?.includes(searchQuery),
      );
    }

    // Фильтр по категории
    if (selectedCategory) {
      filtered = filtered.filter(executor =>
        executor.categories?.some(category =>
          category.toLowerCase().includes(selectedCategory.name.toLowerCase()),
        ),
      );
    }

    setFilteredExecutors(filtered);
  }, [searchQuery, selectedCategory, executors]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExecutors();
    setRefreshing(false);
  };

  const handleSelectExecutor = executor => {
    if (onSelectExecutor) {
      onSelectExecutor({
        id: executor.id,
        name: executor.name,
        phone: executor.phone,
        email: executor.email,
        rating: executor.executor_rating,
        avatar: executor.avatar,
      });
    }
    navigation.goBack();
  };

  const handleCallExecutor = phone => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const renderExecutorCard = ({item: executor}) => (
    <View style={localStyles.executorCard}>
      {/* Аватар и основная информация */}
      <View style={localStyles.executorHeader}>
        <Image
          source={{
            uri: executor.avatar || 'https://via.placeholder.com/60',
          }}
          style={localStyles.avatar}
        />
        <View style={localStyles.executorInfo}>
          <Text style={localStyles.executorName}>{executor.name}</Text>
          <Text style={localStyles.executorPhone}>{executor.phone}</Text>
          {executor.email && (
            <Text style={localStyles.executorEmail}>{executor.email}</Text>
          )}
        </View>
        <View style={localStyles.ratingContainer}>
          <Text style={localStyles.rating}>
            ⭐{' '}
            {executor.average_rating &&
            typeof executor.average_rating === 'number'
              ? executor.average_rating.toFixed(1)
              : 'N/A'}
          </Text>
          <Text style={localStyles.reviewsCount}>
            ({executor.reviews_count || 0})
          </Text>
        </View>
      </View>

      {/* Статистика */}
      <View style={localStyles.statsContainer}>
        <View style={localStyles.statItem}>
          <Text style={localStyles.statValue}>
            {executor.orders_count || 0}
          </Text>
          <Text style={localStyles.statLabel}>{t('Orders')}</Text>
        </View>
        <View style={localStyles.statItem}>
          <Text style={localStyles.statValue}>
            {executor.reviews_count || 0}
          </Text>
          <Text style={localStyles.statLabel}>{t('Reviews')}</Text>
        </View>
        <View style={localStyles.statItem}>
          <Text style={localStyles.statValue}>
            {executor.works?.length || 0}
          </Text>
          <Text style={localStyles.statLabel}>{t('Categories')}</Text>
        </View>
      </View>

      {/* Категории работ */}
      {executor.categories && executor.categories.length > 0 && (
        <View style={localStyles.categoriesContainer}>
          <Text style={localStyles.categoriesTitle}>
            {t('Specializations')}:
          </Text>
          <View style={localStyles.categoriesList}>
            {executor.categories.slice(0, 3).map((category, index) => (
              <View key={index} style={localStyles.categoryTag}>
                <Text style={localStyles.categoryText}>{category}</Text>
              </View>
            ))}
            {executor.categories.length > 3 && (
              <View style={localStyles.categoryTag}>
                <Text style={localStyles.categoryText}>
                  +{executor.categories.length - 3}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Кнопки действий */}
      <View style={localStyles.actionsContainer}>
        <TouchableOpacity
          style={[localStyles.actionButton, localStyles.callButton]}
          onPress={() => handleCallExecutor(executor.phone)}>
          <Text style={localStyles.callButtonText}>{t('Call')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.actionButton, localStyles.selectButton]}
          onPress={() => handleSelectExecutor(executor)}>
          <Text style={localStyles.selectButtonText}>{t('Select')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={localStyles.categoriesFilter}
      contentContainerStyle={localStyles.categoriesFilterContent}>
      <TouchableOpacity
        style={[
          localStyles.categoryFilterItem,
          !selectedCategory && localStyles.categoryFilterItemActive,
        ]}
        onPress={() => setSelectedCategory(null)}>
        <Text
          style={[
            localStyles.categoryFilterText,
            !selectedCategory && localStyles.categoryFilterTextActive,
          ]}>
          {t('All')}
        </Text>
      </TouchableOpacity>

      {categories.map(category => (
        <TouchableOpacity
          key={category.key}
          style={[
            localStyles.categoryFilterItem,
            selectedCategory?.id === category.key &&
              localStyles.categoryFilterItemActive,
          ]}
          onPress={() =>
            setSelectedCategory({id: category.key, name: category.name})
          }>
          <Text
            style={[
              localStyles.categoryFilterText,
              selectedCategory?.id === category.key &&
                localStyles.categoryFilterTextActive,
            ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  useEffect(() => {
    loadExecutors();
    loadCategories();
  }, []);

  if (loading) {
    return (
      <View style={localStyles.container}>
        <HeaderBack
          action={() => navigation.goBack()}
          title={t('Search Executors')}
        />
        <LoadingComponent text={t('Loading executors...')} />
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <HeaderBack
        action={() => navigation.goBack()}
        title={t('Search Executors')}
      />

      {/* Поиск */}
      <View style={localStyles.searchContainer}>
        <StandardInput
          placeholder={t('Search by name, phone, email...')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={localStyles.searchInput}
        />
      </View>

      {/* Фильтр по категориям */}
      {renderCategoryFilter()}

      {/* Информация о заказе */}
      {orderData && (
        <View style={localStyles.orderInfo}>
          <Text style={localStyles.orderInfoTitle}>
            {t('Order')}: {orderData.title}
          </Text>
          <Text style={localStyles.orderInfoBudget}>
            {t('Budget')}: {formatPrice(orderData.max_amount)} AED
          </Text>
        </View>
      )}

      {/* Список исполнителей */}
      <FlatList
        data={filteredExecutors}
        renderItem={renderExecutorCard}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={localStyles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>
              {searchQuery.trim()
                ? t('No executors found for your search')
                : t('No executors available')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const localStyles = {
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: styles.colors.textSecondary,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: styles.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  searchInput: {
    marginBottom: 0,
  },
  categoriesFilter: {
    backgroundColor: styles.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
    maxHeight: 70,
  },
  categoriesFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    maxHeight: 62,
  },
  categoryFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: styles.colors.background,
    borderWidth: 1,
    borderColor: styles.colors.border,
  },
  categoryFilterItemActive: {
    backgroundColor: styles.colors.primary,
    borderColor: styles.colors.primary,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: styles.colors.textSecondary,
  },
  categoryFilterTextActive: {
    color: styles.colors.white,
  },
  orderInfo: {
    backgroundColor: styles.colors.primaryLight,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  orderInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.primary,
    marginBottom: 4,
  },
  orderInfoBudget: {
    fontSize: 14,
    fontWeight: '500',
    color: styles.colors.primary,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  executorCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  executorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: styles.colors.background,
  },
  executorInfo: {
    flex: 1,
    gap: 4,
  },
  executorName: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.black,
  },
  executorPhone: {
    fontSize: 14,
    fontWeight: '500',
    color: styles.colors.primary,
  },
  executorEmail: {
    fontSize: 12,
    fontWeight: '400',
    color: styles.colors.textSecondary,
  },
  ratingContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: styles.colors.black,
  },
  reviewsCount: {
    fontSize: 12,
    fontWeight: '400',
    color: styles.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: styles.colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: styles.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: styles.colors.textSecondary,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: styles.colors.black,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: styles.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: styles.colors.primary,
  },
  actionsContainer: {
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
  },
  callButton: {
    backgroundColor: styles.colors.white,
    borderWidth: 1,
    borderColor: styles.colors.primary,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: styles.colors.primary,
  },
  selectButton: {
    backgroundColor: styles.colors.primary,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: styles.colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: styles.colors.textSecondary,
    textAlign: 'center',
  },
};
