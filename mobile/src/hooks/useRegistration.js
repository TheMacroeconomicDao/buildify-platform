import {
  apiService,
  setApiToken,
  unifiedApi,
  api,
  retryApiCall,
} from '../services/index';
import {useDispatch} from 'react-redux';
import {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-community/async-storage';
import * as yup from 'yup';
import YupPassword from 'yup-password';
import {handleErrorResponse} from '../services/utils';
import {login} from '../actions/auth';
import {useTranslation} from 'react-i18next';
YupPassword(yup);

export function useRegistration(selectedRole = null) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {t} = useTranslation();

  // Функция для сохранения завершения онбординга
  const saveOnboardingCompletion = async userId => {
    try {
      const onboardingKey = `onboarding_completed_${userId}`;
      await AsyncStorage.setItem(onboardingKey, 'true');
      console.log(
        'LOG Онбординг отмечен как завершенный для пользователя:',
        userId,
      );
    } catch (error) {
      console.error('Ошибка при сохранении статуса онбординга:', error);
    }
  };

  // Роль должна быть передана из онбординга
  // '1' = заказчик (step 1), '0' = исполнитель (step 2)
  // Если роль не передана, по умолчанию заказчик
  const initialStep = !selectedRole || selectedRole === '1' ? 1 : 2;
  const initialType = selectedRole || '1'; // По умолчанию заказчик

  const [formData, setFormData] = useState({
    type: initialType,
    email: '',
    name: '',
    birthDate: '',
    code: '',
    password: '',
    confirmed_password: '',
    license: '',
    phone: '',
    promo_code: '',
    work_types: [],
    partner_id: '', // Для партнерской программы
    referral_source: '', // Источник привлечения
  });
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [workDirections, setWorkDirections] = useState([]);
  const [workTypes, setWorkTypes] = useState({});
  const [workTypesLoading, setWorkTypesLoading] = useState(false);
  const [selectedDirections, setSelectedDirections] = useState([]);
  const handleInputChange = (target, value) => {
    setFormData({...formData, [target]: value});
  };

  const handleLicenseFileSelect = file => {
    setLicenseFile(file);
    // Очищаем ошибки лицензии при выборе файла
    if (file) {
      setErrors(prev => prev.filter(error => error.path !== 'license'));
    }
  };

  // Проверка partner_id из AsyncStorage (deep link)
  useEffect(() => {
    const checkPartnerLink = async () => {
      try {
        const partnerId = await AsyncStorage.getItem('pending_partner_id');
        if (partnerId) {
          console.log('Found partner_id from deep link:', partnerId);
          setFormData(prev => ({
            ...prev,
            partner_id: partnerId,
            referral_source: 'mobile_app',
          }));
        }
      } catch (error) {
        console.error('Error checking partner link:', error);
      }
    };

    checkPartnerLink();
  }, []);

  // Функция для загрузки типов работ
  const loadWorkTypes = async () => {
    setWorkTypesLoading(true);
    try {
      const response = await retryApiCall(() => api.user.getAppSettings());

      if (response.success && response.result) {
        const result = response.result;

        if (result.direction_work) {
          setWorkDirections(result.direction_work);
        }

        if (result.types_work) {
          setWorkTypes(result.types_work);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке типов работ:', error);
    } finally {
      setWorkTypesLoading(false);
    }
  };

  // Функция для переключения направления работы
  const toggleWorkDirection = directionKey => {
    const isSelected = selectedDirections.includes(directionKey);

    let newDirections;
    if (isSelected) {
      newDirections = selectedDirections.filter(dir => dir !== directionKey);
      // Убираем все типы работ из этого направления
      const typesToRemove = workTypes[directionKey] || [];
      const newWorkTypes = formData.work_types.filter(
        type => !typesToRemove.some(t => t.key === type),
      );
      handleInputChange('work_types', newWorkTypes);
    } else {
      newDirections = [...selectedDirections, directionKey];
    }

    setSelectedDirections(newDirections);
  };

  // Функция для переключения типа работы
  const toggleWorkType = typeKey => {
    const currentWorkTypes = formData.work_types || [];
    const isSelected = currentWorkTypes.includes(typeKey);

    let newWorkTypes;
    if (isSelected) {
      newWorkTypes = currentWorkTypes.filter(type => type !== typeKey);
    } else {
      newWorkTypes = [...currentWorkTypes, typeKey];
    }

    handleInputChange('work_types', newWorkTypes);

    // Очищаем ошибки при выборе типов работ
    if (newWorkTypes.length > 0) {
      setErrors(prev => prev.filter(error => error.path !== 'work_types'));
    }
  };

  useEffect(() => {
    setErrors([]);
    // Тип роли уже установлен при инициализации, не меняем его
  }, [step]);

  // Загружаем типы работ для исполнителей
  useEffect(() => {
    if (formData.type === '0') {
      loadWorkTypes();
    }
  }, [formData.type]);

  // Функция валидации даты рождения
  const birthDateValidation = yup
    .string()
    .required(t('Birth date is required'))
    .test('valid-birth-date', t('Invalid birth date'), function (value) {
      if (!value) return false;

      // Проверяем формат DD.MM.YYYY
      const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
      if (!datePattern.test(value)) {
        return this.createError({
          message: t('Date must be in DD.MM.YYYY format'),
        });
      }

      // Проверяем через moment
      const moment = require('moment');
      const date = moment(value, 'DD.MM.YYYY', true);

      if (!date.isValid()) {
        return this.createError({message: t('Invalid date')});
      }

      // Проверяем, что дата не в будущем
      if (date.isAfter(moment(), 'day')) {
        return this.createError({
          message: t('Birth date cannot be in the future'),
        });
      }

      // Проверяем разумный диапазон (не раньше 1900 года)
      const currentYear = new Date().getFullYear();
      const birthYear = date.year();
      if (birthYear < 1900 || birthYear > currentYear) {
        return this.createError({
          message: t('Birth year must be between 1900 and current year'),
        });
      }

      return true;
    });

  const validate = async () => {
    let userSchema;
    switch (step) {
      case 1:
        userSchema = yup.object({
          email: yup
            .string()
            .email(t('Email is not valid'))
            .required(t('Email is required')),
          name: yup.string().required(t('Name is required')),
          birthDate: birthDateValidation,
          phone: yup.string().required(t('Phone number is required')),
          password: yup
            .string()
            .min(8, t('Password must be at list 8 characters long'))
            .matches(/[0-9]/, t('Password requires a number'))
            .matches(/[a-z]/, t('Password requires a lowercase letter'))
            .matches(/[A-Z]/, t('Password requires an uppercase letter'))
            .matches(/[^\w]/, t('Password requires a symbol'))
            .matches(/^\S*$/, t('Password must not to contain blank spaces')),
          confirmed_password: yup
            .string()
            .oneOf([yup.ref('password'), null], t('Passwords must match')),
        });
        return await userSchema.validate(formData, {abortEarly: false});
      case 2:
        userSchema = yup.object({
          email: yup
            .string()
            .email(t('Email is not valid'))
            .required(t('Email is required')),
          name: yup.string().required(t('Company name is required')),
          phone: yup.string().required(t('Phone number is required')),
          work_types: yup
            .array()
            .min(1, t('Please select at least one work type')),
          // Валидация файла лицензии будет выполнена отдельно
          password: yup
            .string()
            .min(8, t('Password must be at list 8 characters long'))
            .matches(/[0-9]/, t('Password requires a number'))
            .matches(/[a-z]/, t('Password requires a lowercase letter'))
            .matches(/[A-Z]/, t('Password requires an uppercase letter'))
            .matches(/[^\w]/, t('Password requires a symbol'))
            .matches(/^\S*$/, t('Password must not to contain blank spaces')),
          confirmed_password: yup
            .string()
            .oneOf([yup.ref('password'), null], t('Passwords must match')),
        });
        return await userSchema.validate(formData, {abortEarly: false});
      case 3:
        userSchema = yup.object({
          code: yup
            .string()
            .required(t('Code is required'))
            .matches(/^[0-9]+$/, t('Code must contain only digits'))
            .min(4, t('Code must be exactly 6 digits')),
        });
        return await userSchema.validate(formData, {abortEarly: false});
      default:
        return true;
    }
  };

  // Функция для подготовки данных перед отправкой
  const prepareFormData = data => {
    const {birthDate, ...rest} = data;

    const preparedData = {
      ...rest,
      email: data.email.toLowerCase(),
    };

    // Добавляем birth_date только для заказчиков
    if (data.type === '1' && birthDate) {
      preparedData.birth_date = birthDate;
    }

    return preparedData;
  };

  const handleSubmit = () => {
    setErrors([]);
    setLoading(true);

    // Дополнительная валидация файла лицензии для исполнителей на шаге 2
    if (step === 2 && formData.type === '0' && !licenseFile) {
      setErrors([{path: 'license', message: t('License file is required')}]);
      setLoading(false);
      return;
    }

    validate()
      .then(() => {
        switch (step) {
          case 1:
            // ✅ Приводим email к нижнему регистру перед отправкой
            const preparedData1 = prepareFormData(formData);
            console.log('LOG Отправляемые данные case 1:', preparedData1);
            return unifiedApi.registration
              .registrationStart(preparedData1)
              .then(response => {
                if (response.success) {
                  setStep(3);
                  setLoading(false);
                } else if (response.success === false) {
                  // Обработка ошибки от API
                  handleErrorResponse(response, setErrors, {
                    // Для ошибок валидации не показываем глобальные уведомления
                    showNotification: false,
                  });
                  setLoading(false);
                }
              })
              .catch(e => {
                handleErrorResponse(e, setErrors, {
                  // Для ошибок регистрации показываем уведомления
                  showNotification: true,
                });
                setLoading(false);
              });
          case 2:
            // ✅ Приводим email к нижнему регистру перед отправкой
            const preparedData2 = prepareFormData(formData);
            console.log('LOG Отправляемые данные case 2:', preparedData2);
            return unifiedApi.registration
              .registrationStart(preparedData2)
              .then(response => {
                if (response.success) {
                  setStep(3);
                  setLoading(false);
                } else if (response.success === false) {
                  // Обработка ошибки от API
                  handleErrorResponse(response, setErrors, {
                    // Для ошибок валидации не показываем глобальные уведомления
                    showNotification: false,
                  });
                  setLoading(false);
                }
              })
              .catch(e => {
                handleErrorResponse(e, setErrors, {
                  // Для ошибок регистрации показываем уведомления
                  showNotification: true,
                });
                setLoading(false);
              });
          case 3:
            // ✅ Приводим email к нижнему регистру перед отправкой
            const preparedData3 = prepareFormData(formData);
            console.log('LOG Отправляемые данные case 3:', preparedData3);
            return unifiedApi.registration
              .registrationEnd({
                ...preparedData3,
                step: 'confirm',
              })
              .then(async response => {
                if (response.success) {
                  const token = response.token;
                  setApiToken(token);
                  dispatch(login({token: token, userData: response.user}));

                  // Сохраняем завершение онбординга для нового пользователя
                  if (response.user?.id) {
                    await saveOnboardingCompletion(response.user.id);
                  }

                  // Очищаем partner_id из AsyncStorage после успешной регистрации
                  if (formData.partner_id) {
                    await AsyncStorage.removeItem('pending_partner_id');
                    console.log('Partner ID processed and cleared from storage');
                  }

                  // Загружаем файл лицензии для исполнителей
                  if (formData.type === '0' && licenseFile) {
                    try {
                      const licenseFormData = new FormData();
                      licenseFormData.append('license_file', {
                        uri: licenseFile.fileCopyUri || licenseFile.uri,
                        type: licenseFile.type,
                        name: licenseFile.name,
                      });

                      const licenseResponse = await retryApiCall(() =>
                        api.user.uploadLicense(licenseFormData),
                      );

                      if (licenseResponse.success) {
                        console.log(
                          'License uploaded successfully during registration',
                        );
                      } else {
                        console.error(
                          'Failed to upload license during registration:',
                          licenseResponse.message,
                        );
                        // Не останавливаем регистрацию из-за ошибки загрузки лицензии
                        // Пользователь сможет загрузить ее позже в профиле
                      }
                    } catch (error) {
                      console.error(
                        'Error uploading license during registration:',
                        error,
                      );
                      // Не останавливаем регистрацию из-за ошибки загрузки лицензии
                    }
                  }

                  // Переходим на главный экран для всех типов пользователей
                  setLoading(false);
                  return navigation.reset({
                    index: 0,
                    routes: [{name: 'MainStack'}],
                  });
                } else if (response.success === false) {
                  // Обработка ошибки от API
                  handleErrorResponse(response, setErrors, {
                    // Для ошибок валидации не показываем глобальные уведомления
                    showNotification: false,
                  });
                  setLoading(false);
                }
              })
              .catch(e => {
                handleErrorResponse(e, setErrors, {
                  // Для ошибок регистрации показываем уведомления
                  showNotification: true,
                });
                setLoading(false);
              });
          default:
            return;
        }
      })
      .catch(e => {
        setErrors(innerToArray(e.inner));
        setLoading(false);
      });
  };

  return {
    step,
    setStep,
    formData,
    errors,
    handleInputChange,
    handleSubmit,
    loading,
    licenseFile,
    handleLicenseFileSelect,
    workDirections,
    workTypes,
    workTypesLoading,
    selectedDirections,
    toggleWorkDirection,
    toggleWorkType,
  };
}

export const innerToArray = inner => {
  return inner.map(e => ({path: e.path, message: e.message}));
};
