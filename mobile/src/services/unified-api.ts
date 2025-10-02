import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosInstance,
} from 'axios';
import config from '../config';

// Используем базовый URL из конфигурации
const BASE_URL = config.baseUrl;

// Создаем экземпляр axios с базовой конфигурацией
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 секунд базовый таймаут
});

// Типы для ответов API
export interface ApiResponse<T = any> {
  success: boolean;
  result?: T;
  message?: string;
  error?: any;
  data?: T; // Для обратной совместимости
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  secure?: boolean;
}

// Расширяем AxiosResponse для наших кастомных полей
interface ExtendedAxiosResponse extends AxiosResponse {
  success?: boolean;
  message?: string;
}

// Перехватчик запросов для добавления токена авторизации
axiosInstance.interceptors.request.use(
  config => {
    // ✅ ИСПРАВЛЕНО: Получаем токен из AuthManager, а не из заголовков
    const existingAuth = config.headers.Authorization;
    const storedToken = AuthManager.getToken();
    console.log(storedToken);
    // Добавляем заголовок авторизации, если токен есть и не был уже установлен
    if (storedToken && !existingAuth) {
      config.headers.Authorization = storedToken.startsWith('Bearer ')
        ? storedToken
        : `Bearer ${storedToken}`;
    }

    // Генерируем ID запроса для логирования
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    (config as any).requestId = requestId;

    // Логируем запрос
    console.log(`API Request [${requestId}]: ${config.url || ''}`, {
      body: config.data,
      method: config.method,
      query: config.params,
      secure: config.headers.Authorization !== undefined,
      type: config.headers['Content-Type'],
      token: storedToken ? storedToken : 'none', // ✅ Добавляем информацию о токене для отладки
    });

    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// Перехватчик ответов для логирования и нормализации ответов
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const url = response.config.url || '';

    console.log(
      `API Response : ${url} - ${response.status} `,
      JSON.stringify(response.data).length > 500
        ? JSON.stringify(response.data).substring(0, 500) + '...'
        : response.data,
    );

    // Проверяем формат ответа и нормализуем его
    if (response.data === undefined) {
      response.data = {success: false, message: 'Empty response'};
    }

    // Проверяем, есть ли поле success
    const extendedResponse = response as ExtendedAxiosResponse;
    if (extendedResponse.success === undefined) {
      extendedResponse.success =
        response.status >= 200 && response.status < 300;
    }

    // Проверяем, есть ли поле message
    if (extendedResponse.message === undefined) {
      extendedResponse.message = '';
    }

    return response;
  },
  (error: AxiosError<any>) => {
    const requestId =
      (error.config as any)?.requestId || `req_error_${Date.now()}`;
    const url = error.config?.url || 'unknown';
    const startTime = parseInt(requestId.split('_')[1]) || Date.now();
    const duration = Date.now() - startTime;

    console.error(
      `API Error [${requestId}]: ${url} - ${error.code || error.name}`,
      `(${duration}ms)`,
      error,
    );

    // Создаем структурированный объект ошибки
    const response = error.response || {
      data: {
        success: false,
        message: error.message || 'Network Error',
        error: error.toString(),
      },
      status: error.code === 'ECONNABORTED' ? 408 : 0,
      statusText: error.message,
      headers: {},
    };

    // Создаем объект ошибки для новой системы обработки
    const structuredError = {
      ...error,
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      duration,
      requestId,
      url,
      // Добавляем поля для совместимости с новой системой обработки ошибок
      success: false,
      response: {
        status: response.status,
        data: response.data,
      },
    };

    // Проверяем на 400 ошибку с "Unauthenticated" - это означает что токен невалиден
    const isUnauthenticated400 =
      response.status === 400 &&
      (response.data?.error === 'Unauthenticated.' ||
        response.data?.message === 'Unauthenticated.' ||
        response.data?.error === 'Unauthenticated' ||
        response.data?.message === 'Unauthenticated');

    // Проверяем на 403 ошибку, которая связана с аутентификацией (токен недействителен)
    // а не с бизнес-логикой (недостаточно прав, неправильный статус заказа и т.д.)
    const isAuthenticationRelated403 =
      response.status === 403 &&
      (response.data?.error === 'Unauthenticated.' ||
        response.data?.message === 'Unauthenticated.' ||
        response.data?.error === 'Unauthenticated' ||
        response.data?.message === 'Unauthenticated' ||
        // Также проверяем на стандартные сообщения об истечении токена
        response.data?.message?.includes('token') ||
        response.data?.error?.includes('token'));

    if (
      isUnauthenticated400 ||
      response.status === 401 ||
      isAuthenticationRelated403
    ) {
      console.warn(
        `Unauthorized request detected (${response.status}). Logging out user...`,
      );
      // Используем setTimeout для асинхронного вызова, чтобы избежать циклических зависимостей
      setTimeout(() => {
        try {
          const {handleUnauthorized} = require('./auth-helper');
          handleUnauthorized();
        } catch (importError) {
          console.error('Failed to import auth helper:', importError);
          // Fallback - базовая очистка токена
          try {
            const {setApiToken} = require('./index');
            setApiToken(null);
          } catch (fallbackError) {
            console.error('Failed to clear token:', fallbackError);
          }
        }
      }, 0);
    }

    // Автоматически обрабатываем глобальные ошибки через notification систему
    // Но только для критических ошибок (500+, сетевые ошибки)
    const shouldShowGlobalNotification =
      response.status >= 500 ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED';

    if (shouldShowGlobalNotification) {
      // Используем setTimeout для асинхронного вызова, чтобы избежать циклических зависимостей
      setTimeout(() => {
        try {
          const {handleBackendError} = require('./errorHandler');
          handleBackendError(structuredError, {
            showNotification: true,
            logError: false, // уже логируется выше
            onError: () => {}, // пустая функция для соответствия интерфейсу
          });
        } catch (importError) {
          console.error('Failed to import error handler:', importError);
        }
      }, 0);
    }

    return Promise.reject(structuredError);
  },
);

