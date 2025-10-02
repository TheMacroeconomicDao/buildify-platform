import React, {useState} from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import {LoadingComponent} from './Loading';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useNotifications from '../hooks/useNotifications';
import HeaderBack from '../headers/HeaderBack';

const NotificationCard = ({notification, t, isExpanded, onToggle}) => {
  // Функция для парсинга данных уведомления
  const parseNotificationData = notification => {
    try {
      // Если data - это JSON-строка, парсим её
      if (notification.data && typeof notification.data === 'string') {
        const parsedData = JSON.parse(notification.data);
        return {
          title: parsedData.title || notification.title || t('Notification'),
          message:
            parsedData.message ||
            notification.message ||
            notification.content ||
            '',
          type: parsedData.type || 'default',
        };
      }
      // Если data - это объект
      if (notification.data && typeof notification.data === 'object') {
        return {
          title:
            notification.data.title || notification.title || t('Notification'),
          message:
            notification.data.message ||
            notification.message ||
            notification.content ||
            '',
          type: notification.data.type || 'default',
        };
      }
      // Fallback к обычным полям
      return {
        title: notification.title || t('Notification'),
        message: notification.message || notification.content || '',
        type: 'default',
      };
    } catch (error) {
      console.error('Error parsing notification data:', error);
      return {
        title: notification.title || t('Notification'),
        message:
          notification.message ||
          notification.content ||
          notification.data ||
          '',
        type: 'default',
      };
    }
  };

  const {title, message, type} = parseNotificationData(notification);
  const isUnread = !notification.read_at;

  // Функция для форматирования времени
  const formatTime = dateString => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return t('Just now');
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('min ago')}`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${t('h ago')}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${t('d ago')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Иконка в зависимости от типа уведомления
  const getNotificationIcon = type => {
    switch (type) {
      case 'order_status_changed':
        return 'receipt-outline';
      case 'executor_selected':
        return 'person-outline';
      case 'new_order':
        return 'add-circle-outline';
      case 'new_message':
        return 'chatbubble-outline';
      default:
        return 'notifications-outline';
    }
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: styles.colors.white,
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      }}
      onPress={onToggle}
      activeOpacity={0.7}>
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        {/* Иконка */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isUnread
              ? styles.colors.primary
              : styles.colors.lightGray,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            marginTop: 2, // Небольшой отступ для выравнивания с текстом
          }}>
          <Ionicons
            name={getNotificationIcon(type)}
            size={20}
            color={isUnread ? styles.colors.white : styles.colors.gray}
          />
        </View>

        {/* Контент */}
        <View style={{flex: 1}}>
          {/* Заголовок и время */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 4,
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: isUnread ? '600' : '500',
                color: styles.colors.black,
                flex: 1,
                marginRight: 8,
                lineHeight: 22, // Фиксированная высота строки
              }}>
              {title}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 2,
              }}>
              <Text
                style={{
                  fontSize: 12,
                  color: styles.colors.gray,
                  fontWeight: '400',
                  marginRight: 4,
                }}>
                {formatTime(notification.created_at)}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={styles.colors.gray}
              />
            </View>
          </View>

          {/* Сообщение - показывается только при раскрытии */}
          {isExpanded && (
            <Text
              style={{
                fontSize: 14,
                color: styles.colors.gray,
                lineHeight: 20,
                marginTop: 4,
              }}>
              {message}
            </Text>
          )}

          {/* Индикатор непрочитанного */}
          {isUnread && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: isExpanded ? 8 : 4,
              }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: styles.colors.primary,
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: styles.colors.primary,
                  fontWeight: '500',
                }}>
                {t('New')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Notifications({navigation}) {
  const {
    notifications,
    refreshing,
    isFirstLoad,
    handleRefresh,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    goBack,
  } = useNotifications(navigation);

  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  // Состояние для раскрытых карточек
  const [expandedItems, setExpandedItems] = useState({});

  // Сортируем уведомления: новые сверху
  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA; // Новые сверху
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Функция для переключения раскрытия карточки
  const toggleExpanded = id => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isFirstLoad) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: styles.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
        }}>
        <HeaderBack title={t('Notifications')} action={goBack} />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <LoadingComponent text={t('Loading...')} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: styles.colors.background,
        paddingTop: insets.top,
      }}>
      {/* Header */}
      <View style={{paddingHorizontal: 16, paddingBottom: 8}}>
        <HeaderBack title={t('Notifications')} action={goBack} />

        {/* Статистика и действия */}
        {notifications.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}>
            <Text style={{fontSize: 14, color: styles.colors.gray}}>
              {unreadCount > 0
                ? `${unreadCount} ${t('new notifications')}`
                : t('All notifications read')}
            </Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllNotificationsAsRead}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: styles.colors.primary,
                }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: styles.colors.white,
                    fontWeight: '500',
                  }}>
                  {t('Mark all as read')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[styles.colors.primary]}
            tintColor={styles.colors.primary}
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}>
        {sortedNotifications.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 100,
              paddingHorizontal: 32,
            }}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={styles.colors.gray}
              style={{marginBottom: 16}}
            />
            <Text
              style={{
                fontSize: 18,
                color: styles.colors.gray,
                textAlign: 'center',
                fontWeight: '500',
                marginBottom: 8,
              }}>
              {t('No notifications')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: styles.colors.gray,
                textAlign: 'center',
                lineHeight: 20,
              }}>
              {t(
                'You will receive notifications about order status changes and other important updates here',
              )}
            </Text>
          </View>
        ) : (
          sortedNotifications.map((notification, index) => (
            <NotificationCard
              key={notification.id || index}
              notification={notification}
              t={t}
              isExpanded={expandedItems[notification.id || index]}
              onToggle={() => {
                toggleExpanded(notification.id || index);
                if (!notification.read_at) {
                  markNotificationAsRead(notification.id);
                }
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
