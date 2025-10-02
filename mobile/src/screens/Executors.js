import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import styles from '../styles';
import {api} from '../services';
import {useSelector} from 'react-redux';
import {notifyError} from '../services/notify';
import {getAvatarUrl} from '../config';
import {LoadingComponent} from './Loading';

const Executors = ({navigation}) => {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const [executors, setExecutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, rating, orders_count
  const [sortDirection, setSortDirection] = useState('asc'); // asc, desc
  const [filterRating, setFilterRating] = useState(0); // 0 = all, 1-5 = minimum rating

  const fetchExecutors = async () => {
    try {
      setLoading(true);
      const response = await api.request({
        method: 'GET',
        url: '/executors',
        params: {
          search: searchQuery,
          sort_by: sortBy,
          sort_direction: sortDirection,
          min_rating: filterRating > 0 ? filterRating : null,
        },
      });

      if (response.success) {
        setExecutors(response.result || response.data || []);
      } else {
        notifyError(response.message || t('Failed to load executors'));
      }
    } catch (error) {
      console.error('Error fetching executors:', error);
      notifyError(t('Failed to load executors'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutors();
  }, [searchQuery, sortBy, sortDirection, filterRating]);

  const handleSort = field => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const renderExecutorCard = executor => {
    return (
      <TouchableOpacity
        key={executor.id}
        style={localStyles.executorCard}
        onPress={() => {
          // Обычный просмотр профиля исполнителя - НЕ из заказа
          navigation.navigate('WorkerProfile', {executorId: executor.id});
        }}>
        {/* Avatar and basic info */}
        <View style={localStyles.executorHeader}>
          <View style={localStyles.avatarContainer}>
            {executor.avatar ? (
              <Image
                source={{uri: getAvatarUrl(executor.avatar)}}
                style={localStyles.avatar}
              />
            ) : (
              <View style={localStyles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
            )}
          </View>

          <View style={localStyles.executorInfo}>
            <Text style={localStyles.executorName}>{executor.name}</Text>

            {/* Rating */}
            <View style={localStyles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={localStyles.ratingText}>
                {executor.average_rating &&
                typeof executor.average_rating === 'number'
                  ? executor.average_rating.toFixed(1)
                  : '0.0'}
              </Text>
              <Text style={localStyles.reviewsCount}>
                ({executor.reviews_count || 0} {t('reviews')})
              </Text>
            </View>

            {/* Orders count */}
            <Text style={localStyles.ordersCount}>
              {executor.orders_count || 0} {t('completed orders')}
            </Text>
          </View>
        </View>

        {/* Contact info (for mediators) */}
        <View style={localStyles.contactInfo}>
          <View style={localStyles.contactRow}>
            <Ionicons name="call" size={16} color={styles.colors.primary} />
            <Text style={localStyles.contactText}>{executor.phone}</Text>
          </View>

          <View style={localStyles.contactRow}>
            <Ionicons name="mail" size={16} color={styles.colors.primary} />
            <Text style={localStyles.contactText}>{executor.email}</Text>
          </View>
        </View>

        {/* Categories */}
        {executor.categories && executor.categories.length > 0 && (
          <View style={localStyles.categoriesContainer}>
            <Text style={localStyles.categoriesLabel}>{t('Categories')}:</Text>
            <View style={localStyles.categoriesList}>
              {executor.categories.slice(0, 3).map((category, index) => (
                <View key={index} style={localStyles.categoryTag}>
                  <Text style={localStyles.categoryText}>{category}</Text>
                </View>
              ))}
              {executor.categories.length > 3 && (
                <Text style={localStyles.moreCategories}>
                  +{executor.categories.length - 3} {t('more')}
                </Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSortButton = (field, label) => {
    const isActive = sortBy === field;
    return (
      <TouchableOpacity
        style={[
          localStyles.sortButton,
          isActive && localStyles.sortButtonActive,
        ]}
        onPress={() => handleSort(field)}>
        <Text
          style={[
            localStyles.sortButtonText,
            isActive && localStyles.sortButtonTextActive,
          ]}>
          {label}
        </Text>
        {isActive && (
          <Ionicons
            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#fff"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderRatingFilter = () => {
    return (
      <View style={localStyles.ratingFilter}>
        <Text style={localStyles.filterLabel}>{t('Min Rating')}:</Text>
        <View style={localStyles.ratingButtons}>
          {[0, 1, 2, 3, 4, 5].map(rating => (
            <TouchableOpacity
              key={rating}
              style={[
                localStyles.ratingButton,
                filterRating === rating && localStyles.ratingButtonActive,
              ]}
              onPress={() => setFilterRating(rating)}>
              <Text
                style={[
                  localStyles.ratingButtonText,
                  filterRating === rating && localStyles.ratingButtonTextActive,
                ]}>
                {rating === 0 ? t('All') : `${rating}+`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={localStyles.container}>
      {/* Header */}
      <HeaderBack
        title={t('Executors')}
        action={() => navigation.goBack()}
        center={true}
      />

      {/* Search */}
      <View style={localStyles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={localStyles.searchInput}
          placeholder={t('Search executors...')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      {/* Filters and Sorting */}
      <View style={localStyles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={localStyles.sortContainer}>
            {renderSortButton('name', t('Name'))}
            {renderSortButton('rating', t('Rating'))}
            {renderSortButton('orders_count', t('Orders'))}
          </View>
        </ScrollView>
      </View>

      {/* Rating Filter */}
      {renderRatingFilter()}

      {/* Executors List */}
      <ScrollView
        style={localStyles.executorsList}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingComponent
            showLogo={false}
            text={t('Loading executors...')}
            style={{paddingVertical: 40}}
          />
        ) : executors.length > 0 ? (
          executors.map(renderExecutorCard)
        ) : (
          <View style={localStyles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={localStyles.emptyText}>{t('No executors found')}</Text>
            <Text style={localStyles.emptySubtext}>
              {t('Try adjusting your search or filters')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: styles.colors.white,
    marginHorizontal: styles.paddingHorizontal,
    marginTop: 12,
    marginBottom: 24, // Между блоками
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8, // Внутри блока
    fontSize: 14,
    color: styles.colors.black,
    paddingVertical: 0,
  },
  filtersContainer: {
    paddingHorizontal: styles.paddingHorizontal,
    marginBottom: 24, // Между блоками
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 12, // Между элементами
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: styles.colors.grayLight,
    borderRadius: 20,
    gap: 8, // Внутри блока
  },
  sortButtonActive: {
    backgroundColor: styles.colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: styles.colors.regular,
  },
  sortButtonTextActive: {
    color: styles.colors.white,
  },
  ratingFilter: {
    paddingHorizontal: styles.paddingHorizontal,
    marginBottom: 24, // Между блоками
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: styles.colors.black,
    marginBottom: 12, // Между элементами
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 12, // Между элементами
  },
  ratingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: styles.colors.grayLight,
    borderRadius: 15,
  },
  ratingButtonActive: {
    backgroundColor: styles.colors.primary,
  },
  ratingButtonText: {
    fontSize: 12,
    color: styles.colors.regular,
  },
  ratingButtonTextActive: {
    color: styles.colors.white,
  },
  executorsList: {
    flex: 1,
    paddingHorizontal: styles.paddingHorizontal,
  },
  executorCard: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24, // Между блоками
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  executorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12, // Между элементами
  },
  avatarContainer: {
    marginRight: 12, // Между элементами
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  executorInfo: {
    flex: 1,
  },
  executorName: {
    fontSize: 16,
    fontWeight: '500',
    color: styles.colors.black,
    marginBottom: 8, // Внутри блока
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Внутри блока
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: styles.colors.black,
    marginLeft: 8, // Внутри блока
  },
  reviewsCount: {
    fontSize: 12,
    color: styles.colors.regular,
    marginLeft: 8, // Внутри блока
  },
  ordersCount: {
    fontSize: 12,
    color: styles.colors.regular,
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: styles.colors.border,
    paddingTop: 12, // Между элементами
    marginBottom: 12, // Между элементами
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Внутри блока
  },
  contactText: {
    fontSize: 14,
    color: styles.colors.black,
    marginLeft: 8, // Внутри блока
  },
  categoriesContainer: {
    borderTopWidth: 1,
    borderTopColor: styles.colors.border,
    paddingTop: 12, // Между элементами
  },
  categoriesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: styles.colors.regular,
    marginBottom: 8, // Внутри блока
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // Внутри блока
  },
  categoryTag: {
    backgroundColor: styles.colors.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    color: styles.colors.regular,
  },
  moreCategories: {
    fontSize: 11,
    color: styles.colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: styles.colors.regular,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: styles.colors.regular,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: styles.colors.regular,
    textAlign: 'center',
  },
});

export default Executors;
