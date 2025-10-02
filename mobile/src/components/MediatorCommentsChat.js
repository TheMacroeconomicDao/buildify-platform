import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import styles from '../styles';
import config from '../config';
import {api, retryApiCall} from '../services';
import {notifyError} from '../services/notify';
import {LoadingComponent} from '../screens/Loading';

export default function MediatorCommentsChat({
  orderId,
  currentStep,
  onCommentAdded,
}) {
  const {t} = useTranslation();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef(null);

  // Загрузка комментариев
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await retryApiCall(() =>
        api.mediator.getOrderComments(orderId),
      );
      if (response.success) {
        setComments(response.result || []);
        // Прокручиваем к последнему комментарию
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Отправка нового комментария
  const sendComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSending(true);
      const response = await retryApiCall(() =>
        api.mediator.addOrderComment(orderId, {
          step: currentStep,
          comment: newComment.trim(),
        }),
      );

      if (response.success) {
        setComments(prev => [...prev, response.result]);
        setNewComment('');
        onCommentAdded?.(response.result);

        // Прокручиваем к новому комментарию
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({animated: true});
        }, 100);
      } else {
        notifyError(t('Error'), t('Failed to send comment'));
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      notifyError(t('Error'), t('Failed to send comment'));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadComments();
    }
  }, [orderId]);

  // Группируем комментарии по этапам
  const groupedComments = comments.reduce((groups, comment) => {
    const stepKey = `step_${comment.step}`;
    if (!groups[stepKey]) {
      groups[stepKey] = [];
    }
    groups[stepKey].push(comment);
    return groups;
  }, {});

  const getStepTitle = step => {
    switch (step) {
      case 1:
        return t('Step 1: Order Details');
      case 2:
        return t('Step 2: Executor Search');
      case 3:
        return t('Step 3: Execution');
      default:
        return `${t('Step')} ${step}`;
    }
  };

  const renderComment = (comment, index) => (
    <View key={comment.id || index} style={localStyles.commentItem}>
      <View style={localStyles.commentHeader}>
        <View style={localStyles.avatarContainer}>
          {comment.mediator?.avatar ? (
            <Image
              source={{
                uri:
                  config.baseUrl.replace('/api', '') + comment.mediator.avatar,
              }}
              style={localStyles.avatar}
            />
          ) : (
            <View style={localStyles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={styles.colors.white} />
            </View>
          )}
        </View>
        <View style={localStyles.commentMeta}>
          <Text style={localStyles.authorName}>
            {comment.mediator?.name || t('Mediator')}
          </Text>
          <Text style={localStyles.commentDate}>{comment.formatted_date}</Text>
        </View>
      </View>
      <View style={localStyles.commentContent}>
        <Text style={localStyles.commentText}>{comment.comment}</Text>
      </View>
    </View>
  );

  const renderStepGroup = (stepKey, stepComments) => {
    const stepNumber = parseInt(stepKey.replace('step_', ''));

    return (
      <View key={stepKey} style={localStyles.stepGroup}>
        <View style={localStyles.stepHeader}>
          <View style={localStyles.stepBadge}>
            <Text style={localStyles.stepBadgeText}>{stepNumber}</Text>
          </View>
          <Text style={localStyles.stepTitle}>{getStepTitle(stepNumber)}</Text>
        </View>
        {stepComments.map(renderComment)}
      </View>
    );
  };

  if (loading) {
    return (
      <LoadingComponent
        showLogo={false}
        text={t('Loading comments...')}
        style={{paddingVertical: 40}}
      />
    );
  }

  return (
    <View style={localStyles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={localStyles.commentsContainer}
        showsVerticalScrollIndicator={false}>
        {/* Индикатор текущего шага */}
        <View style={localStyles.currentStepIndicator}>
          <View style={localStyles.currentStepBadge}>
            <Text style={localStyles.currentStepNumber}>{currentStep}</Text>
          </View>
          <View style={localStyles.currentStepInfo}>
            <Text style={localStyles.currentStepTitle}>
              {t('Currently working on')}
            </Text>
            <Text style={localStyles.currentStepName}>
              {getStepTitle(currentStep)}
            </Text>
          </View>
          <Ionicons name="pencil" size={16} color={styles.colors.primary} />
        </View>

        {Object.keys(groupedComments).length === 0 ? (
          <View style={localStyles.emptyState}>
            <Ionicons
              name="chatbubble-outline"
              size={48}
              color={styles.colors.gray}
            />
            <Text style={localStyles.emptyText}>
              {t('No comments yet. Add your first comment below.')}
            </Text>
          </View>
        ) : (
          Object.entries(groupedComments)
            .sort(([a], [b]) => {
              const stepA = parseInt(a.replace('step_', ''));
              const stepB = parseInt(b.replace('step_', ''));
              return stepA - stepB;
            })
            .map(([stepKey, stepComments]) =>
              renderStepGroup(stepKey, stepComments),
            )
        )}
      </ScrollView>

      {/* Поле для нового комментария */}
      <View style={localStyles.inputContainer}>
        <View style={localStyles.inputWrapper}>
          <TextInput
            style={localStyles.textInput}
            placeholder={t('Add comment for current step...')}
            placeholderTextColor={styles.colors.gray}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              localStyles.sendButton,
              {
                backgroundColor: newComment.trim()
                  ? styles.colors.primary
                  : styles.colors.gray,
              },
            ]}
            onPress={sendComment}
            disabled={!newComment.trim() || sending}>
            {sending ? (
              <ActivityIndicator size="small" color={styles.colors.white} />
            ) : (
              <Ionicons name="send" size={16} color={styles.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: styles.paddingHorizontal,
    backgroundColor: styles.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    gap: 12,
  },
  headerTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: '#323232',
    fontFamily: 'Inter',
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: styles.paddingHorizontal,
  },
  currentStepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: styles.colors.primary,
    marginHorizontal: -styles.paddingHorizontal,
    marginBottom: 16,
    padding: 16,
    gap: 12,
  },
  currentStepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: styles.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStepNumber: {
    fontSize: styles.fonSize.md,
    fontWeight: '700',
    color: styles.colors.primary,
    fontFamily: 'Inter',
  },
  currentStepInfo: {
    flex: 1,
  },
  currentStepTitle: {
    fontSize: styles.fonSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  currentStepName: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.white,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  stepGroup: {
    marginBottom: 24,
    marginTop: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: styles.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: styles.colors.white,
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  stepTitle: {
    fontSize: styles.fonSize.md,
    fontWeight: '500',
    color: '#323232',
    fontFamily: 'Inter',
  },
  commentItem: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: styles.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: '#323232',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  commentDate: {
    fontSize: styles.fonSize.xs,
    color: '#8A94A0',
    fontFamily: 'Inter',
  },
  commentContent: {
    paddingLeft: 0,
  },
  commentText: {
    fontSize: styles.fonSize.sm,
    color: '#323232',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: styles.fonSize.md,
    color: '#8A94A0',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  inputContainer: {
    backgroundColor: styles.colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    padding: styles.paddingHorizontal,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 120,
    fontSize: styles.fonSize.sm,
    color: '#323232',
    fontFamily: 'Inter',
    backgroundColor: styles.colors.white,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: styles.fonSize.xs,
    color: '#8A94A0',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#8A94A0',
    fontSize: styles.fonSize.sm,
    fontFamily: 'Inter',
  },
});
