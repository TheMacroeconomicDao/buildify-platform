import React from 'react';
import { View, Image } from 'react-native';
import Text from './Text';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import config from '../config';

const ReviewCard = ({ avatar, name, rating, reviewText }) => (
  <View
    style={{
      width: '100%',
      padding: 12,
      backgroundColor: styles.colors.white,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: styles.colors.border,
    }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Image
        source={{ uri: config.siteUrl + avatar }}
        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: styles.colors.black }}>
            {name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.floor(rating) ? 'star' : 'star-outline'}
                size={16}
                color={styles.colors.yellow}
              />
            ))}
            <Text style={{ fontSize: 14, color: styles.colors.gray, marginRight:5 }}>{parseFloat(rating).toFixed(1)}</Text>

          </View>
        </View>
      </View>
    </View>
    <Text style={{ fontSize: 14, color: styles.colors.black }}>
      {reviewText}
    </Text>
  </View>
);

export default ReviewCard;