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

const CustomerReviewModal = ({
  visible,
  onClose,
  customerData,
  orderData,
  onSubmit,
}) => {
  const {t} = useTranslation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Валидация
    if (rating === 0) {
      Alert.alert(t('Error'), t('Please select a rating'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        order_id: orderData.id,
        rating: rating,
        comment: comment.trim(),
      });

      // Сброс формы
      setRating(0);
      setComment('');

      onClose();
    } catch (error) {
      console.error('Error submitting customer review:', error);
      Alert.alert(t('Error'), t('Failed to submit review'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => (
    <View style={localStyles.ratingContainer}>
      <Text style={localStyles.ratingLabel}>{t('Rate this customer')}</Text>
      <View style={localStyles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={localStyles.starButton}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? styles.colors.yellow : styles.colors.gray}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={localStyles.ratingDescription}>
        {rating === 0 && t('Select a rating')}
        {rating === 1 && t('Very poor')}
        {rating === 2 && t('Poor')}
        {rating === 3 && t('Average')}
        {rating === 4 && t('Good')}
        {rating === 5 && t('Excellent')}
      </Text>
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
              <Text style={localStyles.title}>{t('Rate customer')}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={localStyles.closeButton}>
                <Ionicons name="close" size={24} color={styles.colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Информация о заказчике */}
            <View style={localStyles.customerInfo}>
              <Text style={localStyles.customerName}>{customerData?.name}</Text>
              <Text style={localStyles.orderTitle}>{orderData?.title}</Text>
            </View>

            {/* Рейтинг */}
            {renderStarRating()}

            {/* Комментарий */}
            <View style={localStyles.commentContainer}>
              <Text style={localStyles.commentLabel}>
                {t('Comment')} ({t('optional')})
              </Text>
              <TextInput
                style={localStyles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder={t('Share your experience with this customer')}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={localStyles.charCount}>{comment.length}/500</Text>
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
    padding: 20,
  },
  modal: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: styles.colors.black,
  },
  closeButton: {
    padding: 4,
  },
  customerInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: styles.colors.black,
    marginBottom: 4,
  },
  orderTitle: {
    fontSize: 14,
    color: styles.colors.gray,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    color: styles.colors.black,
    marginBottom: 12,
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingDescription: {
    fontSize: 14,
    color: styles.colors.gray,
    minHeight: 20,
  },
  commentContainer: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 14,
    color: styles.colors.black,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
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
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
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

export default CustomerReviewModal;
