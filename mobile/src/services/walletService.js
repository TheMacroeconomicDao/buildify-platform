import {unifiedApi, retryApiCall} from './index';

const normalize = response => {
  if (!response) return {};
  return response.result || response.data || response;
};

export const walletService = {
  getWallet: async () => {
    const response = await retryApiCall(() => unifiedApi.walletMe());
    if (!response?.success) return {balance: 0, currency: 'aed'};
    const data = normalize(response);
    const wallet = data.wallet || data;
    return {
      balance: wallet.balance ?? 0,
      currency: 'aed', // Always use AED
    };
  },

  getTransactions: async () => {
    const response = await retryApiCall(() => unifiedApi.walletTransactions());
    if (!response?.success) return [];
    const data = normalize(response);
    return data.transactions || [];
  },

  topup: async (amount, currency = 'aed') => {
    const response = await retryApiCall(() =>
      unifiedApi.walletTopup(amount, currency),
    );
    if (!response?.success)
      throw new Error(response?.message || 'Topup failed');
    const data = normalize(response);
    const url = data.checkout_url || data.url;
    if (!url) throw new Error('No checkout URL');
    return url;
  },

  // Проверка достаточности баланса
  hasBalance: async amount => {
    const wallet = await walletService.getWallet();
    return wallet.balance >= amount;
  },

  // Оплата подписки из кошелька
  paySubscription: async tariffId => {
    const response = await retryApiCall(() =>
      unifiedApi.subscriptionPayFromWallet(tariffId),
    );
    if (!response?.success) {
      throw new Error(response?.message || 'Wallet payment failed');
    }
    return normalize(response);
  },
};

export default walletService;
