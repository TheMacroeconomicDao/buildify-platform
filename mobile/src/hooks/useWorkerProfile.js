import {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Alert} from 'react-native';
import {notifyError, notifyInfo} from '../services/notify';
import {useTranslation} from 'react-i18next';
import {api, retryApiCall} from '../services';
import {performLogout} from '../utils/logoutHelper';

export default function useWorkerProfile(navigation, executorId = null) {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [notificationCount, setNotificationCount] = useState(9);
  const [externalUserData, setExternalUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Если передан executorId, загружаем данные внешнего пользователя
  useEffect(() => {
    if (executorId) {
      loadExternalUserData();
    }
  }, [executorId]);

  const loadExternalUserData = async () => {
    try {
      setLoading(true);
      const response = await retryApiCall(() =>
        api.executors.executorsDetail(executorId),
      );
      if (response.success) {
        setExternalUserData(response.result);
      }
    } catch (error) {
      console.error('Error loading external user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Используем данные внешнего пользователя или текущего
  const userData = executorId ? externalUserData : auth?.userData;
  const isOwnProfile = !executorId; // Собственный профиль если executorId не передан

  // ✅ Определяем тип пользователя: type === 0 - исполнитель, type === 1 - заказчик
  const isPerformer = userData?.type === 0;

  // ✅ Получаем реальные данные рейтинга только для исполнителей (type === 0)
  const rating = isPerformer ? userData?.average_rating || 0 : 0;
  const reviewsCount = isPerformer ? userData?.reviews_count || 0 : 0;

  // Навигация к экранам
  const navigateToScreen = (screenName, params = {}) => {
    console.log('Navigating to:', screenName, 'with params:', params);
    try {
      navigation.navigate(screenName, params);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Функция выхода из системы
  const handleLogout = () => {
    Alert.alert(t('Log out'), t('Are you sure you want to log out?'), [
      {
        text: t('Cancel'),
        style: 'cancel',
      },
      {
        text: t('Log out'),
        style: 'destructive',
        onPress: async () => {
          try {
            // Отправляем запрос на сервер для выхода
            await retryApiCall(() => api.logout.apiLogout());
          } catch (error) {
            console.error('Logout API error:', error);
            // Даже если API запрос не удался, всё равно разлогиниваем локально
          } finally {
            // Выполняем выход с правильной навигацией
            performLogout(dispatch);
          }
        },
      },
    ]);
  };

  // Действия для пунктов меню
  const menuActions = {
    subscription: () => navigateToScreen('Subscription'),
    balance: () => navigateToScreen('Wallet'),
    portfolio: () => {
      // Навигация к экрану портфолио исполнителя (собственного)
      navigateToScreen('Portfolio', {executorId: userData?.id});
    },
    referrals: () => navigateToScreen('Referrals'),
    personalData: () => navigateToScreen('PersonalData'),
    ratingReviews: () => {
      // Навигация к экрану рейтинга и отзывов с передачей типа пользователя
      navigateToScreen('RatingAndReviews', {
        userId: userData?.id,
        userType: userData?.type,
      });
    },
    password: () => navigateToScreen('ChangePasswordByEmail'),
    support: () => navigateToScreen('Support'),
    notifications: () => navigateToScreen('Notifications'),
    faq: () => navigateToScreen('FAQ'),
    language: () => navigateToScreen('Language'),
    about: () => navigateToScreen('AboutApp'),
    logout: handleLogout,
  };

  // Для чужих профилей показываем только портфолио и отзывы
  const menuItems = isOwnProfile
    ? [
        // ✅ Показываем "Subscription" и "Balance" только для исполнителей (type === 0)
        ...(isPerformer
          ? [
              {
                title: t('Subscription'),
                badge: 'VIP',
                onPress: menuActions.subscription,
              },
              {
                title: t('Balance'),
                onPress: menuActions.balance,
              },
            ]
          : []),
        // ✅ Показываем "Portfolio" только для исполнителей (type === 0)
        ...(isPerformer
          ? [
              {
                title: t('Portfolio'),
                onPress: menuActions.portfolio,
              },
            ]
          : []),
        // ✅ Показываем "Referral Program" для всех пользователей
        {
          title: t('Referral Program'),
          onPress: menuActions.referrals,
        },
        {
          title: t('Personal data'),
          onPress: menuActions.personalData,
        },
        // ✅ Показываем "Rating and reviews" для всех пользователей
        {
          title: t('Rating and reviews'),
          onPress: menuActions.ratingReviews,
        },
        {
          title: t('Password'),
          onPress: menuActions.password,
        },
        {
          title: t('Technical support'),
          onPress: menuActions.support,
        },
        {
          title: t('Notifications'),
          onPress: menuActions.notifications,
        },
        {
          title: t('FAQ'),
          onPress: menuActions.faq,
        },
        {
          title: t('Language'),
          onPress: menuActions.language,
        },
        {
          title: t('About app'),
          onPress: menuActions.about,
        },
        {
          title: t('Log out'),
          onPress: menuActions.logout,
        },
      ]
    : [
        // Для чужих профилей исполнителей показываем только портфолио и отзывы
        {
          title: t('Portfolio'),
          onPress: menuActions.portfolio,
        },
        {
          title: t('Rating and reviews'),
          onPress: menuActions.ratingReviews,
        },
      ];

  // Обновление количества уведомлений
  useEffect(() => {
    // TODO: Здесь можно получать реальное количество уведомлений с сервера
    // setNotificationCount(realNotificationCount);
  }, []);

  return {
    userData,
    notificationCount,
    rating,
    reviewsCount,
    isPerformer,
    isOwnProfile,
    loading,
    menuItems,
    navigateToScreen,
    setNotificationCount,
  };
}
