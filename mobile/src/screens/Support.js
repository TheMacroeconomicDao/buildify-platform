import React from 'react';
import {
  View,
  TouchableOpacity,
  Linking,
  ScrollView,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import HeaderBack from '../headers/HeaderBack';

export default function Support({navigation}) {
  const {t} = useTranslation();

  return (
    <SafeAreaView style={localStyles.container}>
      <HeaderBack
        title={t('Support')}
        action={() => navigation.goBack()}
        center={false}
      />

      <ScrollView
        stСyle={localStyles.scrollView}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Contact Information */}
        <View style={localStyles.contactCard}>
          <Text style={localStyles.sectionTitle}>
            {t('Contact Information')}
          </Text>

          <TouchableOpacity
            style={localStyles.contactRow}
            onPress={() => Linking.openURL('mailto:support@buildlify.com')}>
            <Ionicons name="mail" size={16} color={styles.colors.actionGray} />
            <View style={localStyles.contactContent}>
              <Text style={localStyles.contactLabel}>{t('Email')}</Text>
              <Text style={localStyles.emailText}>support@buildlify.com</Text>
            </View>
          </TouchableOpacity>

          <View style={localStyles.contactRow}>
            <Ionicons name="time" size={16} color={styles.colors.actionGray} />
            <View style={localStyles.contactContent}>
              <Text style={localStyles.contactLabel}>{t('Working hours')}</Text>
              <Text style={localStyles.infoText}>
                {t('9:00 - 18:00 (GMT+4)')}
              </Text>
            </View>
          </View>

          <View style={[localStyles.contactRow, localStyles.contactRowLast]}>
            <Ionicons
              name="language"
              size={16}
              color={styles.colors.actionGray}
            />
            <View style={localStyles.contactContent}>
              <Text style={localStyles.contactLabel}>{t('Languages')}</Text>
              <Text style={localStyles.infoText}>{t('English, Arabic')}</Text>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <TouchableOpacity
          style={localStyles.faqCard}
          onPress={() => navigation.navigate('FAQ')}>
          <View style={localStyles.faqContent}>
            <View style={localStyles.faqLeft}>
              <Text style={localStyles.faqTitle}>
                {t('Frequently Asked Questions')}
              </Text>
              <Text style={localStyles.faqSubtitle}>
                {t('Find answers to common questions')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={styles.colors.actionGray}
            />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: styles.paddingHorizontal,
    paddingBottom: 80,
  },
  headerSection: {
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: styles.fonSize.h2,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 8,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.regular,
    lineHeight: 20,
  },

  // Contact Card
  contactCard: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  contactRowLast: {
    borderBottomWidth: 0,
  },
  contactContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: styles.fonSize.xs,
    fontWeight: '500',
    color: styles.colors.actionGray,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emailText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.primary,
    fontWeight: '500',
  },
  infoText: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.titles,
    lineHeight: 20,
  },

  // FAQ Section
  faqCard: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  faqContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqLeft: {
    flex: 1,
  },
  faqTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 4,
  },
  faqSubtitle: {
    fontSize: styles.fonSize.sm,
    fontWeight: '400',
    color: styles.colors.regular,
    lineHeight: 18,
  },
});