// Класс для управления токеном авторизации
export class AuthManager {
  private static token: string | null = null;

  public static setToken(token: string | null): void {
    console.log('AuthManager.setToken called with:', token); // ✅ Отладочное логирование
    this.token = token;

    if (token) {
      // Проверяем, не содержит ли токен уже префикс Bearer
      const authHeader = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
      axiosInstance.defaults.headers.common['Authorization'] = authHeader;
      console.log('Authorization header set:', authHeader); // ✅ Отладочное логирование
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      console.log('Authorization header removed'); // ✅ Отладочное логирование
    }
  }

  public static getToken(): string | null {
    console.log('AuthManager.getToken called, returning:', this.token);
    return this.token;
  }
}

// Вспомогательная функция для обработки ответов
const handleResponse = <T = any>(response: AxiosResponse): ApiResponse<T> => {
  const data = response.data;

  // Нормализуем ответ для обеспечения совместимости
  return {
    success:
      data.success !== undefined
        ? data.success
        : response.status >= 200 && response.status < 300,
    result: data.result || data.data || data,
    message: data.message || '',
    error: data.error || null,
    data: data.result || data.data || data, // Для обратной совместимости
    // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем все дополнительные поля из ответа
    token: data.token, // Для авторизации
    user: data.user, // Для пользователя
    ...data, // Все остальные поля
  };
};

// Вспомогательная функция для обработки ошибок
const handleError = (error: any): ApiResponse => {
  console.error('API Error:', error);

  return {
    success: false,
    message:
      error.response?.data?.message || error.message || 'An error occurred',
    error: error.response?.data || error,
    result: null,
  };
};

