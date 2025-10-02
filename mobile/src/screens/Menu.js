import React from 'react';
import {ScrollView, View, RefreshControl, StyleSheet} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import ErrorsModal from '../Modals/ErrorsModal';
import MenuItem from '../components/MenuItem';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

import LogoutModaal from '../Modals/LogoutModaal';
import useMenu from '../hooks/useMenu';

export default function Menu({navigation}) {
  const {
    refreshing,
    errors,
    userData,
    handleRefresh,
    showLogout,
    resetOnboarding,
    navigateToProfile,
    navigateToNotifications,
    navigateToSupport,
    navigateToSubscription,
    navigateToLanguage,
    navigateToPortfolio,
    navigateToReferrals,
    notificationsCount,
    openLogoutModal,
    closeLogoutModal,
    subscriptionIndicator,
  } = useMenu(navigation);

  const {t} = useTranslation();

  // Определяем, показывать ли портфолио
  // 0 - исполнитель, 1 - заказчик, 2 - посредник
  const userType = userData?.type;
  const verificationStatus = userData?.verification_status || 0;
  const isVerifiedWorker =
    userType === 0 && (verificationStatus === 1 || verificationStatus === 3);
  const isVerifiedCustomer =
    userData?.is_verified === 1 || userData?.is_verified === true;

  // Показываем портфолио только исполнителям или верифицированным заказчикам
  const shouldShowPortfolio =
    userType === 0 || (userType === 1 && isVerifiedCustomer);

  // Для посредников показываем специальные пункты меню
  const isMediator = userType === 2;

  return (
    <LinearGradient
      start={{x: -0.4, y: 0.9}}
      end={{x: 1, y: 1}}
      colors={['#ffffff', styles.colors.white]}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
      }}>
      {showLogout && <LogoutModaal hide={closeLogoutModal} />}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={{
          width: '100%',
          height: '100%',
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          minHeight: '100%',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 15,
          paddingBottom: 50,
          backgroundColor: styles.colors.highlight,
        }}>
        <View
          style={{
            borderRadius: 8,
            width: '97%',
            backgroundColor: styles.colors.white,
            padding: 10,
            gap: 4,
            marginHorizontal: 3,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 5,
          }}>
          <MenuItem title={t('Profile')} onPress={navigateToProfile} />
          <MenuItem
            title={t('Notifications')}
            onPress={navigateToNotifications}
            badge={notificationsCount}
          />
          <MenuItem
            title={t('Subscription')}
            onPress={navigateToSubscription}
            subscriptionIndicator={subscriptionIndicator}
          />
          {shouldShowPortfolio && (
            <MenuItem title={t('Portfolio')} onPress={navigateToPortfolio} />
          )}
          {isMediator && (
            <MenuItem
              title={t('Project Management')}
              onPress={() => navigation.navigate('MediatorProjects')}
            />
          )}
          <MenuItem title={t('Support')} onPress={navigateToSupport} />
          <MenuItem
            title={t('Language settings')}
            onPress={navigateToLanguage}
          />

          <MenuItem title={t('Log out')} onPress={openLogoutModal} no_border />

          <Text
            style={{
              color: styles.colors.regular,
              fontSize: styles.fonSize.md,
              fontWeight: '200',
              marginLeft: 10,
              marginTop: 40,
            }}>
            {t('App Version')}: 0.01
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const localStyles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  bar: {
    marginTop: 4,
    width: 5,
    height: 12,
    borderRadius: 2,
    borderColor: '#ccc',
    borderWidth: 0.5,
  },
  barFilled: {
    backgroundColor: '#ccc',
  },
  barEmpty: {
    backgroundColor: '#fff',
  },
});
