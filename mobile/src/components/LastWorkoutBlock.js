import React from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import Text from './Text';
import FastImage from 'react-native-fast-image';
import styles from '../styles';
import {navigate} from '../services/RootNavigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const width = Dimensions.get('window').width - styles.paddingHorizontal * 2;

function WorkoutProgress({current = 0, total = 100}) {
  return (
    <View style={{width: width * 0.5, alignItems: 'flex-start'}}>
      <View
        style={{
          marginTop: 3,
          width: width * 0.5,
          height: 5,
          backgroundColor: styles.colors.grayLight,
          borderRadius: 4,
        }}>
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          colors={[styles.colors.primary, styles.colors.highlight]}
          style={{
            width: (width * 0.5 * current) / total,
            height: 5,
            borderRadius: 4,
          }}></LinearGradient>
      </View>
    </View>
  );
}

const LastWorkoutBlock = ({item, onPress = () => {}}) => {
  const innerHeight = 90 - styles.paddingHorizontal * 2;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        position: 'absolute', zIndex:9,
        bottom: styles.paddingHorizontal,
        zIndex: 3,
        left: styles.paddingHorizontal,
        padding: 10,
        backgroundColor: styles.colors.white,
        width: width,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: styles.borderR,
        gap: 5,
        height: 90,
        elevation: 5,
        shadowColor: '#888',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      }}
      onPress={() => {
        navigate('WorkoutDetailed', {workout: item, time: item.time});
      }}>
      <FastImage
        source={{
          uri: item.image,
        }}
        style={{
          width: innerHeight,
          height: innerHeight,
          borderRadius: styles.borderR,
        }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View
        style={{
          flex: 1,
          height: innerHeight,
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
        <Text
          numberOfLines={2}
          style={{
            width: '100%',
            fontSize: styles.fonSize.smd,
            fontWeight: '600',
            color: styles.colors.black,
          }}>
          {item.name}
        </Text>
        <Text
          style={{
            fontSize: styles.fonSize.smd,
            fontWeight: '600',
            color: styles.colors.placeholderColor,
          }}>
          Тренировка 10
        </Text>
        <WorkoutProgress name={'Тренировка 10'} total={180} current={120} />
      </View>
      <TouchableOpacity
        onPress={() => {
          navigate('WorkoutDetailed', {
            workout: item,
            time: item.time,
            play: true,
          });
        }}
        style={{
          backgroundColor: styles.colors.background,
          padding: 7,
          borderRadius: 100,
        }}>
        <Ionicons name="play" size={32} color={styles.colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default LastWorkoutBlock;
