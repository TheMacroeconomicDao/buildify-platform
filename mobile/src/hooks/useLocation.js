import {useState, useEffect, useCallback} from 'react';
import {Platform, Alert, PermissionsAndroid} from 'react-native';
import {useTranslation} from 'react-i18next';

export const useLocation = () => {
  const {t} = useTranslation();
  const [location, setLocation] = useState(null);
  const [cityName, setCityName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Функция для запроса разрешений на Android
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('Location Permission'),
            message: t(
              'This app needs location access to show your current city and find nearby services.',
            ),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
          return true;
        } else {
          setHasPermission(false);
          return false;
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        setHasPermission(false);
        return false;
      }
    } else {
      // На iOS разрешения запрашиваются автоматически при первом вызове getCurrentPosition
      setHasPermission(true);
      return true;
    }
  }, [t]);

  // Функция для получения названия города по координатам
  const getCityNameFromCoords = useCallback(async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      );
      const data = await response.json();

      if (data.city) {
        return data.city;
      } else if (data.locality) {
        return data.locality;
      } else if (data.principalSubdivision) {
        return data.principalSubdivision;
      } else {
        return 'Umm Al Quwain'; // Fallback для ОАЭ
      }
    } catch (error) {
      console.error('Error getting city name:', error);
      return 'Umm Al Quwain'; // Fallback
    }
  }, []);

  // Функция для получения текущего местоположения
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Проверяем/запрашиваем разрешения
      const hasPermissionGranted = await requestLocationPermission();

      if (!hasPermissionGranted) {
        setError(t('Location permission denied'));
        setCityName('Umm Al Quwain'); // Fallback
        setLoading(false);
        return;
      }

      // Проверяем доступность геолокации
      if (!navigator.geolocation) {
        setError(t('Geolocation is not supported'));
        setCityName('Umm Al Quwain'); // Fallback
        setLoading(false);
        return;
      }

      // Получаем координаты используя встроенную геолокацию
      navigator.geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;
          setLocation({latitude, longitude});

          // Получаем название города
          const city = await getCityNameFromCoords(latitude, longitude);
          setCityName(city);
          setLoading(false);
        },
        error => {
          console.error('Error getting location:', error);
          let errorMessage = t('Failed to get location');

          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = t('Location permission denied');
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = t('Location unavailable');
              break;
            case 3: // TIMEOUT
              errorMessage = t('Location request timeout');
              break;
            default:
              errorMessage = t('Unknown location error');
          }

          setError(errorMessage);
          setCityName('Umm Al Quwain'); // Fallback
          setLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      console.error('Unexpected error getting location:', error);
      setError(t('Unexpected error getting location'));
      setCityName('Umm Al Quwain'); // Fallback
      setLoading(false);
    }
  }, [t, requestLocationPermission, getCityNameFromCoords]);

  // Автоматически получаем местоположение при инициализации
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location,
    cityName: cityName || 'Umm Al Quwain', // Всегда возвращаем fallback если нет города
    loading,
    error,
    hasPermission,
    getCurrentLocation,
    requestLocationPermission,
  };
};
