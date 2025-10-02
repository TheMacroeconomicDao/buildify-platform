import React from 'react';
import {View, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Text from './Text';
import styles from '../styles';
import config, {getAvatarUrl} from '../config';

const UnifiedInfoCard = ({
  userProfile,
  wallet,
  tariff,
  currentSubscription,
  days_until_expiration,
  remaining_orders,
  remaining_contacts,
  onProfilePress = () => {},
  onWalletPress = () => {},
  onSubscriptionPress = () => {},
  style = {},
  userType = 0, // 0 - исполнитель, 1 - заказчик
}) => {
  const {t} = useTranslation();

  // Отладка для Free тарифа
  console.log('🔍 UnifiedInfoCard props:', {
    tariff,
    currentSubscription,
    days_until_expiration,
    userType,
  });

  const getVerificationStatus = () => {
    switch (userProfile?.verification_status) {
      case 1: // Approved
        return {
          text: t('Verified'),
          color: styles.colors.green,
          icon: 'checkmark-circle',
        };
      case 0: // Pending
        return {
          text: t('Pending verification'),
          color: '#FF9500',
          icon: 'time',
        };
      case 2: // Rejected
        return {
          text: t('Not verified'),
          color: styles.colors.red,
          icon: 'close-circle',
        };
      case 3: // NotRequired
        return {
          text: t('Not verified'),
          color: styles.colors.gray,
          icon: 'help-circle',
        };
      default:
        return {
          text: t('Not verified'),
          color: styles.colors.gray,
          icon: 'help-circle',
        };
    }
  };

  const formatBalance = cents => {
    const value = (cents || 0) / 100;
    return value.toFixed(2);
  };

  const verificationStatus = getVerificationStatus();

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: styles.colors.white,
          borderRadius: 16,
          padding: 16,
          marginBottom: 24, // Spacing between blocks: 24 units [[memory:5708671]]
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        style,
      ]}>
      {/* Profile Section */}
      <TouchableOpacity
        onPress={onProfilePress}
        activeOpacity={0.8}
        style={localStyles.profileSection}>
        <View style={localStyles.profileHeader}>
          {/* Avatar */}
          <View style={localStyles.avatarContainer}>
            {userProfile?.avatar ? (
              <Image
                source={{uri: getAvatarUrl(userProfile.avatar)}}
                style={localStyles.avatar}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name="business"
                size={24}
                color={styles.colors.primary}
              />
            )}
          </View>

          {/* Name and Verification */}
          <View style={localStyles.profileInfo}>
            <Text style={localStyles.profileName}>
              {userProfile?.name || t('User')}
            </Text>
            <View style={localStyles.verificationContainer}>
              <Ionicons
                name={verificationStatus.icon}
                size={14}
                color={verificationStatus.color}
              />
              <Text
                style={[
                  localStyles.verificationText,
                  {color: verificationStatus.color},
                ]}>
                {verificationStatus.text}
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={16}
            color={styles.colors.gray}
          />
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <View style={localStyles.divider} />

      {/* Balance Section */}
      <TouchableOpacity
        style={localStyles.balanceSection}
        onPress={onWalletPress}
        activeOpacity={0.8}>
        <View style={localStyles.sectionContent}>
          <View style={localStyles.sectionIconContainer}>
            <Ionicons name="wallet" size={16} color={styles.colors.primary} />
          </View>
          <View style={localStyles.sectionInfo}>
            <Text style={localStyles.sectionLabel}>{t('Balance')}</Text>
            <Text style={localStyles.sectionValue}>
              {formatBalance(wallet?.balance)}{' '}
              {wallet?.currency?.toUpperCase?.() || 'AED'}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={styles.colors.gray}
          />
        </View>
      </TouchableOpacity>

      {/* Horizontal Divider */}
      {userType === 0 && <View style={localStyles.horizontalDivider} />}

      {/* Subscription Section */}
      {userType === 0 && (
        <TouchableOpacity
          style={localStyles.subscriptionSection}
          onPress={onSubscriptionPress}
          activeOpacity={0.8}>
          <View style={localStyles.sectionContent}>
            <View style={localStyles.sectionIconContainer}>
              <Ionicons name="card" size={16} color={styles.colors.primary} />
            </View>
            <View style={localStyles.sectionInfo}>
              <Text style={localStyles.sectionLabel}>
                {String(tariff?.name || t('No active tariff'))}
              </Text>
              {tariff ? (
                <View>
                  <Text style={localStyles.sectionValue}>
                    {String(tariff.price || 0)} AED /{' '}
                    {String(tariff.duration_days || 30)} {String(t('days'))}
                  </Text>
                  {days_until_expiration !== null &&
                    days_until_expiration !== undefined && (
                      <Text
                        style={[
                          localStyles.daysLeftText,
                          {
                            color:
                              days_until_expiration <= 0
                                ? styles.colors.red
                                : days_until_expiration <= 3
                                ? '#FF9500'
                                : styles.colors.green,
                          },
                        ]}>
                        {String(
                          days_until_expiration > 0
                            ? `${days_until_expiration} ${t('days left')}`
                            : days_until_expiration === 0
                            ? t('Expires today')
                            : t('Expired'),
                        )}
                      </Text>
                    )}
                  {tariff &&
                    tariff.max_orders !== undefined &&
                    tariff.max_orders !== null && (
                      <Text
                        style={[
                          localStyles.daysLeftText,
                          {color: styles.colors.actionGray},
                        ]}>
                        {String(t('Orders limit'))}:{' '}
                        {remaining_orders !== undefined
                          ? `${remaining_orders}/${tariff.max_orders}`
                          : String(tariff.max_orders)}
                      </Text>
                    )}
                  {days_until_expiration === null &&
                    tariff?.name === 'Free' && (
                      <Text
                        style={[
                          localStyles.daysLeftText,
                          {color: styles.colors.primary},
                        ]}>
                        {String(t('Unlimited'))}
                      </Text>
                    )}
                </View>
              ) : (
                <Text style={localStyles.sectionValue}>
                  {String(t('Subscribe to get more features'))}
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={styles.colors.gray}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  profileSection: {
    width: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: styles.colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // Spacing between elements: 12 units [[memory:5708671]]
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: styles.fonSize.smd,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 4,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: styles.fonSize.xs,
    fontWeight: '400',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: styles.colors.border,
    marginVertical: 12, // Spacing between elements: 12 units [[memory:5708671]]
  },
  balanceSection: {
    paddingVertical: 8,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: styles.colors.border,
    marginVertical: 8,
  },
  subscriptionSection: {
    paddingVertical: 8,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: styles.colors.primaryLight || styles.colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // Spacing between elements: 12 units [[memory:5708671]]
  },
  sectionInfo: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
    marginBottom: 2,
    fontWeight: '400',
  },
  sectionValue: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.titles,
  },
  daysLeftText: {
    fontSize: styles.fonSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default UnifiedInfoCard;
