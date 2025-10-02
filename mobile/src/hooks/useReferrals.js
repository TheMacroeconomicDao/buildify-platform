import {useState, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {Share, Clipboard} from 'react-native';
import {notifySuccess, notifyError, notifyInfo} from '../services/notify';
import {retryApiCall, api} from '../services';

export const useReferrals = () => {
  const {t} = useTranslation();

  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Загрузить статистику рефералов
   */
  const fetchReferralStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await retryApiCall(() => api.getReferralStats());

      if (response.success) {
        setStats(response.result);
        return response.result;
      } else {
        throw new Error(response.message || 'Failed to load referral stats');
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      notifyError(t('Error'), t('Failed to load referral statistics'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [t]);

  /**
   * Загрузить список рефералов
   */
  const fetchReferrals = useCallback(
    async (page = 1) => {
      try {
        const response = await retryApiCall(() =>
          api.getReferralsList(page, 20),
        );

        if (response.success) {
          if (page === 1) {
            setReferrals(response.result.referrals);
          } else {
            setReferrals(prev => [...prev, ...response.result.referrals]);
          }
          return response.result;
        } else {
          throw new Error(response.message || 'Failed to load referrals');
        }
      } catch (error) {
        console.error('Error fetching referrals:', error);
        notifyError(t('Error'), t('Failed to load referrals list'));
        return null;
      }
    },
    [t],
  );

  /**
   * Получить промокод пользователя
   */
  const fetchReferralCode = useCallback(async () => {
    try {
      const response = await retryApiCall(() => api.getMyReferralCode());

      if (response.success) {
        return response.result;
      } else {
        throw new Error(response.message || 'Failed to load referral code');
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
      notifyError(t('Error'), t('Failed to load referral code'));
      return null;
    }
  }, [t]);

  /**
   * Скопировать промокод в буфер обмена
   */
  const copyReferralCode = useCallback(
    async code => {
      try {
        await Clipboard.setString(code);
        notifySuccess(t('Success'), t('Referral code copied to clipboard'));
      } catch (error) {
        console.error('Error copying code:', error);
        notifyError(t('Error'), t('Failed to copy referral code'));
      }
    },
    [t],
  );

  /**
   * Поделиться промокодом
   */
  const shareReferralCode = useCallback(
    async (code, shareText) => {
      try {
        const result = await Share.share({
          message:
            shareText ||
            `Join Buildlify and use my referral code ${code} during registration! 🎯`,
          title: t('Join Buildlify'),
        });

        if (result.action === Share.sharedAction) {
          notifySuccess(t('Success'), t('Referral code shared successfully'));
        }
      } catch (error) {
        console.error('Error sharing code:', error);
        notifyError(t('Error'), t('Failed to share referral code'));
      }
    },
    [t],
  );

  /**
   * Использовать реферальный баланс
   */
  const useBonusBalance = useCallback(
    async (amount, reason = 'service_payment') => {
      try {
        const response = await retryApiCall(() =>
          api.useReferralBalance(amount, reason),
        );

        if (response.success) {
          notifySuccess(t('Success'), t('Bonus balance used successfully'));
          // Обновляем статистику после использования
          await fetchReferralStats();
          return response.result;
        } else {
          throw new Error(response.message || 'Failed to use bonus balance');
        }
      } catch (error) {
        console.error('Error using bonus balance:', error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          t('Failed to use bonus balance');
        notifyError(t('Error'), errorMessage);
        return null;
      }
    },
    [t, fetchReferralStats],
  );

  /**
   * Валидировать промокод
   */
  const validateReferralCode = useCallback(
    async code => {
      try {
        const response = await retryApiCall(() =>
          api.validateReferralCode(code),
        );

        return {
          valid: response.success && response.result?.valid,
          message: response.result?.message,
          referrer_name: response.result?.referrer_name,
          cashback_percentage: response.result?.cashback_percentage,
        };
      } catch (error) {
        console.error('Error validating referral code:', error);
        return {
          valid: false,
          message: t('Failed to validate referral code'),
        };
      }
    },
    [t],
  );

  /**
   * Обновить данные
   */
  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchReferralStats(), fetchReferrals(1)]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchReferralStats, fetchReferrals]);

  /**
   * Форматировать валюту
   */
  const formatCurrency = useCallback(amount => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  return {
    // Данные
    stats,
    referrals,
    loading,
    refreshing,

    // Методы
    fetchReferralStats,
    fetchReferrals,
    fetchReferralCode,
    copyReferralCode,
    shareReferralCode,
    useBonusBalance,
    validateReferralCode,
    refresh,
    formatCurrency,
  };
};
