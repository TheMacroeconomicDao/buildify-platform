import React from 'react';
import {View, TouchableOpacity, Image} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Text from './Text';
import styles from '../styles';
import config, {getAvatarUrl} from '../config';

const CompanyProfileCard = ({userProfile, onPress = () => {}, style = {}}) => {
  const {t} = useTranslation();

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

  const verificationStatus = getVerificationStatus();

  return (
    <TouchableOpacity
      style={[
        {
          width: '100%',
          backgroundColor: styles.colors.white,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24, // Spacing between blocks: 24 units [[memory:5708671]]
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {/* Avatar */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: styles.colors.grayLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}>
          {userProfile?.avatar ? (
            <Image
              source={{uri: getAvatarUrl(userProfile.avatar)}}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
              }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="business" size={32} color={styles.colors.primary} />
          )}
        </View>

        {/* Content */}
        <View style={{flex: 1}}>
          {/* Name */}
          <Text
            style={{
              fontSize: styles.fonSize.md,
              fontWeight: '600',
              color: styles.colors.black,
              marginBottom: 8,
            }}>
            {userProfile?.name || t('User')}
          </Text>

          {/* Verification Status */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Ionicons
              name={verificationStatus.icon}
              size={16}
              color={verificationStatus.color}
            />
            <Text
              style={{
                fontSize: styles.fonSize.sm,
                color: verificationStatus.color,
                fontWeight: '500',
                marginLeft: 6,
              }}>
              {verificationStatus.text}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color={styles.colors.gray} />
      </View>
    </TouchableOpacity>
  );
};

export default CompanyProfileCard;
