/**
 * Сервис кеширования данных для быстрой навигации
 */
class DataCacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 минут
  }

  /**
   * Получить данные из кеша или выполнить запрос
   */
  async getOrFetch(key, fetchFunction, ttl = this.defaultTTL) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`Cache HIT for ${key}`);
      return cached.data;
    }

    console.log(`Cache MISS for ${key} - fetching...`);

    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // Если есть устаревшие данные, возвращаем их при ошибке
      if (cached) {
        console.log(`Using stale cache for ${key}`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Сохранить данные в кеш
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Автоматическая очистка
    setTimeout(() => {
      this.delete(key);
    }, ttl);
  }

  /**
   * Получить из кеша
   */
  get(key) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    return null;
  }

  /**
   * Удалить из кеша
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Инвалидировать по паттерну
   */
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Очистить весь кеш
   */
  clear() {
    this.cache.clear();
  }

  // Ключи кеша
  static KEYS = {
    USER_PROFILE: userId => `user_profile_${userId}`,
    MY_PROFILE: 'my_profile',
    ORDERS_LIST: (userId, userType) => `orders_${userId}_${userType}`,
    ORDER_DETAIL: orderId => `order_${orderId}`,
    BANNERS: 'banners',
    NOTIFICATIONS_COUNT: userId => `notifications_count_${userId}`,
    WORK_DIRECTIONS: 'work_directions',
    WALLET: userId => `wallet_${userId}`,
  };

  // TTL константы
  static TTL = {
    SHORT: 30 * 1000, // 30 секунд
    MEDIUM: 5 * 60 * 1000, // 5 минут
    LONG: 15 * 60 * 1000, // 15 минут
  };
}

export const dataCache = new DataCacheService();
export default dataCache;
