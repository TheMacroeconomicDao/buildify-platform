import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from '../styles';
import HeaderBack from '../headers/HeaderBack';
import Text from '../components/Text';
import {api, retryApiCall} from '../services';
import {notifyError, notifySuccess} from '../services/notify';
import useMediatorOrderSteps from '../hooks/useMediatorOrderSteps';
import {LoadingComponent} from './Loading';

// Компоненты для каждого шага
import Step1Component from '../components/mediator/Step1Component';
import Step2Component from '../components/mediator/Step2Component';
import Step3Component from '../components/mediator/Step3Component';

// Модальные окна
import ArchiveOrderModal from '../components/mediator/ArchiveOrderModal';
import ReturnToAppModal from '../components/mediator/ReturnToAppModal';
import CompleteOrderModal from '../components/mediator/CompleteOrderModal';
import MediatorCommentsChat from '../components/MediatorCommentsChat';

export default function MediatorOrderSteps({navigation, route}) {
  const {t} = useTranslation();
  const {orderId} = route.params;

  const {
    loading,
    refreshing,
    orderData,
    currentStep,
    activeTab,
    setActiveTab,
    stepData,
    modals,
    openModal,
    closeModal,
    fetchOrderDetails,
    handleRefresh,
    moveToNextStep,
    archiveOrder,
    returnToApp,
    updateStepData,
    completeOrderSuccessfully,
    completeOrderWithRejection,
  } = useMediatorOrderSteps(navigation, orderId);

  // Обновляем данные при фокусе экрана
  useFocusEffect(
    React.useCallback(() => {
      fetchOrderDetails();
    }, [orderId]),
  );

  const getStepTitle = step => {
    switch (step) {
      case 1:
        return t('Step 1: Order Details Clarification');
      case 2:
        return t('Step 2: Executor Search');
      case 3:
        return t('Step 3: Project Implementation');
      default:
        return t('Mediator Workflow');
    }
  };

  const getStepDescription = step => {
    switch (step) {
      case 1:
        return t('Contact the client to clarify order details');
      case 2:
        return t('Find and negotiate with an executor');
      case 3:
        return t('Monitor project implementation');
      default:
        return '';
    }
  };

  const renderTabBar = () => (
    <View style={localStyles.tabBar}>
      {[1, 2, 3].map(step => {
        const isActive = activeTab === step;
        const isCompleted = currentStep > step;
        const isAvailable = currentStep >= step;

        return (
          <TouchableOpacity
            key={step}
            style={[
              localStyles.tab,
              isActive && localStyles.activeTab,
              isCompleted && localStyles.completedTab,
              !isAvailable && localStyles.disabledTab,
            ]}
            onPress={() => isAvailable && setActiveTab(step)}
            disabled={!isAvailable}>
            <View style={localStyles.stepNumber}>
              <Text
                style={[
                  localStyles.stepNumberText,
                  isActive && localStyles.activeStepNumberText,
                  isCompleted && localStyles.completedStepNumberText,
                ]}>
                {step}
              </Text>
            </View>
            <Text
              style={[
                localStyles.stepTitle,
                isActive && localStyles.activeStepTitle,
                isCompleted && localStyles.completedStepTitle,
                !isAvailable && localStyles.disabledStepTitle,
              ]}>
              {t(`Step ${step}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStepContent = () => {
    if (!orderData) return null;

    const commonProps = {
      orderData,
      stepData,
      updateStepData,
      openModal,
      navigation,
      t,
    };

    switch (activeTab) {
      case 1:
        return (
          <Step1Component
            {...commonProps}
            onNextStep={() => {
              console.log('MediatorOrderSteps: onNextStep called for step 1');
              moveToNextStep(1);
            }}
          />
        );
      case 2:
        return (
          <Step2Component
            {...commonProps}
            onNextStep={() => moveToNextStep(2)}
          />
        );
      case 3:
        return (
          <Step3Component
            {...commonProps}
            onCompleteSuccess={completeOrderSuccessfully}
            onCompleteRejection={completeOrderWithRejection}
          />
        );

      default:
        return null;
    }
  };

  if (loading && !orderData) {
    return (
      <View style={localStyles.container}>
        <HeaderBack
          action={() => navigation.goBack()}
          title={t('Mediator Workflow')}
        />
        <LoadingComponent text={t('Loading...')} />
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <HeaderBack
        action={() => navigation.goBack()}
        title={
          orderData ? `${t('Order')} #${orderData.id}` : t('Mediator Workflow')
        }
      />

      {/* Заголовок текущего шага */}
      {orderData && (
        <View style={localStyles.stepHeader}>
          <View style={{flex: 1}}>
            <Text style={localStyles.stepHeaderTitle}>
              {getStepTitle(currentStep)}
            </Text>
            <Text style={localStyles.stepHeaderDescription}>
              {getStepDescription(currentStep)}
            </Text>
          </View>
          <TouchableOpacity
            style={localStyles.commentsButton}
            onPress={() =>
              navigation.navigate('MediatorComments', {
                orderId,
                currentStep,
                orderTitle: orderData.title,
              })
            }>
            <Ionicons
              name="chatbubbles"
              size={20}
              color={styles.colors.primary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Табы */}
      {renderTabBar()}

      {/* Контент */}
      <ScrollView
        style={localStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Модальные окна */}
      <ArchiveOrderModal
        visible={modals.archive}
        onClose={() => closeModal('archive')}
        onConfirm={archiveOrder}
        t={t}
      />

      <ReturnToAppModal
        visible={modals.returnToApp}
        onClose={() => closeModal('returnToApp')}
        onConfirm={returnToApp}
        t={t}
      />

      <CompleteOrderModal
        visible={modals.complete}
        onClose={() => closeModal('complete')}
        onCompleteSuccess={completeOrderSuccessfully}
        onCompleteRejection={completeOrderWithRejection}
        t={t}
      />
    </View>
  );
}

const localStyles = {
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.smd,
  },
  stepHeader: {
    backgroundColor: styles.colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: styles.colors.primary,
    gap: 8,
  },
  commentsButtonText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.primary,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  stepHeaderTitle: {
    fontSize: styles.fonSize.md,
    fontWeight: '600',
    color: styles.colors.primary,
    lineHeight: styles.lineHeight.md,
    marginBottom: 4,
  },
  stepHeaderDescription: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: styles.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: styles.colors.primaryLight,
  },
  completedTab: {
    backgroundColor: styles.colors.successLight,
  },
  disabledTab: {
    opacity: 0.5,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: styles.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: styles.fonSize.xs,
    fontWeight: '600',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.xs,
  },
  activeStepNumberText: {
    color: styles.colors.primary,
  },
  completedStepNumberText: {
    color: styles.colors.success,
  },
  stepTitle: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.textSecondary,
    lineHeight: styles.lineHeight.sm,
  },
  activeStepTitle: {
    color: styles.colors.primary,
    fontWeight: '600',
  },
  completedStepTitle: {
    color: styles.colors.success,
  },
  disabledStepTitle: {
    color: styles.colors.textDisabled,
  },
  content: {
    flex: 1,
  },
};
