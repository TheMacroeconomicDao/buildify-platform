import React, {useRef, useEffect, useState} from 'react';
import {View, Text, Image, Dimensions, Animated, StyleSheet} from 'react-native';
import styles2 from '../styles';
import config from '../config';
const width = Dimensions.get('window').width - styles2.paddingHorizontal * 2;

const Carousel = ({banners}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    Animated.timing(scrollX, {
      toValue: currentIndex * width,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, scrollX]);

  return (
    <View style={styles.carouselContainer}>
      <Animated.View
        style={[
          styles.carousel,
          {
            width: width * banners.length,
            transform: [{translateX: Animated.multiply(scrollX, -1)}],
          },
        ]}>
        {banners.map((banner, index) => (
          <View key={index} style={styles.bannerContainer}>
            <Image source={{uri: config.siteUrl + banner.image}} style={styles.bannerImage} />
            <Text style={styles.bannerText}>{banner.text}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    width: width,
    height: 200,
    overflow: 'hidden',
    borderRadius:5
  },
  carousel: {
    flexDirection: 'row',
  },
  bannerContainer: {
    width: width,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Carousel;