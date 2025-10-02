import React from 'react';
import {View, TouchableOpacity, StyleSheet, Linking} from 'react-native';
import {notifyError} from '../services/notify';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import styles from '../styles';

const ContactsBlock = ({profile}) => {
  const {t} = useTranslation();

  // Используем instagram_url из профиля
  const instagramUrl = profile?.instagram_url;

  if (!instagramUrl) {
    return null;
  }

  const handleInstagramPress = () => {
    // Добавляем https:// если URL не содержит протокол
    let url = instagramUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          notifyError(t('Error'), t('Failed to open link'));
        }
      })
      .catch(err => {
        console.error('Error opening Instagram link:', err);
        notifyError(t('Error'), t('Failed to open link'));
      });
  };

  return (
    <View style={contactStyles.container}>
      <Text style={contactStyles.title}>{t('Contacts')}</Text>

      <View style={contactStyles.contactsList}>
        <TouchableOpacity
          style={contactStyles.contactItem}
          onPress={handleInstagramPress}
          activeOpacity={0.7}>
          <View style={contactStyles.contactIcon}>
            <Ionicons
              name="logo-instagram"
              size={20}
              color={styles.colors.primary}
            />
          </View>
          <View style={contactStyles.contactInfo}>
            <Text style={contactStyles.contactLabel}>Instagram</Text>
            <Text style={contactStyles.contactValue}>{instagramUrl}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={styles.colors.actionGray}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const contactStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  contactsList: {
    backgroundColor: styles.colors.white,
    marginHorizontal: 16,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: styles.colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.titles,
    fontWeight: '500',
  },
});

export default ContactsBlock;
