import React from 'react';
import {View, TouchableOpacity, Image, StyleSheet, Text} from 'react-native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from '../styles';
import {getAvatarUrl} from '../config';
import {useMyOrders} from '../hooks/useMyOrders';

const CustomTabBar = ({state, descriptors, navigation}) => {
  const auth = useSelector(state => state.auth);
  const userData = auth?.userData;
  const insets = useSafeAreaInsets();

  // Загружаем данные об уведомлениях через useMyOrders hook
  useMyOrders();

  // Получаем количество непрочитанных уведомлений и новых откликов
  const notifications = useSelector(state => state.notifications);
  const unreadCount = notifications?.unread_count || 0;
  const newResponsesCount = notifications?.new_responses_count || 0;

  // Получаем аватар из профиля или используем плейсхолдер
  const avatarSource = userData?.avatar
    ? {uri: getAvatarUrl(userData.avatar)}
    : null; // Используем компонент плейсхолдера

  console.log('unreadCount', unreadCount);
  return (
    <View
      style={[
        localStyles.container,
        {paddingBottom: Math.max(insets.bottom, 20)},
      ]}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Определяем иконки для каждого таба
        let tabIcon;
        if (route.name === 'Home') {
          tabIcon = (
            <Image
              source={require('../images/menu/home.png')}
              style={[
                localStyles.icon,
                {tintColor: isFocused ? styles.colors.primary : '#CCCCCC'},
              ]}
            />
          );
        } else if (route.name === 'OrdersList') {
          tabIcon = (
            <Image
              source={require('../images/menu/list.png')}
              style={[
                localStyles.icon,
                {tintColor: isFocused ? styles.colors.primary : '#CCCCCC'},
              ]}
            />
          );
        } else if (route.name === 'Profile') {
          tabIcon = (
            <View style={localStyles.avatarContainer}>
              {avatarSource ? (
                <Image source={avatarSource} style={localStyles.avatar} />
              ) : (
                <View
                  style={[
                    localStyles.avatarPlaceholder,
                    {
                      backgroundColor: isFocused
                        ? styles.colors.primary
                        : '#CCCCCC',
                    },
                  ]}>
                  <Ionicons
                    name="person"
                    size={14}
                    color={styles.colors.background}
                  />
                </View>
              )}
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={localStyles.tabItem}>
            {tabIcon}
            {/* Индикатор активного таба для всех вкладок */}
            {isFocused && <View style={localStyles.activeIndicator} />}

            {route.name === 'OrdersList' && newResponsesCount > 0 && (
              <View style={localStyles.simpleBadge}>
                <Text style={localStyles.badgeText}>{newResponsesCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#F9F9F9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 32,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    width: 24,
    height: 24,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -20,
    width: 34,
    height: 4,
    backgroundColor: styles.colors.primary,
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: styles.colors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: styles.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  simpleBadge: {
    position: 'absolute',
    top: -6,
    right: 30,
    minWidth: 18,
    height: 18,
    backgroundColor: styles.colors.red,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default CustomTabBar;
