import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import styles from '../styles';

export default function AboutApp({navigation}) {
  const {t} = useTranslation();

  const appVersion = '1.0.0';
  const buildNumber = '1';

  return (
    <View style={localStyles.container}>
      <HeaderBack title={t('About app')} action={() => navigation.goBack()} />

      <ScrollView
        style={localStyles.content}
        showsVerticalScrollIndicator={false}>
        <View style={localStyles.infoContainer}>
          {/* App Info Section */}
          <View style={localStyles.section}>
            <Text style={localStyles.appName}>Buildlify</Text>
            <Text style={localStyles.appDescription}>
              {t('Professional platform for construction services in Dubai')}
            </Text>
          </View>

          {/* Version Info */}
          <View style={localStyles.section}>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>{t('Version')}</Text>
              <Text style={localStyles.infoValue}>{appVersion}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>{t('Build')}</Text>
              <Text style={localStyles.infoValue}>{buildNumber}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Description')}</Text>
            <Text style={localStyles.description}>
              {t(
                'Buildlify is a comprehensive platform that connects customers with verified construction professionals in Dubai. Our app provides AI-powered interior design generation, secure payment processing, and quality assurance for all construction projects.',
              )}
            </Text>
          </View>

          {/* Features */}
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Key Features')}</Text>
            <View style={localStyles.featuresList}>
              <Text style={localStyles.featureItem}>
                • {t('AI Interior Design Generation')}
              </Text>
              <Text style={localStyles.featureItem}>
                • {t('Verified Construction Professionals')}
              </Text>
              <Text style={localStyles.featureItem}>
                • {t('Secure Payment System')}
              </Text>
              <Text style={localStyles.featureItem}>
                • {t('Real-time Project Tracking')}
              </Text>
              <Text style={localStyles.featureItem}>
                • {t('Quality Assurance & Reviews')}
              </Text>
              <Text style={localStyles.featureItem}>
                • {t('Multi-language Support')}
              </Text>
            </View>
          </View>

          {/* Technical Info */}
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>
              {t('Technical Information')}
            </Text>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>{t('Platform')}</Text>
              <Text style={localStyles.infoValue}>React Native</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>{t('Supported OS')}</Text>
              <Text style={localStyles.infoValue}>iOS 12.0+, Android 6.0+</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>{t('Languages')}</Text>
              <Text style={localStyles.infoValue}>English, العربية</Text>
            </View>
          </View>

          {/* Contact */}
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Contact')}</Text>
            <Text style={localStyles.contactText}>
              {t(
                'For support and inquiries, please contact us through the Technical Support section in the app menu.',
              )}
            </Text>
          </View>

          {/* Copyright */}
          <View style={localStyles.section}>
            <Text style={localStyles.copyrightText}>
              © 2025 Buildlify. {t('All rights reserved.')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  content: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: styles.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  appDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: styles.colors.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: styles.colors.black,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: styles.colors.regular,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: styles.colors.regular,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: styles.colors.black,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 15,
    fontWeight: '400',
    color: styles.colors.regular,
    lineHeight: 22,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '400',
    color: styles.colors.regular,
    lineHeight: 22,
  },
  copyrightText: {
    fontSize: 13,
    fontWeight: '400',
    color: styles.colors.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
});
