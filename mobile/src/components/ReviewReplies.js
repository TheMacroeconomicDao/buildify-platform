import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Text from './Text';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from '../styles';
import {apiService} from '../services/index';
import {notifyError, notifySuccess} from '../services/notify';
import config, {getAvatarUrl} from '../config';

const ReviewReplies = ({
  reviewId,
  reviewType, // 'executor_review' или 'customer_review'
  canReply = false, // Может ли текущий пользователь отвечать
  onReplyAdded = () => {},
}) => {
  const {t} = useTranslation();
  const userData = useSelector(state => state.auth.userData);

  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReplies();
  }, [reviewId, reviewType]);

  const loadReplies = async () => {
    setLoading(true);
    try {
      const response = await apiService.getReviewReplies(reviewType, reviewId);
      if (response.success) {
        setReplies(response.result || []);
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      Alert.alert(t('Error'), t('Please enter a reply'));
      return;
    }

    setSubmitting(true);
    try {
      let response;
      if (reviewType === 'executor_review') {
        response = await apiService.replyToExecutorReview(
          reviewId,
          replyText.trim(),
        );
      } else {
        response = await apiService.replyToCustomerReview(
          reviewId,
          replyText.trim(),
        );
      }

      if (response.success) {
        notifySuccess(t('Success'), t('Reply added successfully'));
        setReplyText('');
        setShowReplyInput(false);
        loadReplies(); // Перезагружаем ответы
        onReplyAdded();
      } else {
        notifyError(t('Error'), response.message || t('Failed to add reply'));
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      notifyError(t('Error'), t('Failed to add reply'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = dateString => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        ' ' +
        date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      );
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={repliesStyles.loadingContainer}>
        <ActivityIndicator size="small" color={styles.colors.primary} />
        <Text style={repliesStyles.loadingText}>{t('Loading replies...')}</Text>
      </View>
    );
  }

  return (
    <View style={repliesStyles.container}>
      {/* Список ответов */}
      {replies.length > 0 && (
        <View style={repliesStyles.repliesList}>
          {replies.map((reply, index) => (
            <View key={reply.id || index} style={repliesStyles.replyItem}>
              <View style={repliesStyles.replyHeader}>
                <View style={repliesStyles.authorInfo}>
                  {reply.author?.avatar ? (
                    <Image
                      source={{uri: getAvatarUrl(reply.author.avatar)}}
                      style={repliesStyles.avatar}
                    />
                  ) : (
                    <View style={repliesStyles.avatarPlaceholder}>
                      <Ionicons
                        name="person"
                        size={16}
                        color={styles.colors.primary}
                      />
                    </View>
                  )}
                  <View style={repliesStyles.authorDetails}>
                    <Text style={repliesStyles.authorName}>
                      {reply.author?.name || t('Anonymous')}
                    </Text>
                    <Text style={repliesStyles.replyDate}>
                      {formatDate(reply.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={repliesStyles.replyText}>{reply.reply_text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Кнопка ответить */}
      {canReply && !showReplyInput && (
        <TouchableOpacity
          style={repliesStyles.replyButton}
          onPress={() => setShowReplyInput(true)}>
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={styles.colors.primary}
          />
          <Text style={repliesStyles.replyButtonText}>{t('Reply')}</Text>
        </TouchableOpacity>
      )}

      {/* Поле ввода ответа */}
      {showReplyInput && (
        <View style={repliesStyles.replyInputContainer}>
          <TextInput
            style={repliesStyles.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder={t('Write your reply...')}
            multiline
            maxLength={1000}
            editable={!submitting}
          />
          <View style={repliesStyles.replyActions}>
            <TouchableOpacity
              style={repliesStyles.cancelButton}
              onPress={() => {
                setShowReplyInput(false);
                setReplyText('');
              }}
              disabled={submitting}>
              <Text style={repliesStyles.cancelButtonText}>{t('Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                repliesStyles.submitButton,
                submitting && repliesStyles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReply}
              disabled={submitting || !replyText.trim()}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={repliesStyles.submitButtonText}>{t('Send')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const repliesStyles = {
  container: {
    marginTop: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: styles.colors.regular,
  },
  repliesList: {
    gap: 12,
    marginBottom: 12,
  },
  replyItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginLeft: 16, // Отступ для визуального отличия от основного отзыва
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: styles.colors.primaryLight || '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
    color: styles.colors.black,
  },
  replyDate: {
    fontSize: 11,
    color: styles.colors.regular,
  },
  replyText: {
    fontSize: 14,
    lineHeight: 20,
    color: styles.colors.black,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: styles.colors.background || '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: styles.colors.border || '#E5E5E5',
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: styles.colors.primary,
  },
  replyInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: styles.colors.border || '#E5E5E5',
    padding: 12,
    gap: 12,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: styles.colors.border || '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: styles.colors.black,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: styles.colors.background || '#F8F9FA',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: styles.colors.regular,
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: styles.colors.primary,
    minWidth: 60,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: styles.colors.gray || '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
};

export default ReviewReplies;
