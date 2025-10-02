import React, {useState} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from '../styles';
import Text from '../components/Text';

const ExecutorReviewModal = ({
  visible,
  onClose,
  executorData,
  orderData,
  onSubmit,
}) => {
  const {t} = useTranslation();

  const [qualityRating, setQualityRating] = useState(0);
  const [speedRating, setSpeedRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Валидация
    if (
      qualityRating === 0 ||
      speedRating === 0 ||
      communicationRating === 0 ||
      overallRating === 0
    ) {
      Alert.alert(t('Error'), t('Please rate all categories'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        order_id: orderData.id,
        executor_id: executorData.id,
        quality_rating: qualityRating,
        speed_rating: speedRating,
        communication_rating: communicationRating,
        overall_rating: overallRating,
        comment: comment.trim(),
      });

      // Сброс формы
      setQualityRating(0);
      setSpeedRating(0);
      setCommunicationRating(0);
      setOverallRating(0);
      setComment('');

      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(t('Error'), t('Failed to submit review'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (rating, setRating, label) => (
    <View style={localStyles.ratingRow}>
      <Text style={localStyles.ratingLabel}>{label}</Text>
      <View style={localStyles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={localStyles.starButton}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={24}
              color={star <= rating ? styles.colors.yellow : styles.colors.gray}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={localStyles.overlay}>
        <View style={localStyles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Заголовок */}
            <View style={localStyles.header}>
              <Text style={localStyles.title}>{t('Rate executor')}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={localStyles.closeButton}>
                <Ionicons name="close" size={24} color={styles.colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Информация об исполнителе */}
            <View style={localStyles.executorInfo}>
              <Text style={localStyles.executorName}>{executorData?.name}</Text>
              <Text style={localStyles.orderTitle}>{orderData?.title}</Text>
            </View>

            {/* Рейтинги */}
            <View style={localStyles.ratingsContainer}>
              {renderStarRating(
                qualityRating,
                setQualityRating,
                t('Quality of work'),
              )}
              {renderStarRating(
                speedRating,
                setSpeedRating,
                t('Speed of execution'),
              )}
              {renderStarRating(
                communicationRating,
                setCommunicationRating,
                t('Communication'),
              )}
              {renderStarRating(
                overallRating,
                setOverallRating,
                t('Overall rating'),
              )}
            </View>

            {/* Комментарий */}
            <View style={localStyles.commentContainer}>
              <Text style={localStyles.commentLabel}>
                {t('Comment')} ({t('optional')})
              </Text>
              <TextInput
                style={localStyles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder={t('Share your experience with this executor')}
                multiline
                numberOfLines={4}
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={localStyles.charCount}>{comment.length}/1000</Text>
            </View>

            {/* Кнопки */}
            <View style={localStyles.buttonsContainer}>
              <TouchableOpacity
                style={[localStyles.button, localStyles.cancelButton]}
                onPress={onClose}
                disabled={isSubmitting}>
                <Text style={localStyles.cancelButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[localStyles.button, localStyles.submitButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={styles.colors.white} />
                ) : (
                  <Text style={localStyles.submitButtonText}>
                    {t('Submit review')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const localStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: styles.colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: styles.colors.black,
  },
  closeButton: {
    padding: 4,
  },
  executorInfo: {
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  executorName: {
    fontSize: 18,
    fontWeight: '500',
    color: styles.colors.black,
    marginBottom: 6,
  },
  orderTitle: {
    fontSize: 14,
    color: styles.colors.gray,
    textAlign: 'center',
  },
  ratingsContainer: {
    marginBottom: 28,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    color: styles.colors.black,
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 4,
  },
  commentContainer: {
    marginBottom: 28,
  },
  commentLabel: {
    fontSize: 14,
    color: styles.colors.black,
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    fontFamily: 'Inter',
  },
  charCount: {
    fontSize: 12,
    color: styles.colors.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: styles.colors.white,
    borderWidth: 1,
    borderColor: styles.colors.border,
  },
  submitButton: {
    backgroundColor: styles.colors.primary,
  },
  cancelButtonText: {
    color: styles.colors.gray,
    fontWeight: '500',
  },
  submitButtonText: {
    color: styles.colors.white,
    fontWeight: '500',
  },
};

export default ExecutorReviewModal;
