import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HeaderBack from '../headers/HeaderBack';
import {useTranslation} from 'react-i18next';
import config, {getAvatarUrl} from '../config';
import styles from '../styles';
import {api, retryApiCall} from '../services';
import ReportUserModal from '../Modals/ReportUserModal';
import {LoadingComponent} from './Loading';

export default function CustomerProfile({navigation, route}) {
  const {
    customerId,
    customerContacts,
    hasResponded,
    contactsAvailable,
    responseStatus,
  } = route.params || {};
  const {t} = useTranslation();

  const [customerData, setCustomerData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // Функция для проверки, должны ли контакты быть видимыми
  const shouldShowContacts = () => {
    // Если нет информации о статусе отклика, показываем контакты (для обратной совместимости)
    if (responseStatus === undefined) {
      return true;
    }

    // Контакты заказчика видны исполнителю только если заказчик отправил свои контакты (status >= 2)
    return responseStatus >= 2;
  };

  useEffect(() => {
    // Всегда загружаем актуальные данные пользователя через API
    // так как контакты в заказе могут быть устаревшими
    console.log(
      'CustomerProfile: Loading fresh customer data from API for ID:',
      customerId,
    );
    console.log('CustomerProfile: Response status:', responseStatus);
    console.log('CustomerProfile: Should show contacts:', shouldShowContacts());
    loadCustomerProfile();
  }, [customerId]);

  // Функция для звонка
  const handleCall = async phoneNumber => {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);

      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          t('Error'),
          t('Phone calls are not supported on this device'),
        );
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert(t('Error'), t('Failed to make phone call'));
    }
  };

  // Функция для отправки сообщения
  const handleMessage = async phoneNumber => {
    try {
      const smsUrl = `sms:${phoneNumber}`;
      const supported = await Linking.canOpenURL(smsUrl);

      if (supported) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert(t('Error'), t('SMS is not supported on this device'));
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert(t('Error'), t('Failed to send message'));
    }
  };

  const loadCustomerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading customer profile for ID:', customerId);

      if (!customerId) {
        setError('Customer ID is required');
        return;
      }

      // Загружаем полные данные пользователя и отзывы параллельно
      const [userResponse, reviewsResponse] = await Promise.all([
        retryApiCall(() => api.user.apiUserGet(customerId)),
        retryApiCall(() => api.customerReviews.getCustomerReviews(customerId)),
      ]);

      console.log('User response:', userResponse);
      console.log('Reviews response:', reviewsResponse);

      if (userResponse.success && userResponse.result) {
        console.log('CustomerProfile: Loaded user data:', userResponse.result);
        console.log(
          'CustomerProfile: Passed contacts from order:',
          customerContacts,
        );
        console.log('CustomerProfile: Access rights:', {
          hasResponded,
          contactsAvailable,
          canViewContacts: hasResponded && contactsAvailable,
        });

        // Объединяем данные пользователя с контактами из заказа
        const mergedData = {
          ...userResponse.result,
          // Используем контакты из заказа только если есть права доступа
          ...(hasResponded && contactsAvailable && customerContacts
            ? customerContacts
            : {}),
        };

        console.log('CustomerProfile: Final merged data:', mergedData);
        setCustomerData(mergedData);
      } else {
        console.error('Failed to load user data:', userResponse);
        setError('Failed to load customer data');
        return;
      }

      if (reviewsResponse.success && reviewsResponse.result) {
        setReviews(reviewsResponse.result.reviews || []);
      } else {
        console.warn('Failed to load reviews:', reviewsResponse);
        setReviews([]); // Установим пустой массив если отзывы не загрузились
      }
    } catch (err) {
      console.error('Error loading customer profile:', err);
      setError('Error loading customer profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (rating, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color={i <= rating ? '#FFD700' : '#E0E0E0'}
          style={{marginRight: 2}}
        />,
      );
    }
    return <View style={{flexDirection: 'row'}}>{stars}</View>;
  };

  const renderReviewItem = (review, index) => (
    <View key={index} style={localStyles.reviewItem}>
      <View style={localStyles.reviewHeader}>
        {review.executor?.avatar ? (
          <Image
            source={{uri: getAvatarUrl(review.executor.avatar)}}
            style={localStyles.reviewerAvatar}
          />
        ) : (
          <View style={localStyles.reviewerAvatarPlaceholder}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
        )}
        <Text style={localStyles.reviewerName}>
          {review.executor?.name || t('Anonymous')}
        </Text>
      </View>
      <Text style={localStyles.reviewText} numberOfLines={3}>
        {review.comment || t('No comment provided')}
      </Text>
      {review.comment && review.comment.length > 100 && (
        <TouchableOpacity>
          <Text style={localStyles.readMoreText}>{t('Read more')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <LoadingComponent text={t('Loading...')} />
      </View>
    );
  }

  if (error || !customerData) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <Ionicons name="alert-circle" size={50} color={styles.colors.red} />
        <Text
          style={{
            marginTop: 10,
            color: styles.colors.black,
            textAlign: 'center',
          }}>
          {error || t('Customer not found')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: styles.colors.background}}>
      <HeaderBack
        action={() => navigation.goBack()}
        title={customerData.name || t('Customer')}
      />

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        {/* Основная карточка заказчика */}
        <View style={localStyles.profileBlock}>
          {customerData.avatar ? (
            <Image
              source={{uri: getAvatarUrl(customerData.avatar)}}
              style={localStyles.avatar}
            />
          ) : (
            <View style={localStyles.avatarPlaceholder}>
              <Ionicons name="person" size={30} color="#3579F5" />
            </View>
          )}

          <View style={localStyles.profileInfo}>
            <Text style={localStyles.customerName}>
              {customerData.name || t('Customer')}
            </Text>

            <Text style={localStyles.ordersCount}>
              {customerData.customer_orders_count || 0} {t('orders')}
            </Text>

            <View style={localStyles.ratingContainer}>
              <View style={localStyles.ratingBlock}>
                <Ionicons name="star" size={16} color="#FFEA49" />
                <Text style={localStyles.ratingText}>
                  {customerData.customer_rating &&
                  typeof customerData.customer_rating === 'number'
                    ? customerData.customer_rating.toFixed(1)
                    : '0.0'}
                </Text>
              </View>
              <View style={localStyles.reviewsBlock}>
                <Ionicons name="people" size={16} color="#8A94A0" />
                <Text style={localStyles.reviewsText}>
                  {customerData.customer_reviews_count || 0} {t('reviews')}
                </Text>
              </View>
            </View>

            {/* Контактная информация */}
            {shouldShowContacts() &&
            (customerData.phone?.trim() ||
              customerData.email?.trim() ||
              customerData.telegram?.trim() ||
              customerData.whatsApp?.trim() ||
              customerData.facebook?.trim() ||
              customerData.viber?.trim()) ? (
              <View style={localStyles.contactsSection}>
                <Text style={localStyles.contactsTitle}>{t('Contacts')}</Text>

                {customerData.phone?.trim() && (
                  <View style={localStyles.contactItem}>
                    <Ionicons
                      name="call"
                      size={16}
                      color={styles.colors.primary}
                    />
                    <Text style={localStyles.contactText}>
                      {customerData.phone}
                    </Text>
                  </View>
                )}

                {customerData.email?.trim() && (
                  <View style={localStyles.contactItem}>
                    <Ionicons
                      name="mail"
                      size={16}
                      color={styles.colors.primary}
                    />
                    <Text style={localStyles.contactText}>
                      {customerData.email}
                    </Text>
                  </View>
                )}

                {customerData.telegram?.trim() && (
                  <View style={localStyles.contactItem}>
                    <Ionicons
                      name="send"
                      size={16}
                      color={styles.colors.primary}
                    />
                    <Text style={localStyles.contactText}>
                      {customerData.telegram}
                    </Text>
                  </View>
                )}

                {customerData.whatsApp?.trim() && (
                  <View style={localStyles.contactItem}>
                    <Ionicons
                      name="logo-whatsapp"
                      size={16}
                      color={styles.colors.primary}
                    />
                    <Text style={localStyles.contactText}>
                      {customerData.whatsApp}
                    </Text>
                  </View>
                )}

                {customerData.facebook?.trim() && (
                  <View style={localStyles.contactItem}>
                    <Ionicons
                      name="logo-facebook"
                      size={16}
                      color={styles.colors.primary}
                    />
                    <Text style={localStyles.contactText}>
                      {customerData.facebook}
                    </Text>
                  </View>
                )}

                {customerData.viber?.trim() && (
                  <View style={localStyles.contactItem}>
                    <Ionicons
                      name="call"
                      size={16}
                      color={styles.colors.primary}
                    />
                    <Text style={localStyles.contactText}>
                      Viber: {customerData.viber}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              // Показываем сообщение, если контакты недоступны
              !shouldShowContacts() && (
                <View style={localStyles.contactsSection}>
                  <Text style={localStyles.contactsTitle}>{t('Contacts')}</Text>
                  <View style={localStyles.contactsUnavailable}>
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color={styles.colors.gray}
                    />
                    <Text style={localStyles.contactsUnavailableText}>
                      {t('Customer needs to send their contacts first')}
                    </Text>
                  </View>
                </View>
              )
            )}

            {/* Кнопки действий */}
            <View style={localStyles.actionButtons}>
              {shouldShowContacts() && customerData.phone?.trim() && (
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => handleCall(customerData.phone)}>
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={localStyles.actionButtonText}>{t('Call')}</Text>
                </TouchableOpacity>
              )}

              {shouldShowContacts() && customerData.phone?.trim() && (
                <TouchableOpacity
                  style={[
                    localStyles.actionButton,
                    localStyles.secondaryButton,
                  ]}
                  onPress={() => handleMessage(customerData.phone)}>
                  <Ionicons
                    name="chatbubble"
                    size={16}
                    color={styles.colors.primary}
                  />
                  <Text
                    style={[
                      localStyles.actionButtonText,
                      localStyles.secondaryButtonText,
                    ]}>
                    {t('Message')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Кнопка жалобы */}
              <TouchableOpacity
                style={[localStyles.actionButton, localStyles.reportButton]}
                onPress={() => setIsReportModalVisible(true)}>
                <Ionicons name="flag" size={16} color="#FF3B30" />
                <Text
                  style={[
                    localStyles.actionButtonText,
                    localStyles.reportButtonText,
                  ]}>
                  {t('Report')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Блок отзывов */}
        <View style={localStyles.reviewsCard}>
          <Text style={localStyles.cardTitle}>
            {t('Reviews')} ({customerData.customer_reviews_count || 0})
          </Text>

          {reviews.length > 0 ? (
            reviews
              .slice(0, 3)
              .map((review, index) => renderReviewItem(review, index))
          ) : (
            <Text style={localStyles.noReviewsText}>{t('No reviews yet')}</Text>
          )}
        </View>
      </ScrollView>

      {/* Модальное окно жалобы */}
      {isReportModalVisible && (
        <ReportUserModal
          reportedUser={customerData}
          hide={() => setIsReportModalVisible(false)}
        />
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#323232',
  },
  ordersCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A94A0',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A94A0',
  },
  reviewsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A94A0',
  },

  // Contacts section
  contactsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  contactsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#323232',
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },

  // Contacts unavailable
  contactsUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 10,
  },
  contactsUnavailableText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    fontStyle: 'italic',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 16,
  },

  reviewsCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#8A94A0',
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  reviewerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  reviewText: {
    fontSize: 14,
    color: '#323232',
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 14,
    color: '#3579F5',
    marginTop: 4,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#8A94A0',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Стили для кнопок действий
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3579F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3579F5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#3579F5',
  },
  reportButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  reportButtonText: {
    color: '#FF3B30',
  },
});
