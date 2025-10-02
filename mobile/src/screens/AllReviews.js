import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {api, retryApiCall} from '../services';
import {notifyError} from '../services/notify';
import config, {getAvatarUrl} from '../config';
import styles from '../styles';
import {LoadingComponent} from './Loading';
import ReviewReplies from '../components/ReviewReplies';

export default function AllReviews({navigation, route}) {
  const {t} = useTranslation();
  const userData = useSelector(state => state.auth.userData);
  const {executorId, executorName, userId, userName, userType} =
    route.params || {};

  // Поддержка старых параметров для обратной совместимости
  const targetUserId = userId || executorId;
  const targetUserName = userName || executorName;
  const targetUserType = userType !== undefined ? userType : 0; // По умолчанию исполнитель
  const isExecutor = targetUserType === 0;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);

  const goBack = () => {
    navigation.goBack();
  };

  // Загрузка всех отзывов
  const loadReviews = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);

      let response;
      if (isExecutor) {
        // Отзывы об исполнителе
        response = await retryApiCall(() =>
          api.executors.getExecutorReviews(targetUserId),
        );
      } else {
        // Отзывы о заказчике
        response = await retryApiCall(() =>
          api.executors.getCustomerReviews(targetUserId),
        );
      }

      if (response.success && response.result) {
        if (isExecutor) {
          // Для исполнителей старый эндпоинт возвращает массив отзывов напрямую
          const reviewsData = response.result || [];
          console.log('Executor reviews data:', reviewsData);
          setReviews(reviewsData);
        } else {
          // Для заказчиков новый эндпоинт возвращает объект с customer и reviews
          const reviewsData = response.result.reviews || [];
          console.log('Customer reviews data:', reviewsData);
          setReviews(reviewsData);
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      notifyError(t('Error'), t('Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  };

  // Обновление данных
  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    loadReviews();
  }, [targetUserId, targetUserType]);

  return (
    <View style={reviewsStyles.container}>
      {/* HEADER */}
      <HeaderBack
        title={`${t('Reviews')} ${targetUserName || ''}`}
        action={goBack}
        center={false}
      />

      <ScrollView
        style={reviewsStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={reviewsStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {loading ? (
          <LoadingComponent
            showLogo={false}
            text={t('Loading...')}
            style={{paddingVertical: 40}}
          />
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => {
            // Определяем автора отзыва в зависимости от типа пользователя
            const reviewAuthor = isExecutor
              ? review.customer || review.author // Для исполнителя - отзыв от заказчика
              : review.executor || review.author; // Для заказчика - отзыв от исполнителя

            return (
              <View key={review.id || index} style={reviewsStyles.reviewItem}>
                <View style={reviewsStyles.reviewHeader}>
                  <View style={reviewsStyles.reviewerInfo}>
                    {reviewAuthor?.avatar ? (
                      <Image
                        source={{uri: getAvatarUrl(reviewAuthor.avatar)}}
                        style={reviewsStyles.avatar}
                      />
                    ) : (
                      <View style={reviewsStyles.avatarPlaceholder}>
                        <Ionicons
                          name="person"
                          size={20}
                          color={styles.colors.primary}
                        />
                      </View>
                    )}
                    <View style={reviewsStyles.reviewerDetails}>
                      <Text style={reviewsStyles.reviewerName}>
                        {reviewAuthor?.name || t('Anonymous')}
                      </Text>
                      {review.order_id && (
                        <Text style={reviewsStyles.orderInfo}>
                          {t('Order')} #{review.order_id}
                        </Text>
                      )}
                    </View>
                  </View>
                  {(review.overall_rating || review.rating) && (
                    <View style={reviewsStyles.reviewRating}>
                      <Ionicons name="star" size={16} color="#FFEA49" />
                      <Text style={reviewsStyles.reviewRatingText}>
                        {review.overall_rating || review.rating}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={reviewsStyles.reviewText}>
                  {review.comment ||
                    review.text ||
                    review.review_text ||
                    t('No comment provided')}
                </Text>

                {/* Ответы на отзыв */}
                <ReviewReplies
                  reviewId={review.id}
                  reviewType={
                    userType === 'executor'
                      ? 'executor_review'
                      : 'customer_review'
                  }
                  canReply={
                    userType === 'executor'
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
          <View style={reviewsStyles.emptyReviews}>
            <Ionicons
              name="star-outline"
              size={64}
              color={styles.colors.actionGray}
            />
            <Text style={reviewsStyles.emptyReviewsTitle}>
              {t('No reviews yet')}
            </Text>
            <Text style={reviewsStyles.emptyReviewsSubtitle}>
              {t('Reviews from customers will appear here')}
            </Text>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={reviewsStyles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const reviewsStyles = StyleSheet.create({
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
  },

  // Review item
  reviewItem: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: styles.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 2,
  },
  orderInfo: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
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
  reviewText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: 20,
  },

  // Empty state
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyReviewsTitle: {
    marginTop: 24,
    fontSize: styles.fonSize.lg,
    fontWeight: '500',
    color: styles.colors.titles,
    textAlign: 'center',
  },
  emptyReviewsSubtitle: {
    marginTop: 8,
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
    textAlign: 'center',
  },

  // Bottom spacer
  bottomSpacer: {
    height: 80,
  },
});
