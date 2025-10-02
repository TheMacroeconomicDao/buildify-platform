import {apiService, setApiToken} from '../services/index';
import {useDispatch, useSelector} from 'react-redux';
import {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import * as yup from 'yup';
import {login} from '../actions/auth';
import SplashScreen from 'react-native-splash-screen';
import {handleBackendError} from '../services/errorHandler';
import AsyncStorage from '@react-native-community/async-storage';

export function useAuth() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const logged = auth.logged;
  const handleInputChange = (target, value) => {
    setFormData({...formData, [target]: value});
  };

  const validate = async () => {
    // ✅ ВРЕМЕННО: Упрощенная валидация для диагностики проблемы
    let userSchema = yup.object({
      email: yup
        .string()
        .email('Email is not valid')
        .required('Email is required'),
      password: yup
        .string()
        .min(1, 'Password is required') // Упрощенная валидация
        .required('Password is required'),
    });

    console.log('Validating form data:', {
      email: formData.email,
      passwordLength: formData.password.length,
      hasNumber: /[0-9]/.test(formData.password),
      hasLowercase: /[a-z]/.test(formData.password),
      hasUppercase: /[A-Z]/.test(formData.password),
      hasSymbol: /[^\w]/.test(formData.password),
      noSpaces: /^\S*$/.test(formData.password),
    });

    return await userSchema.validate(formData, {abortEarly: false});
  };

  const handleSubmit = async () => {
    console.log('=== LOGIN ATTEMPT STARTED ===');
    console.log('Form data:', {
      email: formData.email,
      passwordLength: formData.password.length,
    });
    setErrors([]);
    setLoading(true);

    validate()
      .then(async () => {
        console.log('Validation passed, making API call...');
        // ✅ Приводим email к нижнему регистру перед отправкой
        apiService
          .login(formData.email.toLowerCase(), formData.password)
          .then(async response => {
            console.log('Login response:', response); // ✅ Отладочное логирование

            try {
              if (response.success) {
                const token = response.token;
                console.log('Extracted token:', token); // ✅ Отладочное логирование
                setApiToken(token);
                console.log('Token set in AuthManager'); // ✅ Отладочное логирование
                dispatch(login({token: token, userData: response.user}));
                console.log('Token dispatched to Redux'); // ✅ Отладочное логирование

                // Сохраняем завершение онбординга для существующего пользователя при логине
                if (response.user?.id) {
                  try {
                    const onboardingKey = `onboarding_completed_${response.user.id}`;
                    await AsyncStorage.setItem(onboardingKey, 'true');
                    console.log(
                      'Onboarding marked as completed for existing user:',
                      response.user.id,
                    );
                  } catch (error) {
                    console.error(
                      'Error saving onboarding completion on login:',
                      error,
                    );
                  }
                }

                // После успешного логина переходим на Loading, который перенаправит на MainStack
                console.log(
                  'Login successful, dispatching to Redux and navigating to Loading',
                );
                navigation.replace('Loading');
              } else {
                // Если ответ содержит ошибку (неверные учетные данные и т.д.)
                console.log('Login failed:', response);
                handleBackendError(
                  response,
                  {
                    // Для ошибок валидации показываем уведомления
                    showNotification: true,
                  },
                  setErrors,
                );
              }
            } catch (error) {
              console.error('Error processing login response:', error);
              handleBackendError(
                error,
                {
                  showNotification: true,
                },
                setErrors,
              );
            } finally {
              // ✅ ИСПРАВЛЕНО: Всегда сбрасываем loading в блоке finally
              setLoading(false);
            }
          })
          .catch(e => {
            console.error('=== LOGIN API ERROR ===');
            console.error('Error details:', e);
            console.error('Error response:', e.response?.data);
            console.error('Error status:', e.response?.status);

            // ✅ ИСПРАВЛЕНО: Используем новый обработчик ошибок с toast уведомлениями
            handleBackendError(
              e,
              {
                // Для сетевых ошибок показываем toast уведомления
                showNotification: true,
              },
              setErrors,
            );
            setLoading(false);
          });
      })
      .catch(e => {
        console.error('=== LOGIN VALIDATION ERROR ===');
        console.error('Validation errors:', e.inner);
        setErrors(innerToArray(e.inner));
        setLoading(false);
      });
  };

  const innerToArray = inner => {
    return inner.map(e => ({path: e.path, message: e.message}));
  };

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return {formData, errors, handleInputChange, handleSubmit, loading};
}
