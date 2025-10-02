import React, {useEffect, useRef} from 'react';
import {View, Animated, StyleSheet} from 'react-native';

/**
 * Базовый Skeleton Loader
 */
const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style = {},
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E1E9EE', '#F2F8FC'],
  });

  return (
    <Animated.View
      style={[{width, height, borderRadius, backgroundColor}, style]}
    />
  );
};

/**
 * Skeleton для карточки заказа
 */
export const OrderCardSkeleton = () => (
  <View style={styles.orderCard}>
    <View style={styles.row}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <View style={styles.content}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="50%" height={14} style={{marginTop: 4}} />
      </View>
    </View>
    <SkeletonLoader width="100%" height={16} style={{marginTop: 12}} />
    <SkeletonLoader width="80%" height={14} style={{marginTop: 8}} />
  </View>
);

/**
 * Skeleton для списка заказов
 */
export const OrdersListSkeleton = ({count = 3}) => (
  <View>
    {Array.from({length: count}).map((_, index) => (
      <OrderCardSkeleton key={index} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
});

export default SkeletonLoader;
export {OrderCardSkeleton, OrdersListSkeleton};
