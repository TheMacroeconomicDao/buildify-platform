import React from 'react';
import {View, StyleSheet} from 'react-native';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import styles from '../styles';

const RatingBlock = ({averageRating, reviewsCount}) => {
  const {t} = useTranslation();

  if (!averageRating && !reviewsCount) {
    return null;
  }

  const renderStars = rating => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Полные звезды
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`full-${i}`} name="star" size={16} color="#FFEA49" />,
      );
    }

    // Половинчатая звезда
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FFEA49" />,
      );
    }

    // Пустые звезды
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={16}
          color="#E0E0E0"
        />,
      );
    }

    return stars;
  };

  return (
    <View style={ratingStyles.container}>
      <View style={ratingStyles.ratingRow}>
        <View style={ratingStyles.starsContainer}>
          {renderStars(averageRating || 0)}
        </View>
        <Text style={ratingStyles.ratingText}>
          {averageRating ? averageRating.toFixed(1) : '0.0'}
        </Text>
      </View>

      <View style={ratingStyles.reviewsRow}>
        <Ionicons name="people" size={16} color={styles.colors.actionGray} />
        <Text style={ratingStyles.reviewsText}>
          {reviewsCount || 0} {t('reviews')}
        </Text>
      </View>
    </View>
  );
};

const ratingStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.titles,
  },
  reviewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
  },
});

export default RatingBlock;
