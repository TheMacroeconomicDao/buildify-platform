// CustomText.js
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function MenuItem({
  title = '',
  onPress = () => {},
  no_border = false,
  badge = null,
  subscriptionIndicator = null,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomColor: styles.colors.gray4,
        borderBottomWidth: no_border ? 0 : 1.2,
        paddingVertical: 7,
        paddingHorizontal: 8,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text
          style={{
            color: styles.colors.black,
            fontSize: styles.fonSize.md,
            fontWeight: '400',
          }}>
          {title}
        </Text>
        {badge && badge > 0 && (
          <View
            style={{
              marginLeft: 8,
              backgroundColor: '#F54E4E',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 6,
            }}>
            <Text
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '600',
              }}>
              {badge}
            </Text>
          </View>
        )}
        {subscriptionIndicator && (
          <View
            style={{
              marginLeft: 8,
              backgroundColor:
                subscriptionIndicator === 'EXPIRED' ? '#F54E4E' : '#FF9500',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 6,
            }}>
            <Text
              style={{
                color: 'white',
                fontSize: 10,
                fontWeight: '600',
              }}>
              {subscriptionIndicator === 'EXPIRED'
                ? '!'
                : subscriptionIndicator}
            </Text>
          </View>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        style={{color: styles.colors.regular, fontSize: 20}}
      />
    </TouchableOpacity>
  );
}
