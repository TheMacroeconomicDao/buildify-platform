import React from 'react';
import {TouchableOpacity, View, Image, StyleSheet} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {navigate} from '../services/RootNavigation';
import config, {getAvatarUrl} from '../config';

export default MainHeader = ({
  haveNotifications = false,
  centered = false,
  title = '',
}) => {
  const insets = useSafeAreaInsets();
  const auth = useSelector(state => state.auth);

  // Если нужен центрированный заголовок
  if (centered) {
    return (
      <View style={[headerStyles.container, {marginTop: insets.top}]}>
        {/* Левая часть - пустая */}
        <View style={headerStyles.sideArea} />

        {/* Центральная часть - заголовок */}
        <View style={headerStyles.centerArea}>
          <Text style={headerStyles.centeredTitle}>{title}</Text>
        </View>

        {/* Правая часть - кнопка уведомлений */}
        <View style={headerStyles.sideArea}>
          <TouchableOpacity
            style={headerStyles.notificationButton}
            onPress={() => {
              navigate('Notifications');
            }}>
            <Ionicons
              name="notifications"
              size={styles.fonSize.g1}
              color={styles.colors.black}
            />
            {haveNotifications && <View style={headerStyles.notificationDot} />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Стандартный хедер с профилем
  return (
    <View style={[headerStyles.container, {marginTop: insets.top}]}>
      <TouchableOpacity
        style={headerStyles.profileContainer}
        onPress={() => {}}>
        {auth.userData?.avatar ? (
          <Image
            source={{uri: getAvatarUrl(auth.userData.avatar)}}
            style={headerStyles.avatar}
          />
        ) : (
          <View style={headerStyles.avatarPlaceholder}>
            <Ionicons
              name="person"
              size={styles.fonSize.g3}
              color={styles.colors.background}
            />
          </View>
        )}
        <View style={headerStyles.userInfoContainer}>
          <Text style={headerStyles.userName}>{auth.userData?.name || ''}</Text>
          <View style={headerStyles.userStatusContainer}>
            <MaterialCommunityIcons
              name="crown"
              size={styles.fonSize.xl}
              color={styles.colors.yellow}
            />
            <Text style={headerStyles.userStatus}>PRO</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={headerStyles.notificationButton}
        onPress={() => {
          navigate('Notifications');
        }}>
        <Ionicons
          name="notifications"
          size={styles.fonSize.g1}
          color={styles.colors.black}
        />
        {haveNotifications && <View style={headerStyles.notificationDot} />}
      </TouchableOpacity>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: styles.paddingHorizontal,
    paddingVertical: 8,
    backgroundColor: styles.colors.white,
  },
  profileContainer: {
    flexDirection: 'row',
    width: '80%',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 70,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 70,
    backgroundColor: styles.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    height: 60,
    justifyContent: 'space-between',
  },
  userName: {
    width: '100%',
    color: styles.colors.black,
    fontSize: styles.fonSize.xl,
    fontWeight: '600',
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  userStatus: {
    width: '100%',
    color: styles.colors.black,
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
  },
  notificationButton: {
    backgroundColor: styles.colors.grayLight,
    padding: 3,
    borderRadius: 80,
  },
  notificationDot: {
    position: 'absolute',
    zIndex: 2,
    top: 2,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 10,
    backgroundColor: styles.colors.primary,
  },
  sideArea: {
    width: 40,
    alignItems: 'center',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredTitle: {
    color: styles.colors.black,
    fontSize: styles.fonSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
