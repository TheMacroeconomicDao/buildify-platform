import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useSelector, useDispatch} from 'react-redux';
import {api, retryApiCall} from '../services';
import {notifyError} from '../services/notify';
import config, {getAvatarUrl} from '../config';
import styles from '../styles';
import ReviewReplies from '../components/ReviewReplies';
import {LoadingComponent} from './Loading';

export default function RatingAndReviews({navigation, route}) {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const userData = auth?.userData;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [profileData, setProfileData] = useState(null);

  // Получаем параметры из route или используем текущего пользователя
  const {userId, userType} = route?.params || {};
  const targetUserId = userId || userData?.id;
  const targetUserType = userType !== undefined ? userType : userData?.type;
  const isExecutor = targetUserType === 0; // 0 - исполнитель, 1 - заказчик
  const isOwnProfile = targetUserId === userData?.id;
  // Получаем рейтинг и количество отзывов в зависимости от типа пользователя
  const rating = isExecutor
    ? profileData?.average_rating ||
      profileData?.executor_rating ||
      userData?.average_rating ||
      userData?.executor_rating ||
      0
    : profileData?.average_rating ||
      profileData?.customer_rating ||
      userData?.average_rating ||
      userData?.customer_rating ||
      0;

  const goBack = () => {
    navigation.goBack();
  };

  // Загрузка данных профиля и отзывов
  const loadData = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);

      // Для собственного профиля загружаем свежие данные
      if (isOwnProfile) {
        if (isExecutor) {
          // Для собственного профиля исполнителя используем данные из Redux
          setProfileData(userData);
        } else {
          // Для собственного профиля заказчика загружаем свежие данные через API
          const profileResponse = await retryApiCall(() =>
            api.executors.getCustomerReviews(targetUserId),
          );
          if (profileResponse.success && profileResponse.result?.customer) {
            const freshCustomerData = profileResponse.result.customer;
            setProfileData(freshCustomerData);

            // ОБНОВЛЯЕМ БЛЯДЬ REDUX С СВЕЖИМИ ДАННЫМИ!
            dispatch({
              type: 'SET_USERDATA',
              payload: {
                average_rating: freshCustomerData.average_rating,
                reviews_count: freshCustomerData.reviews_count,
                customer_rating: freshCustomerData.customer_rating,
                customer_reviews_count:
                  freshCustomerData.customer_reviews_count,
              },
            });
          } else {
            setProfileData(userData);
          }
        }
      } else if (isExecutor) {
        // Для чужого профиля исполнителя загружаем через API
        const profileResponse = await retryApiCall(() =>
          api.executors.executorsDetail(targetUserId),
        );

        if (profileResponse.success) {
          setProfileData(profileResponse.result);
        }
      }

      // Загружаем отзывы в зависимости от типа пользователя
      let reviewsResponse;
      if (isExecutor) {
        // Отзывы об исполнителе
        reviewsResponse = await retryApiCall(() =>
          api.executors.getExecutorReviews(targetUserId),
        );
      } else {
        // Отзывы о заказчике
        reviewsResponse = await retryApiCall(() =>
          api.executors.getCustomerReviews(targetUserId),
        );
      }

      if (reviewsResponse.success && reviewsResponse.result) {
        if (isExecutor) {
          // Для исполнителей старый эндпоинт возвращает массив отзывов напрямую
          const reviewsData = reviewsResponse.result || [];
          console.log('RatingAndReviews - Executor reviews data:', reviewsData);
          setReviews(reviewsData);
        } else {
          // Для заказчиков новый эндпоинт возвращает объект с customer и reviews
          const {customer, reviews} = reviewsResponse.result;
          console.log('RatingAndReviews - Customer reviews data:', reviews);
          setReviews(reviews || []);

          // Обновляем данные профиля из ответа
          if (customer) {
            setProfileData(prevData => ({
              ...prevData,
              customer_rating: customer.customer_rating,
              customer_reviews_count: customer.customer_reviews_count,
              average_rating: customer.average_rating, // ИСПРАВИЛ БЛЯДЬ!
              reviews_count: customer.reviews_count, // И ЭТО ТОЖЕ!
            }));

            // ЕСЛИ ЭТО СОБСТВЕННЫЙ ПРОФИЛЬ, ОБНОВЛЯЕМ REDUX ТОЖЕ!
            if (isOwnProfile) {
              dispatch({
                type: 'SET_USERDATA',
                payload: {
                  average_rating: customer.average_rating,
                  reviews_count: customer.reviews_count,
                  customer_rating: customer.customer_rating,
                  customer_reviews_count: customer.customer_reviews_count,
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading rating and reviews:', error);
      notifyError(t('Error'), t('Failed to load data'));
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

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    loadData();
  }, [targetUserId, targetUserType]);

  // Функция для рендера звездочек
  const renderStars = rating => {
    const stars = [];
    const validRating = rating ? parseFloat(rating) : 0;

    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= validRating;

      stars.push(
        <Ionicons
          key={i}
          name={isFilled ? 'star' : 'star-outline'}
          size={16}
          color={isFilled ? '#FFEA49' : '#E0E0E0'}
          style={ratingStyles.star}
        />,
      );
    }
    return stars;
  };

  return (
    <View style={ratingStyles.container}>
      {/* HEADER */}
      <HeaderBack
        title={t('Rating and reviews')}
        action={goBack}
        center={false}
      />

      <ScrollView
        style={ratingStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ratingStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* OVERALL RATING */}
        <View style={ratingStyles.overallRatingSection}>
          <Text style={ratingStyles.overallRatingTitle}>{t('Rating')}</Text>

          {/* SINGLE RATING LINE */}
          <View style={ratingStyles.singleRatingContainer}>
            <View style={ratingStyles.starsContainer}>
              {renderStars(rating)}
            </View>
            <Text style={ratingStyles.ratingNumber}>
              {rating ? parseFloat(rating).toFixed(1) : '0.0'}
            </Text>
          </View>
        </View>

        {/* REVIEWS SECTION */}
        <View style={ratingStyles.reviewsSection}>
          <View style={ratingStyles.reviewsHeader}>
            <Text style={ratingStyles.reviewsTitle}>{t('Reviews')}</Text>
            {reviews.length > 3 && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllReviews', {
                    userId: targetUserId,
                    userName: userData?.name,
                    userType: targetUserType,
                  })
                }>
                <Text style={ratingStyles.viewAllText}>{t('View all')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* REVIEWS LIST */}
          {loading ? (
            <LoadingComponent
              showLogo={false}
              text={t('Loading reviews...')}
              style={{paddingVertical: 40}}
            />
          ) : reviews.length > 0 ? (
            reviews.slice(0, 3).map((review, index) => {
              // Определяем автора отзыва в зависимости от типа пользователя
              const reviewAuthor = isExecutor
                ? review.customer || review.author // Для исполнителя - отзыв от заказчика
                : review.executor || review.author; // Для заказчика - отзыв от исполнителя

              return (
                <View key={review.id || index} style={ratingStyles.reviewItem}>
                  <View style={ratingStyles.reviewHeader}>
                    <View style={ratingStyles.reviewerInfo}>
                      {reviewAuthor?.avatar ? (
                        <Image
                          source={{uri: getAvatarUrl(reviewAuthor.avatar)}}
                          style={ratingStyles.avatar}
                        />
                      ) : (
                        <View style={ratingStyles.avatarPlaceholder}>
                          <Ionicons
                            name="person"
                            size={20}
                            color={styles.colors.primary}
                          />
                        </View>
                      )}
                      <Text style={ratingStyles.reviewerName}>
                        {reviewAuthor?.name || t('Anonymous')}
                      </Text>
                    </View>
                    {(review.overall_rating || review.rating) && (
                      <View style={ratingStyles.reviewRating}>
                        <Ionicons name="star" size={14} color="#FFEA49" />
                        <Text style={ratingStyles.reviewRatingText}>
                          {review.overall_rating || review.rating}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={ratingStyles.reviewText}>
                    {review.comment ||
                      review.text ||
                      review.review_text ||
                      t('No comment provided')}
                  </Text>

                  {/* Ответы на отзыв */}
                  <ReviewReplies
                    reviewId={review.id}
                    reviewType={
                      userType === 0 ? 'executor_review' : 'customer_review'
                    }
                    canReply={
                      userType === 0
                        ? review.executor_id === userData?.id // Исполнитель может отвечать на отзывы о себе
                        : review.customer_id === userData?.id // Заказчик может отвечать на отзывы о себе
                    }
                    onReplyAdded={() => {
                      // Можно добавить обновление счетчика или другую логику
                    }}
                  />
                </View>
              );
            })
          ) : (
            <View style={ratingStyles.emptyReviews}>
              <Ionicons
                name="star-outline"
                size={48}
                color={styles.colors.actionGray}
              />
              <Text style={ratingStyles.emptyReviewsText}>
                {t('No reviews yet')}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacer */}
        <View style={ratingStyles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const ratingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: styles.paddingHorizontal,
  },

  // Overall rating section
  overallRatingSection: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  overallRatingTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 16,
  },

  // Single rating line
  singleRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    marginRight: 2,
  },
  ratingNumber: {
    fontSize: styles.fonSize.smd,
    fontWeight: '500',
    color: styles.colors.titles,
    marginLeft: 8,
  },

  // Reviews section
  reviewsSection: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    padding: 16,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '500',
    color: styles.colors.titles,
  },
  viewAllText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.primary,
    fontWeight: '500',
  },

  // Review item
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: styles.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.titles,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.titles,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyReviewsText: {
    marginTop: 12,
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    textAlign: 'center',
  },
  reviewText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: 20,
  },
  readMoreText: {
    color: styles.colors.primary,
    fontWeight: '500',
  },

  // Bottom spacer
  bottomSpacer: {
    height: 80,
  },
});