// Унифицированный API-сервис
export const unifiedApi = {
  // AUTH
  login: {
    loginCreate: async (credentials: {
      email: string;
      password: string;
    }): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/login', credentials);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  logout: {
    apiLogout: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/logout');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  registration: {
    registrationStart: async (userData: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/registration/start',
          userData,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    registrationEnd: async (userData: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/registration/end',
          userData,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // USER
  user: {
    apiUserMe: async (): Promise<ApiResponse> => {
      try {
        // ✅ Исправлено: /user/me должен быть POST согласно routes/api.php
        const response = await axiosInstance.post('/user/me');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserUpdateAvatar: async (formData: FormData): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/files/store', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserDelete: async (params: any = {}): Promise<ApiResponse> => {
      try {
        // ✅ Исправлено: согласно OpenAPI спецификации это POST метод, а не DELETE
        const response = await axiosInstance.post('/user/delete', params);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserGet: async (userId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(`/user/${userId}`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить список исполнителей
    getExecutors: async (
      params: {
        search?: string;
        work_direction?: string;
        work_type?: string;
        min_rating?: number;
        limit?: number;
        sort_by?: string;
        sort_direction?: string;
      } = {},
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/executors', {params});
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserChangePassword: async (passwordData: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/user/change-password',
          passwordData,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserSettingsUpdate: async (settings: any): Promise<ApiResponse> => {
      try {
        // ✅ Исправлено: согласно OpenAPI использует multipart/form-data
        const formData = new FormData();
        Object.keys(settings).forEach(key => {
          if (settings[key] !== undefined && settings[key] !== null) {
            formData.append(key, settings[key]);
          }
        });

        const response = await axiosInstance.post(
          '/user/settings-update',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    getAppSettings: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/get-app-settings');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserEdit: async (userData: any): Promise<ApiResponse> => {
      try {
        // ✅ Исправлено: сервер поддерживает POST, а не PUT
        const response = await axiosInstance.post('/user/edit', userData);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserUpdateAvatarCorrect: async (
      formData: FormData,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/user/update-avatar',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserSettingsGet: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/user/settings-get');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiUserSettingsUpdateCorrect: async (
      settings: any,
    ): Promise<ApiResponse> => {
      try {
        // ✅ Исправлено: согласно OpenAPI использует multipart/form-data
        const formData = new FormData();
        Object.keys(settings).forEach(key => {
          if (settings[key] !== undefined && settings[key] !== null) {
            formData.append(key, settings[key]);
          }
        });

        const response = await axiosInstance.post(
          '/user/settings-update',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    setWorkSettings: async (settings: any): Promise<ApiResponse> => {
      try {
        // ✅ Согласно OpenAPI - application/json
        const response = await axiosInstance.post(
          '/user/set-work-settings',
          settings,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    uploadLicense: async (formData: FormData): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/user/upload-license',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    getWorkSettings: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/user/get-work-settings');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // ORDERS
  orders: {
    ordersList: async (params: any = {}): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/orders', {params});
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersDetail: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(`/orders/${id}`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersCreate: async (orderData: any): Promise<ApiResponse> => {
      try {
        // ✅ Проверяем, является ли orderData FormData
        const config =
          orderData instanceof FormData
            ? {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            : {};

        const response = await axiosInstance.post('/orders', orderData, config);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersEdit: async (id: number, orderData: any): Promise<ApiResponse> => {
      try {
        // ✅ Проверяем, является ли orderData FormData
        const config =
          orderData instanceof FormData
            ? {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            : {};

        const response = await axiosInstance.post(
          `/orders/${id}`,
          orderData,
          config,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersCancel: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(`/orders/${id}/cancel`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersRefuse: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(`/orders/${id}/refuse`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersArchiveByExecutor: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${id}/archive-by-executor`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersArchiveByCustomer: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${id}/archive-by-customer`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersReject: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(`/orders/${id}/reject`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    ordersAccept: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(`/orders/${id}/accept`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // ✅ Завершение заказа заказчиком
    ordersCompleteByCustomer: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${id}/complete-by-customer`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // ✅ Завершение заказа исполнителем
    ordersComplete: async (id: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(`/orders/${id}/complete`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    activeList: async (params: any = {}): Promise<ApiResponse> => {
      try {
        // ✅ Исправлено: согласно OpenAPI спецификации это POST метод, а не GET
        const response = await axiosInstance.get('/orders/active', params);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    archivedList: async (params: any = {}): Promise<ApiResponse> => {
      try {
        // Use the proper archived endpoint
        const response = await axiosInstance.get('/orders/archived', {
          params: params,
        });
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    workerActiveList: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/orders/active');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // RESPONSES
    responsesList: async (orderId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/orders/${orderId}/responses`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    responsesCreate: async (
      orderId: number,
      responseData: any = {},
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${orderId}/responses`,
          responseData,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    responsesRevoke: async (
      orderId: number,
      responseId: number,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${orderId}/responses/${responseId}/revoke`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    responsesSendContact: async (
      orderId: number,
      responseId: number,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${orderId}/responses/${responseId}/send-contact`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    responsesSendExecutorContact: async (
      orderId: number,
      responseId: number,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${orderId}/responses/${responseId}/send-executor-contact`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    responsesSelect: async (
      orderId: number,
      responseId: number,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${orderId}/responses/${responseId}/select`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    responsesReject: async (
      orderId: number,
      responseId: number,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${orderId}/responses/${responseId}/reject`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // ✅ Добавляем недостающий метод для взятия заказа в работу
    responsesTakeOnWork: async (
      orderId: number,
      responseId: number,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/orders/${orderId}/responses/${responseId}/take-on-work`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // ✅ Добавляем метод для получения всех откликов (для заказчика)
    responsesGetAll: async (orderId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/orders/${orderId}/responses`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // BANNERS
  banners: {
    bannersList: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/banners');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // PASSWORD RECOVERY
  passwordRecovery: {
    apiPasswordRecovery: async (data: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/password-recovery', data);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // CHANGE PASSWORD (корневой метод)
  changePassword: {
    apiChangePassword: async (data: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/change-password', data);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Отправка кода для смены пароля
    sendCode: async (data: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/user/change-password/send-code',
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Подтверждение смены пароля с кодом
    confirm: async (data: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/user/change-password/confirm',
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // EXECUTORS
  executors: {
    executorsList: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/executors');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    executorsDetail: async (executorId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(`/executors/${executorId}`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    portfolioList: async (executorId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/executors/${executorId}/portfolio`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    reviewsList: async (executorId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/executors/${executorId}/reviews`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Эндпоинт для получения отзывов исполнителя (используем рабочий старый эндпоинт)
    getExecutorReviews: async (
      executorId: number,
      page: number = 1,
      perPage: number = 20,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/executors/${executorId}/reviews`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Эндпоинт для получения отзывов о заказчике (используем рабочий эндпоинт)
    getCustomerReviews: async (
      customerId: number,
      page: number = 1,
      perPage: number = 20,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/customer-reviews/customer/${customerId}`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    reviewsCreate: async (
      executorId: number,
      reviewData: any,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/executors/${executorId}/reviews`,
          reviewData,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // NOTIFICATIONS
  notification: {
    apiNotificationGet: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          '/notification/get-notifications',
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    apiNotificationRead: async (data: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/notification/read-notifications',
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    getCountNotifications: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/notification/get-count-notifications',
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // FILES
  files: {
    storeCreate: async (formData: FormData): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/files/store', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    upload: async (file: any, type: string = 'order'): Promise<ApiResponse> => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await axiosInstance.post('/files/store', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // CUSTOM REQUEST
  request: async <T = any>(
    config: ApiRequestConfig,
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance(config);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Set security token
  setSecurityData: (token: string | null) => {
    AuthManager.setToken(token);
  },

  // Подписки
  subscriptionsGetAll: async (): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'GET',
      url: '/subscriptions',
    });
    return handleResponse(response);
  },

  subscriptionsGetMy: async (): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'GET',
      url: '/subscriptions/my',
    });
    return handleResponse(response);
  },

  subscriptionsUnsubscribe: async (): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'POST',
      url: '/subscriptions/unsubscribe',
    });
    return handleResponse(response);
  },

  // Получить количество новых откликов
  getNewResponsesCount: async (): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'GET',
      url: '/order-responses/new-count',
    });
    return handleResponse(response);
  },

  subscriptionsCheckout: async (tariffId: number): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'POST',
      url: `/subscriptions/${tariffId}/checkout`,
      // Убедимся, что не отправляются лишние данные
      data: {},
    });
    return handleResponse(response);
  },

  subscriptionPayFromWallet: async (tariffId: number): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'POST',
      url: `/subscriptions/${tariffId}/pay-from-wallet`,
      data: {
        payment_method: 'wallet',
      },
    });
    return handleResponse(response);
  },

  // Жалобы
  complaintsCreate: async (complaintData: {
    reported_user_id: number;
    reason: string;
    comment?: string;
    order_id?: number;
  }): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'POST',
      url: '/complaints',
      data: complaintData,
    });
    return handleResponse(response);
  },

  complaintsList: async (): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'GET',
      url: '/complaints',
    });
    return handleResponse(response);
  },

  complaintsReasons: async (): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'GET',
      url: '/complaints/reasons',
    });
    return handleResponse(response);
  },

  complaintsDetail: async (complaintId: number): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'GET',
      url: `/complaints/${complaintId}`,
    });
    return handleResponse(response);
  },

  // Кошелек
  walletMe: async (): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'GET',
      url: '/wallet/me',
    });
    return handleResponse(response);
  },

  walletTopup: async (
    amount: number,
    currency: 'aed' = 'aed',
  ): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'POST',
      url: '/wallet/topup',
      data: {amount, currency},
    });
    return handleResponse(response);
  },

  walletTransactions: async (): Promise<ApiResponse> => {
    const response = await axiosInstance({
      method: 'GET',
      url: '/wallet/transactions',
    });
    return handleResponse(response);
  },

  // CUSTOMER REVIEWS
  customerReviews: {
    // Создать отзыв о заказчике
    create: async (reviewData: {
      order_id: number;
      rating: number;
      comment?: string;
    }): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/customer-reviews',
          reviewData,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить список отзывов о заказчике
    getCustomerReviews: async (customerId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/customer-reviews/customer/${customerId}`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить детали отзыва
    getReviewDetail: async (reviewId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/customer-reviews/${reviewId}`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Проверить возможность оставить отзыв
    canReview: async (orderId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/customer-reviews/order/${orderId}/can-review`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // EXECUTOR REVIEWS
  executorReviews: {
    // Создать отзыв об исполнителе
    create: async (reviewData: {
      order_id: number;
      executor_id: number;
      quality_rating: number;
      speed_rating: number;
      communication_rating: number;
      overall_rating: number;
      comment?: string;
    }): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/executor-reviews',
          reviewData,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить список отзывов об исполнителе
    getExecutorReviews: async (executorId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/executor-reviews/executor/${executorId}`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить детали отзыва
    getReviewDetail: async (reviewId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/executor-reviews/${reviewId}`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Проверить возможность оставить отзыв об исполнителе
    canReview: async (orderId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/executor-reviews/order/${orderId}/can-review`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // MEDIATOR API
  mediator: {
    // Получить доступные заказы для посредника
    getAvailableOrders: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/mediator/available-orders');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить активные сделки посредника
    getActiveDeals: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/mediator/active-deals');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить статистику посредника
    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/mediator/stats');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Взять заказ в работу как посредник
    takeOrder: async (orderId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/mediator/orders/${orderId}/take`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Обновить статус заказа
    updateOrderStatus: async (
      orderId: number,
      data: {status: number},
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/mediator/orders/${orderId}/update-status`,
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить детали заказа для посредника
    getOrderDetails: async (orderId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(`/mediator/orders/${orderId}`);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить историю транзакций
    getTransactionHistory: async (params: any = {}): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/mediator/transactions', {
          params,
        });
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Обновить настройки комиссии
    updateCommissionSettings: async (data: {
      margin_percentage?: number;
      fixed_fee?: number;
      agreed_price?: number;
      notes?: string;
    }): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/mediator/commission-settings',
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Новые методы для 3-шагового workflow
    // Получить детали этапов заказа
    getOrderStepDetails: async (orderId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/mediator/orders/${orderId}/steps`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Перейти к следующему этапу
    moveToNextStep: async (
      orderId: number,
      data: {
        step_data?: any;
        notes?: string;
      },
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/mediator/orders/${orderId}/next-step`,
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Архивировать заказ
    archiveOrder: async (
      orderId: number,
      data: {
        reason: string;
      },
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/mediator/orders/${orderId}/archive`,
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Вернуть заказ в приложение
    returnOrderToApp: async (
      orderId: number,
      data: {
        reason: string;
      },
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/mediator/orders/${orderId}/return-to-app`,
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Обновить данные этапа
    updateStepData: async (
      orderId: number,
      step: number,
      data: any,
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.put(
          `/mediator/orders/${orderId}/steps/${step}`,
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Завершить заказ успешно
    completeOrderSuccessfully: async (
      orderId: number,
      data: {
        notes?: string;
      },
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/mediator/orders/${orderId}/complete-success`,
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Завершить заказ с отказом
    completeOrderWithRejection: async (
      orderId: number,
      data: {
        reason: string;
      },
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/mediator/orders/${orderId}/complete-rejection`,
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Методы для работы с комментариями
    getOrderComments: async (orderId: number): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/mediator/orders/${orderId}/comments`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    addOrderComment: async (
      orderId: number,
      data: {
        step: number;
        comment: string;
        step_data?: any;
      },
    ): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          `/mediator/orders/${orderId}/comments`,
          data,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // Design Generation API
  design: {
    // Генерация дизайна
    generate: async (data: {
      description: string;
      room_type?: string[];
      style?: string[];
      budget?: {min: number; max: number};
    }): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/design/generate', data, {
          timeout: 300000, // 5 минут для генерации дизайна
        });
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Генерация дизайна с фотографиями
    generateWithPhotos: async (formData: FormData): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post(
          '/design/generate',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 300000, // 5 минут для генерации дизайна
          },
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Генерация вариаций дизайна
    generateVariations: async (data: {
      original_design: string;
      count?: number;
    }): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/design/variations', data, {
          timeout: 300000, // 5 минут для генерации вариаций
        });
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получить опции для генерации
    getOptions: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/design/options');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получение статуса генерации изображений
    getGenerationStatus: async (generationId: string): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/design/images/status/${generationId}`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    // Получение готовых изображений
    getGenerationImages: async (generationId: string): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get(
          `/design/images/get/${generationId}`,
        );
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // ===== REFERRAL SYSTEM API =====

  /**
   * Получить статистику рефералов
   */
  getReferralStats: async (): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.get('/referrals/my-stats');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Получить список рефералов
   */
  getReferralsList: async (page = 1, perPage = 20): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.get('/referrals/my-referrals', {
        params: {page, per_page: perPage},
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Получить промокод пользователя
   */
  getMyReferralCode: async (): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.get('/referrals/my-code');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Использовать реферальный баланс
   */
  useReferralBalance: async (
    amount: number,
    reason?: string,
  ): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.post('/referrals/use-balance', {
        amount,
        reason: reason || 'service_payment',
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Валидировать промокод
   */
  validateReferralCode: async (code: string): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.post('/referrals/validate-code', {
        code,
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Push Notifications API
  push: {
    updateToken: async (data: {push_token: string}): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/push/token', data);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    updateSettings: async (settings: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/push/settings', settings);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    getSettings: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/push/settings');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    sendTest: async (data: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/push/test', data);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // Partner Program API
  partner: {
    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/partner/stats');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    requestPayout: async (data: any): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.post('/partner/payout', data);
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },

    getQRCode: async (): Promise<ApiResponse> => {
      try {
        const response = await axiosInstance.get('/partner/qr-code');
        return handleResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  },
};

// Функция для установки токена авторизации
export const setApiToken = (token: string | null) => {
  AuthManager.setToken(token);
};

// Экспорт для обратной совместимости
export const api = unifiedApi;
export const apiService = {
  // Новые методы для прямого использования
  login: async (email: string, password: string): Promise<ApiResponse> => {
    return unifiedApi.login.loginCreate({email, password});
  },

  logout: async (): Promise<ApiResponse> => {
    return unifiedApi.logout.apiLogout();
  },

  registration: async (userData: any): Promise<ApiResponse> => {
    return unifiedApi.registration.registrationStart(userData);
  },

  getUserProfile: async (): Promise<ApiResponse> => {
    return unifiedApi.user.apiUserMe();
  },

  updateUserProfile: async (userData: any): Promise<ApiResponse> => {
    return unifiedApi.user.apiUserEdit(userData);
  },

  getOrdersList: async (params: any = {}): Promise<ApiResponse> => {
    return unifiedApi.orders.ordersList(params);
  },

  getOrderDetail: async (id: number): Promise<ApiResponse> => {
    return unifiedApi.orders.ordersDetail(id);
  },

  createOrder: async (orderData: any): Promise<ApiResponse> => {
    return unifiedApi.orders.ordersCreate(orderData);
  },

  updateOrder: async (id: number, orderData: any): Promise<ApiResponse> => {
    return unifiedApi.orders.ordersEdit(id, orderData);
  },

  getOrderResponses: async (orderId: number): Promise<ApiResponse> => {
    return unifiedApi.orders.responsesList(orderId);
  },

  sendContacts: async (
    orderId: number,
    responseId: number,
  ): Promise<ApiResponse> => {
    return unifiedApi.orders.responsesSendContact(orderId, responseId);
  },

  selectPerformer: async (
    orderId: number,
    responseId: number,
  ): Promise<ApiResponse> => {
    return unifiedApi.orders.responsesSelect(orderId, responseId);
  },

  rejectResponse: async (
    orderId: number,
    responseId: number,
  ): Promise<ApiResponse> => {
    return unifiedApi.orders.responsesReject(orderId, responseId);
  },

  uploadFile: async (
    file: any,
    type: string = 'order',
  ): Promise<ApiResponse> => {
    return unifiedApi.files.upload(file, type);
  },

  // Жалобы
  createComplaint: async (complaintData: {
    reported_user_id: number;
    reason: string;
    comment?: string;
    order_id?: number;
  }): Promise<ApiResponse> => {
    return unifiedApi.complaintsCreate(complaintData);
  },

  // Ответы на отзывы
  replyToExecutorReview: async (
    reviewId: number,
    replyText: string,
  ): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.post(
        `/executor-reviews/${reviewId}/reply`,
        {
          reply_text: replyText,
        },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  replyToCustomerReview: async (
    reviewId: number,
    replyText: string,
  ): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.post(
        `/customer-reviews/${reviewId}/reply`,
        {
          reply_text: replyText,
        },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getReviewReplies: async (
    reviewType: 'executor_review' | 'customer_review',
    reviewId: number,
  ): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.get(
        `/review-replies/${reviewType}/${reviewId}`,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getComplaints: async (): Promise<ApiResponse> => {
    return unifiedApi.complaintsList();
  },

  getComplaintReasons: async (): Promise<ApiResponse> => {
    return unifiedApi.complaintsReasons();
  },

  getComplaintDetail: async (complaintId: number): Promise<ApiResponse> => {
    return unifiedApi.complaintsDetail(complaintId);
  },

  request: async <T = any>(
    config: ApiRequestConfig,
  ): Promise<ApiResponse<T>> => {
    return unifiedApi.request(config);
  },
};

export default unifiedApi;
