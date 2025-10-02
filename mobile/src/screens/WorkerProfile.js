import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import config, {getAvatarUrl} from '../config';
import styles from '../styles';
import {LoadingComponent} from './Loading';import useWorkerProfile from '../hooks/useWorkerProfile';
import ReportUserModal from '../Modals/ReportUserModal';
import {api, retryApiCall} from '../services/index';
import {notifyError, notifySuccess} from '../services/notify';

export default function WorkerProfile({navigation, route}) {
  const {executorId, responseStatus, fromOrder, orderId, responseId} =
    route.params || {}; // Если передан executorId, показываем чужой профиль
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const [isReportModalVisible, setIsReportModalVisible] = React.useState(false);
  const [processingAction, setProcessingAction] = React.useState(false);
  const [actionCompleted, setActionCompleted] = React.useState(false);

  // Функция отправки контактов
  const sendContacts = async () => {
    try {
      setProcessingAction(true);
      const response = await retryApiCall(() =>
        api.orders.responsesSendContact(orderId, responseId),
      );

      if (response.success) {
        notifySuccess(t('Success'), t('Contacts sent successfully'));
        setActionCompleted(true);
        navigation.goBack();
      } else {
        throw new Error(response.message || 'Failed to send contacts');
      }
    } catch (error) {
      notifyError(t('Error'), error.message || t('Failed to send contacts'));
    } finally {
      setProcessingAction(false);
    }
  };

  // Функция отклонения отклика
  const rejectResponse = async () => {
    try {
      setProcessingAction(true);
      const response = await retryApiCall(() =>
        api.orders.responsesReject(orderId, responseId),
      );

      if (response.success) {
        notifySuccess(t('Success'), t('Response rejected'));
        setActionCompleted(true);
        navigation.goBack();
      } else {
        throw new Error(response.message || 'Failed to reject response');
      }
    } catch (error) {
      notifyError(t('Error'), error.message || t('Failed to reject response'));
    } finally {
      setProcessingAction(false);
    }
  };

  // Функция выбора исполнителя
  const choosePerformer = async () => {
    try {
      setProcessingAction(true);
      const response = await retryApiCall(() =>
        api.orders.responsesSelect(orderId, responseId),
      );

      if (response.success) {
        notifySuccess(t('Success'), t('Performer selected'));
        setActionCompleted(true);
        navigation.goBack();
      } else {
        throw new Error(response.message || 'Failed to select performer');
      }
    } catch (error) {
      notifyError(t('Error'), error.message || t('Failed to select performer'));
    } finally {
      setProcessingAction(false);
    }
  };

  // Функция для проверки, должны ли контакты исполнителя быть видимыми заказчику
  const shouldShowExecutorContacts = () => {
    // КРИТИЧЕСКИ ВАЖНО: Если это переход из заказа, контакты скрыты по умолчанию!
    if (fromOrder) {
      // Показываем контакты ТОЛЬКО если исполнитель отправил свои контакты (status >= 3)
      return responseStatus >= 3;
    }

    // Если это НЕ переход из заказа (обычный просмотр профиля)
    // Показываем контакты только если нет контекста заказа
    if (responseStatus === undefined) {
      return true;
    }

    // Если есть responseStatus, но fromOrder = false - скрываем для безопасности
    return false;
  };

  const {
    userData,
    notificationCount,
    rating,
    reviewsCount,
    isPerformer,
    isOwnProfile,
    loading,
    menuItems,
    navigateToScreen,
  } = useWorkerProfile(navigation, executorId); // Передаем executorId в хук

  // Функция для звонка
  const handleCall = async phoneNumber => {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);

      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          t('Error'),
          t('Phone calls are not supported on this device'),
        );
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert(t('Error'), t('Failed to make phone call'));
    }
  };

  // Функция для отправки сообщения
  const handleMessage = async phoneNumber => {
    try {
      const smsUrl = `sms:${phoneNumber}`;
      const supported = await Linking.canOpenURL(smsUrl);

      if (supported) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert(t('Error'), t('SMS is not supported on this device'));
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert(t('Error'), t('Failed to send message'));
    }
  };

  const ProfileMenuItem = ({title, badge, onPress, isLast = false}) => {
    const isLogout = title === t('Log out');

    return (
      <TouchableOpacity
        style={[profileStyles.menuItem, isLast && profileStyles.menuItemLast]}
        onPress={onPress}>
        <View style={profileStyles.menuItemLeft}>
          <Text
            style={[
              profileStyles.menuItemTitle,
              isLogout && profileStyles.logoutText,
            ]}>
            {title}
          </Text>
          {badge && (
            <View style={profileStyles.badge}>
              <MaterialCommunityIcons name="crown" size={13} color="#F5D935" />
              <Text style={profileStyles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isLogout ? '#FF3B30' : '#323232'}
        />
      </TouchableOpacity>
    );
  };

  // Если загружается внешний профиль
  if (loading && !userData) {
    return (
      <View style={profileStyles.loadingContainer}>
        <LoadingComponent text={t('Loading...')} />
      </View>
    );
  }

  return (
    <View style={profileStyles.container}>
      {/* HEADER */}
      {!isOwnProfile ? (
        <HeaderBack title={t('Executor')} action={() => navigation.goBack()} />
      ) : (
        <>
          <View style={[profileStyles.header, {paddingTop: insets.top + 16}]}>
            <View style={profileStyles.headerContent}>
              <Text style={profileStyles.headerTitle}>{t('Account')}</Text>
              <View style={profileStyles.notificationButtonWrapper}>
                <TouchableOpacity
                  style={profileStyles.notificationButton}
                  onPress={() => navigateToScreen('Notifications')}>
                  <Ionicons name="notifications" size={16} color="#3579F5" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={profileStyles.headerSeparator} />
        </>
      )}

      <ScrollView
        style={profileStyles.scrollView}
        contentContainerStyle={profileStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        {/* PROFILE BLOCK */}
        <View style={profileStyles.profileBlock}>
          {userData?.avatar ? (
            <Image
              source={{uri: getAvatarUrl(userData.avatar)}}
              style={profileStyles.avatar}
            />
          ) : (
            <View style={profileStyles.avatarPlaceholder}>
              <Ionicons name="person" size={30} color="#3579F5" />
            </View>
          )}

          <View style={profileStyles.profileInfo}>
            <Text style={profileStyles.userName}>
              {userData?.name || t('User')}
            </Text>
            {/* ✅ Показываем рейтинг только для исполнителей (type === 0) */}
            {isPerformer && (
              <View style={profileStyles.ratingContainer}>
                <View style={profileStyles.ratingBlock}>
                  <Ionicons name="star" size={16} color="#FFEA49" />
                  <Text style={profileStyles.ratingText}>{rating}</Text>
                </View>
                <View style={profileStyles.reviewsBlock}>
                  <Ionicons name="people" size={16} color="#8A94A0" />
                  <Text style={profileStyles.reviewsText}>
                    {reviewsCount} {t('reviews')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* CONTACT INFO - только для чужих профилей */}
        {!isOwnProfile && userData && (
          <View style={profileStyles.infoCard}>
            <Text style={profileStyles.cardTitle}>
              {t('Contact Information')}
            </Text>

            {shouldShowExecutorContacts() ? (
              <>
                {userData.phone && (
                  <View style={profileStyles.infoRow}>
                    <Ionicons
                      name="call"
                      size={16}
                      color={styles.colors.primary}
                    />
                    <Text style={profileStyles.infoText}>{userData.phone}</Text>
                  </View>
                )}

                {userData.email && (
                  <View style={profileStyles.infoRow}>
                    <Ionicons
                      name="mail"
                      size={16}
                      color={styles.colors.primary}
                    />
                    <Text style={profileStyles.infoText}>{userData.email}</Text>
                  </View>
                )}

                {/* Кнопки действий */}
                <View style={profileStyles.actionButtons}>
                  {userData.phone && (
                    <TouchableOpacity
                      style={profileStyles.actionButton}
                      onPress={() => handleCall(userData.phone)}>
                      <Ionicons name="call" size={16} color="#FFFFFF" />
                      <Text style={profileStyles.actionButtonText}>
                        {t('Call')}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {userData.phone && (
                    <TouchableOpacity
                      style={[
                        profileStyles.actionButton,
                        profileStyles.secondaryButton,
                      ]}
                      onPress={() => handleMessage(userData.phone)}>
                      <Ionicons
                        name="chatbubble"
                        size={16}
                        color={styles.colors.primary}
                      />
                      <Text
                        style={[
                          profileStyles.actionButtonText,
                          profileStyles.secondaryButtonText,
                        ]}>
                        {t('Message')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              // Показываем сообщение о недоступности контактов
              <View style={profileStyles.contactsUnavailable}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={styles.colors.gray}
                />
                <Text style={profileStyles.contactsUnavailableText}>
                  {t(
                    'Executor contacts will be available after they send their contacts',
                  )}
                </Text>
              </View>
            )}

            {/* Кнопка жалобы - всегда доступна */}
            <View style={profileStyles.actionButtons}>
              {!isOwnProfile && (
                <TouchableOpacity
                  style={[
                    profileStyles.actionButton,
                    profileStyles.reportButton,
                  ]}
                  onPress={() => setIsReportModalVisible(true)}>
                  <Ionicons name="flag" size={16} color="#FF3B30" />
                  <Text
                    style={[
                      profileStyles.actionButtonText,
                      profileStyles.reportButtonText,
                    ]}>
                    {t('Report')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* CATEGORIES - только для исполнителей */}
        {isPerformer &&
          userData?.categories &&
          userData.categories.length > 0 && (
            <View style={profileStyles.infoCard}>
              <Text style={profileStyles.cardTitle}>{t('Services')}</Text>

              <View style={profileStyles.categoriesContainer}>
                {userData.categories.map((category, index) => (
                  <View key={index} style={profileStyles.categoryTag}>
                    <Text style={profileStyles.categoryText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* DESCRIPTION - если есть */}
        {userData?.description && (
          <View style={profileStyles.infoCard}>
            <Text style={profileStyles.cardTitle}>{t('About')}</Text>
            <Text style={profileStyles.descriptionText}>
              {userData.description}
            </Text>
          </View>
        )}

        {/* SETTINGS LIST */}
        <View style={profileStyles.settingsList}>
          {menuItems.map((item, index) => (
            <ProfileMenuItem
              key={index}
              title={item.title}
              badge={item.badge}
              onPress={item.onPress}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </View>

        {/* Кнопки действий для заказчика */}
        {fromOrder && orderId && responseId && !actionCompleted && (
          <View>
            {/* Статус 0 - новый отклик, можно отправить контакты или отклонить */}
            {responseStatus === 0 && (
              <View style={profileStyles.actionButtonsContainer}>
                <TouchableOpacity
                  style={profileStyles.primaryButton}
                  onPress={sendContacts}
                  disabled={processingAction}>
                  <Text style={profileStyles.primaryButtonText}>
                    {processingAction ? t('Loading...') : t('Send contacts')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={profileStyles.rejectButton}
                  onPress={rejectResponse}
                  disabled={processingAction}>
                  <Text style={profileStyles.rejectButtonText}>
                    {t('Reject')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Статус 3 или 4 - контакты обменялись, можно выбрать исполнителя или отклонить */}
            {(responseStatus === 3 || responseStatus === 4) && (
              <View style={profileStyles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[profileStyles.primaryButton, {width: '65%'}]}
                  onPress={choosePerformer}
                  disabled={processingAction}>
                  <Text style={profileStyles.primaryButtonText}>
                    {processingAction ? t('Loading...') : t('Choose performer')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[profileStyles.rejectButton, {width: '30%'}]}
                  onPress={rejectResponse}
                  disabled={processingAction}>
                  <Text style={profileStyles.rejectButtonText}>
                    {t('Reject')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Модальное окно жалобы */}
      {isReportModalVisible && (
        <ReportUserModal
          reportedUser={userData}
          hide={() => setIsReportModalVisible(false)}
        />
      )}
    </View>
  );
}

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    height: 20,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 20,
    color: '#000000',
  },
  notificationButtonWrapper: {
    position: 'relative',
  },
  notificationButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F9F9F9',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 15,
    height: 15,
    backgroundColor: '#F54E4E',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 11,
    color: '#FFFFFF',
  },
  headerSeparator: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#323232',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A94A0',
  },
  reviewsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A94A0',
  },

  settingsList: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 16.9,
    elevation: 5,
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#323232',
    letterSpacing: -0.006,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    height: 22,
    backgroundColor: '#323232',
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  // Стили для информационных карточек
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
  },

  // Стили для контактной информации
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 8,
  },

  // Стили для статистики
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '500',
    color: '#3579F5',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#8A94A0',
    textAlign: 'center',
  },

  // Стили для категорий
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#323232',
  },

  // Стили для описания
  descriptionText: {
    fontSize: 14,
    color: '#323232',
    lineHeight: 20,
  },

  // Стили для кнопок действий
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3579F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3579F5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#3579F5',
  },
  reportButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  reportButtonText: {
    color: '#FF3B30',
  },

  // Стили для недоступных контактов
  contactsUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    marginVertical: 8,
    gap: 12,
  },
  contactsUnavailableText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },

  // Стиль для кнопки выхода
  logoutText: {
    color: '#FF3B30',
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },

  primaryButton: {
    flex: 1,
    padding: 10,
    backgroundColor: styles.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: styles.colors.primary,
  },

  primaryButtonText: {
    color: styles.colors.white,
    fontWeight: '500',
  },

  rejectButton: {
    width: '30%',
    padding: 10,
    backgroundColor: styles.colors.white,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: styles.colors.red,
  },

  rejectButtonText: {
    color: styles.colors.red,
    fontWeight: '500',
  },

  scrollViewContent: {
    paddingBottom: 100, // Добавляем отступ внизу для прокрутки
    flexGrow: 1,
  },
});
