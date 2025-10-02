import React, {useState} from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import HeaderBack from '../headers/HeaderBack';
import Text from '../components/Text';
import useSubscription from '../hooks/useSubscription';
import PaymentMethodModal from '../components/PaymentMethodModal';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import {LoadingComponent} from './Loading';

export default function Subscription({navigation}) {
  const {t} = useTranslation();
  const {
    userSubscription,
    nextSubscription,
    subscriptionLimits,
    availablePlans,
    loading,
    processingPurchase,
    error,
    selectedPlanId,
    selectPlan,
    cancelSubscription,
    cancelNextSubscription,
    handleAction,
    handlePaymentMethodSelected,
    getButtonText,
    retryFetchData,
    isActionButtonVisible,
  } = useSubscription();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTariffForPayment, setSelectedTariffForPayment] =
    useState(null);

  console.log('Subscription screen - userSubscription:', userSubscription);

  const renderPlanCard = (plan, isActive = false, isDisabled = false) => {
    const isSelected = selectedPlanId === plan.id;
    const isExpired = isActive && userSubscription && userSubscription.expired;

    // Форматируем дату окончания для активной подписки
    let endDate = '';
    if (isActive && plan.ends_at) {
      try {
        const date = new Date(plan.ends_at);
        if (!isNaN(date.getTime())) {
          endDate = format(date, 'dd MMMM yyyy', {locale: ru});
        } else {
          endDate = plan.ends_at;
        }
      } catch (error) {
        console.error('Error formatting date:', error);
        endDate = plan.ends_at;
      }
    }

    // Безопасное получение значений с дефолтными значениями
    const max_orders = plan.max_orders || 0;
    const max_contacts = plan.max_contacts || 0;
    const price = parseFloat(plan.price) || 0;
    const duration_days = plan.duration_days || 30;

    return (
      <TouchableOpacity
        key={plan.id}
        style={{
          width: '100%',
          padding: 16,
          backgroundColor: isSelected
            ? styles.colors.primaryLight
            : isDisabled
            ? '#F8F8F8'
            : styles.colors.white,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isSelected
            ? styles.colors.primary
            : isDisabled
            ? '#CCCCCC'
            : styles.colors.border,
          marginBottom: 24, // Spacing between blocks: 24 units
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: isDisabled ? 0.05 : 0.1,
          shadowRadius: 8,
          elevation: 4,
          opacity: isDisabled ? 0.7 : 1,
        }}
        onPress={() => !isActive && !isDisabled && selectPlan(plan.id)}
        disabled={isActive || processingPurchase || isDisabled}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}>
          <Text
            style={{
              fontSize: styles.fonSize.smd,
              fontWeight: '500',
              color: isDisabled ? styles.colors.gray : styles.colors.titles,
              flex: 1,
            }}>
            {plan.name}
          </Text>
          {isDisabled && (
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: styles.colors.gray,
                backgroundColor: '#E8E8E8',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
              {userSubscription?.plan?.id === plan.id
                ? t('Current')
                : t('Not available')}
            </Text>
          )}
        </View>

        <View style={{marginBottom: 16}}>
          <Text
            style={{
              fontSize: styles.fonSize.sm,
              color: styles.colors.actionGray,
              marginBottom: 6,
            }}>
            {t('Orders limit')}:{' '}
            <Text style={{color: styles.colors.titles}}>
              {isActive && subscriptionLimits
                ? `${subscriptionLimits.remaining_orders}/${max_orders}`
                : max_orders}
            </Text>
          </Text>
          <Text
            style={{
              fontSize: styles.fonSize.sm,
              color: styles.colors.actionGray,
              marginBottom: 6,
            }}>
            {t('Contacts limit')}:{' '}
            <Text style={{color: styles.colors.titles}}>
              {isActive && subscriptionLimits
                ? `${subscriptionLimits.remaining_contacts}/${max_contacts}`
                : max_contacts}
            </Text>
          </Text>
        </View>

        {isActive && endDate && (
          <Text
            style={{
              fontSize: styles.fonSize.sm,
              color: isExpired ? styles.colors.red : styles.colors.actionGray,
              marginBottom: 12,
            }}>
            {t('Valid until')}:{' '}
            <Text
              style={{
                color: isExpired ? styles.colors.red : styles.colors.titles,
              }}>
              {endDate}
            </Text>
          </Text>
        )}

        {/* Отображение оставшихся дней */}
        {isActive &&
          userSubscription &&
          userSubscription.days_until_expiration !== null &&
          userSubscription.days_until_expiration !== undefined && (
            <View
              style={{
                backgroundColor:
                  userSubscription.days_until_expiration <= 3
                    ? styles.colors.red + '20' // Красный фон с прозрачностью для предупреждения
                    : styles.colors.primary + '20', // Обычный цвет
                padding: 8,
                borderRadius: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor:
                  userSubscription.days_until_expiration <= 3
                    ? styles.colors.red
                    : styles.colors.primary,
              }}>
              <Text
                style={{
                  fontSize: styles.fonSize.sm,
                  color:
                    userSubscription.days_until_expiration <= 3
                      ? styles.colors.red
                      : styles.colors.primary,
                  textAlign: 'center',
                  fontWeight: '500',
                }}>
                {userSubscription.days_until_expiration > 0
                  ? `${t('Days left')}: ${
                      userSubscription.days_until_expiration
                    }`
                  : userSubscription.days_until_expiration === 0
                  ? t('Expires today')
                  : t('Subscription expired')}
              </Text>
            </View>
          )}

        {/* Для бесплатных тарифов показываем "Unlimited" */}
        {isActive &&
          userSubscription &&
          userSubscription.days_until_expiration === null &&
          plan.name === 'Free' && (
            <View
              style={{
                backgroundColor: styles.colors.primary + '20',
                padding: 8,
                borderRadius: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: styles.colors.primary,
              }}>
              <Text
                style={{
                  fontSize: styles.fonSize.sm,
                  color: styles.colors.primary,
                  textAlign: 'center',
                  fontWeight: '500',
                }}>
                {t('Unlimited')}
              </Text>
            </View>
          )}

        <Text
          style={{
            fontSize: styles.fonSize.md,
            fontWeight: '500', // No bold fonts in app
            color: styles.colors.primary,
            marginTop: 4,
          }}>
          {price} AED / {duration_days} {t('days')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: styles.colors.background}}>
      <HeaderBack
        action={() => navigation.goBack()}
        title={t('Subscriptions')}
      />

      {loading ? (
        <LoadingComponent
          showLogo={false}
          text={t('Loading subscription data...')}
        />
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
          <Text
            style={{
              color: styles.colors.red,
              textAlign: 'center',
              marginBottom: 20,
            }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: styles.colors.primary,
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={retryFetchData}>
            <Text style={{color: styles.colors.white}}>{t('Retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{width: '100%'}}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'center',
            paddingHorizontal: styles.paddingHorizontal,
            paddingVertical: 24, // Spacing between blocks: 24 units
          }}>
          {/* Current Subscription */}
          {userSubscription &&
            userSubscription.active &&
            userSubscription.plan && (
              <View style={{width: '100%', marginBottom: 24}}>
                <Text
                  style={{
                    fontSize: styles.fonSize.md,
                    fontWeight: '500', // No bold fonts in app
                    color: styles.colors.titles,
                    marginBottom: 12, // Spacing between elements: 12 units
                  }}>
                  {t('Current plan')}
                </Text>
                {renderPlanCard(userSubscription.plan, true)}

                <View
                  style={{
                    alignItems: 'center',
                    marginTop: 12, // Spacing between elements: 12 units
                    marginBottom: 24, // Spacing between blocks: 24 units
                  }}>
                  {/* Показываем кнопку отмены только если не запланирован переход на Free */}
                  {!(nextSubscription?.tariff?.name === 'Free') ? (
                    <TouchableOpacity
                      onPress={cancelSubscription}
                      disabled={processingPurchase}
                      style={{
                        opacity: processingPurchase ? 0.5 : 1,
                        marginBottom: 12, // Spacing between elements: 12 units
                      }}>
                      <Text
                        style={{
                          color: styles.colors.red,
                          fontSize: styles.fonSize.sm,
                          textDecorationLine: 'underline',
                        }}>
                        {t('Cancel subscription')}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={{
                        backgroundColor: '#FFF3CD',
                        borderColor: '#FFEAA7',
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12,
                        width: '100%',
                      }}>
                      <Text
                        style={{
                          color: '#856404',
                          fontSize: 13,
                          textAlign: 'center',
                          lineHeight: 18,
                        }}>
                        ⚠️{' '}
                        {t(
                          'Subscription cancellation scheduled. You will be switched to the Free plan after your current subscription expires.',
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

          {/* Next Subscription */}
          {nextSubscription && nextSubscription.tariff && (
            <View style={{width: '100%', marginBottom: 24}}>
              <Text
                style={{
                  fontSize: styles.fonSize.md,
                  fontWeight: '500',
                  color: styles.colors.titles,
                  marginBottom: 12,
                }}>
                {t('Scheduled subscription')}
              </Text>

              <View
                style={{
                  backgroundColor: styles.colors.primaryLight,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: styles.colors.primary,
                  padding: 16,
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: styles.colors.black,
                    marginBottom: 8,
                  }}>
                  📅 {nextSubscription.tariff.name}
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    color: styles.colors.gray,
                    marginBottom: 4,
                  }}>
                  {t('Starts')}:{' '}
                  {nextSubscription.starts_at
                    ? new Date(nextSubscription.starts_at).toLocaleDateString(
                        'ru-RU',
                      )
                    : ''}
                </Text>

                {nextSubscription.ends_at && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: styles.colors.gray,
                      marginBottom: 12,
                    }}>
                    {t('Ends')}:{' '}
                    {new Date(nextSubscription.ends_at).toLocaleDateString(
                      'ru-RU',
                    )}
                  </Text>
                )}

                <TouchableOpacity
                  onPress={cancelNextSubscription}
                  style={{
                    alignSelf: 'flex-start',
                  }}>
                  <Text
                    style={{
                      color: styles.colors.red,
                      fontSize: 12,
                      textDecorationLine: 'underline',
                    }}>
                    {t('Cancel scheduled subscription')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Available Plans */}
          <Text
            style={{
              fontSize: styles.fonSize.md,
              fontWeight: '500', // No bold fonts in app
              color: styles.colors.titles,
              marginBottom: 12, // Spacing between elements: 12 units
              alignSelf: 'flex-start',
            }}>
            {userSubscription && userSubscription.active
              ? t('Change plan')
              : t('Available plans')}
          </Text>

          {availablePlans.length === 0 ? (
            <Text style={{color: styles.colors.actionGray, marginVertical: 24}}>
              {t('No available plans found')}
            </Text>
          ) : (
            availablePlans.map(plan => {
              // Проверяем нужно ли делать план disabled
              const isCurrentPlan = userSubscription?.plan?.id === plan.id;
              const isFree = plan.name === 'Free' || plan.price === 0;
              const isDisabled = isCurrentPlan || isFree;

              return renderPlanCard(plan, false, isDisabled);
            })
          )}

          {/* Action Button */}
          {isActionButtonVisible() && (
            <TouchableOpacity
              style={{
                width: '100%',
                padding: 16,
                backgroundColor: processingPurchase
                  ? styles.colors.disabled
                  : styles.colors.primary,
                borderRadius: 16,
                alignItems: 'center',
                marginTop: 24, // Spacing between blocks: 24 units
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={async () => {
                const planId = await handleAction();
                if (planId) {
                  const selectedPlan = availablePlans.find(
                    p => p.id === planId,
                  );
                  setSelectedTariffForPayment(selectedPlan);
                  setShowPaymentModal(true);
                }
              }}
              disabled={processingPurchase}>
              {processingPurchase ? (
                <ActivityIndicator size="small" color={styles.colors.white} />
              ) : (
                <Text
                  style={{
                    color: styles.colors.white,
                    fontWeight: '500',
                    fontSize: styles.fonSize.smd,
                  }}>
                  {getButtonText()}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Payment Method Modal */}
      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        tariff={selectedTariffForPayment}
        onPaymentMethodSelected={paymentMethod => {
          handlePaymentMethodSelected(
            paymentMethod,
            selectedTariffForPayment?.id,
          );
        }}
      />
    </View>
  );
}
