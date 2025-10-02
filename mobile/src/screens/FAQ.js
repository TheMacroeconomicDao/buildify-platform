import React, {useState} from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HeaderBack from '../headers/HeaderBack';

export default function FAQ({navigation}) {
  const {t} = useTranslation();
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleItem = id => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  const faqData = [
    {
      id: 'what_is_buildify',
      question: t('What is Buildify?'),
      answer: t(
        'Buildify is a platform that connects customers with verified construction workers and specialists. Whether you need repairs, renovations, or design services, we help you find qualified professionals in your area.',
      ),
    },
    {
      id: 'how_to_create_order',
      question: t('How do I create an order?'),
      answer: t(
        'To create an order: 1) Go to the "Create order" tab, 2) Select the type of work you need, 3) Add a description and photos, 4) Set your budget and timeline, 5) Submit the order. Workers will then respond with their proposals.',
      ),
    },
    {
      id: 'how_payment_works',
      question: t('How does payment work?'),
      answer: t(
        'Payment is processed securely through our platform. You can set your budget when creating an order, and payment is released to the worker once the job is completed to your satisfaction.',
      ),
    },
    {
      id: 'worker_verification',
      question: t('Are all workers verified?'),
      answer: t(
        'Yes, all workers on our platform must upload and verify their professional licenses. Our team reviews each application to ensure only qualified professionals can work on your projects.',
      ),
    },
    {
      id: 'how_to_become_worker',
      question: t('How can I become a worker on the platform?'),
      answer: t(
        'To become a worker: 1) Register and select "I am a performer", 2) Upload your professional license, 3) Complete your profile with experience and portfolio, 4) Wait for verification approval, 5) Start browsing and responding to orders.',
      ),
    },
    {
      id: 'subscription_benefits',
      question: t('What are the benefits of subscription?'),
      answer: t(
        'Subscription gives workers access to more orders, the ability to view customer contacts, and increased response limits. Different plans offer different benefits to help grow your business.',
      ),
    },
    {
      id: 'ai_design',
      question: t('What is AI design generation?'),
      answer: t(
        'Our AI design generation feature allows you to create interior design concepts based on your photos and descriptions. Simply upload images of your space and describe what you want - our AI will generate design options for you.',
      ),
    },
    {
      id: 'portfolio_importance',
      question: t('Why is portfolio important?'),
      answer: t(
        'Your portfolio showcases your previous work and helps customers understand your style and quality. A strong portfolio with high-quality images increases your chances of being selected for orders.',
      ),
    },
    {
      id: 'order_status',
      question: t('What do different order statuses mean?'),
      answer: t(
        'Order statuses help track progress: "Published" - order is live and accepting responses, "In review" - customer is reviewing responses, "In progress" - work is being done, "Completed" - work is finished and approved.',
      ),
    },
    {
      id: 'support_contact',
      question: t('How can I contact support?'),
      answer: t(
        'You can contact our support team through the "Support" section in the menu. Describe your issue and our team will help you resolve it as quickly as possible.',
      ),
    },
    {
      id: 'app_languages',
      question: t('What languages does the app support?'),
      answer: t(
        'Currently, the app supports English and Arabic. You can change the language in Settings > Language settings at any time.',
      ),
    },
    {
      id: 'account_security',
      question: t('How is my account secured?'),
      answer: t(
        'We use industry-standard security measures including encrypted data transmission, secure authentication, and regular security audits to protect your personal information and transactions.',
      ),
    },
  ];

  const FAQItem = ({item}) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <View style={localStyles.faqItem}>
        <TouchableOpacity
          style={localStyles.questionContainer}
          onPress={() => toggleItem(item.id)}
          activeOpacity={0.7}>
          <View style={localStyles.questionRow}>
            <Text style={localStyles.questionText}>{item.question}</Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={styles.colors.primary}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={localStyles.answerContainer}>
            <Text style={localStyles.answerText}>{item.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: styles.colors.background}}>
      <HeaderBack title={t('FAQ')} action={() => navigation.goBack()} />

      <LinearGradient
        start={{x: -0.4, y: 0.9}}
        end={{x: 1, y: 1}}
        colors={['#ffffff', styles.colors.white]}
        style={localStyles.container}>
        <ScrollView
          style={localStyles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={localStyles.scrollContent}>
          <View style={localStyles.headerSection}>
            <Text style={localStyles.headerTitle}>
              {t('Frequently Asked Questions')}
            </Text>
            <Text style={localStyles.headerSubtitle}>
              {t('Find answers to common questions about using Buildify')}
            </Text>
          </View>

          <View style={localStyles.faqContainer}>
            {faqData.map(item => (
              <FAQItem key={item.id} item={item} />
            ))}
          </View>

          <View style={localStyles.contactSection}>
            <Text style={localStyles.contactTitle}>
              {t('Still have questions?')}
            </Text>
            <Text style={localStyles.contactText}>
              {t('Contact our support team for personalized help')}
            </Text>
            <TouchableOpacity
              style={localStyles.supportButton}
              onPress={() => navigation.navigate('Support')}
              activeOpacity={0.8}>
              <Text style={localStyles.supportButtonText}>
                {t('Contact Support')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerSection: {
    padding: 20,
    paddingBottom: 15,
    paddingTop: 15,
  },
  headerTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 8,
    lineHeight: styles.fonSize.lg * 1.3,
    flexWrap: 'wrap',
  },
  headerSubtitle: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.regular,
    lineHeight: styles.fonSize.smd * 1.4,
  },
  faqContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  faqItem: {
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D4D4D4',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  questionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: styles.fonSize.smd,
    fontWeight: '500',
    color: styles.colors.titles,
    flex: 1,
    paddingRight: 12,
    lineHeight: styles.fonSize.smd * 1.3,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: styles.colors.grayLight,
  },
  answerText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: styles.fonSize.sm * 1.6,
    textAlign: 'left',
  },
  contactSection: {
    margin: 20,
    marginTop: 30,
    padding: 20,
    backgroundColor: styles.colors.white,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D4D4D4',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 8,
    textAlign: 'center',
  },
  contactText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: styles.fonSize.sm * 1.4,
  },
  supportButton: {
    backgroundColor: styles.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 150,
    shadowColor: '#D4D4D4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  supportButtonText: {
    fontSize: styles.fonSize.sm,
    fontWeight: '600',
    color: styles.colors.primaryText,
    textAlign: 'center',
  },
});
