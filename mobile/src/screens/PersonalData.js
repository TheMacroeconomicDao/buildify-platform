import React, {useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  notifyError,
  notifySuccess,
  notifyInfo,
  showConfirm,
} from '../services/notify';
import {launchImageLibrary} from 'react-native-image-picker';
import Text from '../components/Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomSheet from '../components/BottomSheet';
import LicenseUpload from '../components/LicenseUpload';
import EditableDataField from '../components/EditableDataField';
import StandardButton from '../components/StandardButton';
import WorkTypeSelector from '../components/WorkTypeSelector';
import PhoneInput from '../components/PhoneInput';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useSelector, useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import {api, retryApiCall, setApiToken} from '../services/index';
import {unifiedApi} from '../services/unified-api';
import {clearOnboardingData} from '../utils/onboardingUtils';
import config, {getAvatarUrl} from '../config';

export default function PersonalData({navigation}) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const userData = useSelector(state => state.auth.userData);
  const logged = useSelector(state => state.auth.logged);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);
  const [workSettings, setWorkSettings] = useState([]);
  const [workSettingsLoading, setWorkSettingsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showExitAlert, setShowExitAlert] = useState(false);

  // Состояние для редактируемых данных
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    work_experience: '',
    about_me: '',
    telegram: '',
    whatsApp: '',
    facebook: '',
    viber: '',
    workSettings: [], // Добавляем workSettings в начальное состояние
  });

  // Состояние для ошибок валидации
  const [errors, setErrors] = useState({});

  // Определяем тип пользователя (0=Исполнитель, 1=Заказчик)
  const isWorker = userData?.type === 0;

  // Функция загрузки work settings пользователя
  const loadWorkSettings = async () => {
    if (!isWorker) return;

    setWorkSettingsLoading(true);
    try {
      const response = await retryApiCall(() =>
        unifiedApi.user.getWorkSettings(),
      );
      console.log('PersonalData: getWorkSettings response:', response);
      if (response.success) {
        console.log('PersonalData: workSettings result:', response.result);
        setWorkSettings(response.result || []);
      } else {
        console.error('Failed to load work settings:', response.message);
      }
    } catch (error) {
      console.error('Error loading work settings:', error);
    } finally {
      setWorkSettingsLoading(false);
    }
  };

  // Функция обновления данных пользователя
  const refreshUserData = async () => {
    try {
      console.log('=== REFRESH USER DATA ===');
      const response = await retryApiCall(() => api.user.apiUserMe());
      console.log(
        'User data refresh response:',
        JSON.stringify(response, null, 2),
      );

      if (response.success) {
        const apiUserData =
          response.user || response.result?.user || response.result;
        if (apiUserData) {
          console.log('✅ Dispatching fresh user data to Redux');
          console.log(
            'Fresh apiUserData from API:',
            JSON.stringify(apiUserData, null, 2),
          );
          dispatch({
            type: 'SET_USERDATA',
            payload: apiUserData,
          });
        } else {
          console.log('❌ No userData found in API response');
        }
      } else {
        console.log('❌ API call failed:', response.message);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);

      // Проверяем статус ошибки - если 401/403, то разлогиниваем и перекидываем на онбординг
      // 400 с "Unauthenticated" теперь обрабатывается глобально в axios интерцепторе
      const status = error.response?.status || error.status;
      if (status === 401 || status === 403) {
        console.log(
          'Ошибка авторизации (401/403) - разлогиниваем пользователя и перекидываем на онбординг',
        );
        setApiToken(null);
        dispatch({type: 'LOG_OUT'});
        navigation.replace('Loading');
        return;
      }
    }
  };

  // Функция для инициализации данных редактирования
  const initEditData = () => {
    // Преобразуем дату из YYYY-MM-DD в dd.mm.yyyy для редактирования
    const birthDate = userData?.birth_date || '';
    let editBirthDate = birthDate;
    if (birthDate && birthDate.includes('-') && birthDate.length === 10) {
      const [year, month, day] = birthDate.split('-');
      editBirthDate = `${day}.${month}.${year}`;
    }

    const newEditData = {
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      birth_date: editBirthDate,
      work_experience: userData?.work_experience?.toString() || '',
      about_me: userData?.about_me || '',
      telegram: userData?.telegram || '',
      whatsApp: userData?.whatsApp || '',
      facebook: userData?.facebook || '',
      viber: userData?.viber || '',
      workSettings: workSettings, // Добавляем workSettings в editData
    };

    setEditData(newEditData);
    setErrors({});
  };

  // Функция для изменения значения поля
  const handleFieldChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Функция валидации данных
  const validateData = () => {
    const newErrors = {};

    // Обязательные поля
    if (!editData.name.trim()) {
      newErrors.name = t('Name is required');
    }

    if (!editData.email.trim()) {
      newErrors.email = t('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      newErrors.email = t('Invalid email format');
    }

    if (!editData.phone.trim()) {
      newErrors.phone = t('Phone is required');
    } else if (!/^\+\d{10,15}$/.test(editData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('Invalid phone format');
    }

    // Дата рождения обязательна только для заказчиков
    if (!isWorker) {
      if (!editData.birth_date.trim()) {
        newErrors.birth_date = t('Birth date is required');
      } else {
        // Проверяем формат DD.MM.YYYY
        const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!datePattern.test(editData.birth_date)) {
          newErrors.birth_date = t('Invalid date format');
        } else {
          // Парсим дату в формате DD.MM.YYYY
          const [day, month, year] = editData.birth_date.split('.');
          const birthDate = new Date(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
          );

          // Проверяем валидность даты
          if (
            birthDate.getFullYear() !== parseInt(year, 10) ||
            birthDate.getMonth() !== parseInt(month, 10) - 1 ||
            birthDate.getDate() !== parseInt(day, 10)
          ) {
            newErrors.birth_date = t('Invalid date');
          } else if (birthDate >= new Date()) {
            newErrors.birth_date = t('Birth date must be in the past');
          }
        }
      }
    }

    // Опциональные поля с проверкой
    if (
      editData.work_experience &&
      (isNaN(editData.work_experience) ||
        editData.work_experience < 0 ||
        editData.work_experience > 50)
    ) {
      newErrors.work_experience = t(
        'Work experience must be between 0 and 50 years',
      );
    }

    if (editData.about_me && editData.about_me.length > 1000) {
      newErrors.about_me = t('About me must not exceed 1000 characters');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Функция сохранения данных
  const handleSave = async () => {
    if (!validateData()) {
      return;
    }

    setSaveLoading(true);

    try {
      // Конвертируем дату из DD.MM.YYYY в YYYY-MM-DD для API
      let birthDateForApi = editData.birth_date;
      if (editData.birth_date && editData.birth_date.includes('.')) {
        const [day, month, year] = editData.birth_date.split('.');
        birthDateForApi = `${year}-${month}-${day}`;
      }

      const dataToSend = {
        name: editData.name.trim(),
        email: editData.email.trim(),
        phone: editData.phone.trim(),
        birth_date: birthDateForApi,
      };

      // Добавляем опциональные поля только если они заполнены
      if (editData.work_experience) {
        dataToSend.work_experience = parseInt(editData.work_experience, 10);
      }

      if (isWorker && editData.about_me) {
        dataToSend.about_me = editData.about_me.trim();
      }

      if (editData.telegram) {
        dataToSend.telegram = editData.telegram.trim();
      }

      if (editData.whatsApp) {
        dataToSend.whatsApp = editData.whatsApp.trim();
      }

      if (editData.facebook) {
        dataToSend.facebook = editData.facebook.trim();
      }

      if (editData.viber) {
        dataToSend.viber = editData.viber.trim();
      }

      const response = await retryApiCall(() =>
        api.user.apiUserEdit(dataToSend),
      );

      // Сохраняем workSettings если они изменились (только для исполнителей)
      if (
        isWorker &&
        editData.workSettings &&
        editData.workSettings.length > 0
      ) {
        try {
          const workSettingsPayload = {
            'work-settings': editData.workSettings,
          };
          console.log('Sending work settings:', workSettingsPayload);
          const workSettingsResponse = await retryApiCall(() =>
            unifiedApi.user.setWorkSettings(workSettingsPayload),
          );

          if (workSettingsResponse.success) {
            console.log('✅ Work settings saved successfully');
            setWorkSettings(editData.workSettings);
          } else {
            console.error(
              '❌ Failed to save work settings:',
              workSettingsResponse.message,
            );
          }
        } catch (workSettingsError) {
          console.error('❌ Error saving work settings:', workSettingsError);
          // Не прерываем основное сохранение из-за ошибки work settings
        }
      }

      if (response.success) {
        console.log('=== SAVE SUCCESS ===');
        console.log('Full API response:', JSON.stringify(response, null, 2));
        console.log('Current userData:', JSON.stringify(userData, null, 2));
        console.log('Current editData:', JSON.stringify(editData, null, 2));

        // Обновляем данные пользователя немедленно из ответа
        const apiUserData =
          response.user || response.result?.user || response.result;

        if (apiUserData) {
          console.log('✅ API returned userData, updating Redux and editData');
          console.log(
            'apiUserData from API:',
            JSON.stringify(apiUserData, null, 2),
          );

          dispatch({
            type: 'SET_USERDATA',
            payload: apiUserData,
          });

          // После сохранения не преобразуем дату, оставляем в формате YYYY-MM-DD для отображения
          const birthDate = apiUserData.birth_date;

          // Также обновляем editData с новыми данными (дата в формате YYYY-MM-DD для отображения)
          const newEditData = {
            name: apiUserData?.name || '',
            email: apiUserData?.email || '',
            phone: apiUserData?.phone || '',
            birth_date: birthDate || '',
            work_experience: apiUserData?.work_experience?.toString() || '',
            about_me: apiUserData?.about_me || '',
            telegram: apiUserData?.telegram || '',
            whatsApp: apiUserData?.whatsApp || '',
            facebook: apiUserData?.facebook || '',
            viber: apiUserData?.viber || '',
            workSettings: workSettings, // Сохраняем актуальные workSettings
          };
          console.log(
            'Setting new editData:',
            JSON.stringify(newEditData, null, 2),
          );
          setEditData(newEditData);
        } else {
          console.log('❌ API did not return userData, forcing data refresh');
        }

        // Сразу выходим из режима редактирования и обновляем данные
        setIsEdit(false);

        // Дополнительно обновляем данные пользователя для синхронизации
        setTimeout(() => refreshUserData(), 100);

        notifySuccess(t('Success'), t('Personal data updated successfully'));
      } else {
        console.log(
          'API returned success=false, response.message:',
          response.message,
        );
        console.log('Type of response.message:', typeof response.message);

        // Обрабатываем ошибки валидации от API в response.message
        let errorMessage = t('Failed to update personal data');

        if (response.message) {
          // Если message - это объект с полями валидации
          if (typeof response.message === 'object') {
            // Извлекаем первую ошибку валидации
            const firstField = Object.keys(response.message)[0];
            const firstError = response.message[firstField];

            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          } else if (typeof response.message === 'string') {
            errorMessage = response.message;
          }
        }

        console.log(
          'Final error message to display (else block):',
          errorMessage,
        );
        console.log('Type of error message (else block):', typeof errorMessage);
        notifyError(t('Error'), errorMessage);
      }
    } catch (error) {
      console.error('Error updating personal data:', error);
      console.log('Error response data:', error.response?.data);
      console.log('Error data:', error.data);

      // Обрабатываем ошибки валидации от API
      let errorMessage = t('Failed to update personal data');

      if (error.response?.data?.message) {
        const apiMessage = error.response.data.message;

        // Если message - это объект с полями валидации
        if (typeof apiMessage === 'object') {
          // Извлекаем первую ошибку валидации
          const firstField = Object.keys(apiMessage)[0];
          const firstError = apiMessage[firstField];

          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        } else if (typeof apiMessage === 'string') {
          errorMessage = apiMessage;
        }
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log('Final error message to display:', errorMessage);
      console.log('Type of error message:', typeof errorMessage);
      notifyError(t('Error'), errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  // Функция для переключения режима редактирования
  const toggleEdit = () => {
    if (!isEdit) {
      initEditData();
    }
    setIsEdit(!isEdit);
  };

  // Инициализируем данные при загрузке userData (только если не в режиме редактирования)
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('userData changed to:', userData?.name, userData?.email);
    console.log('isEdit status:', isEdit);

    if (userData && !isEdit) {
      console.log('✅ Updating editData from userData');

      // Преобразуем дату рождения для отображения
      let displayBirthDate = userData?.birth_date || '';

      const newEditData = {
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        birth_date: displayBirthDate,
        work_experience: userData?.work_experience?.toString() || '',
        about_me: userData?.about_me || '',
        telegram: userData?.telegram || '',
        whatsApp: userData?.whatsApp || '',
        facebook: userData?.facebook || '',
        viber: userData?.viber || '',
      };
      console.log('New editData will be:', newEditData);
      setEditData(newEditData);
      setErrors({});
    } else {
      console.log('❌ Skipping editData update');
      console.log('Reason: userData exists?', !!userData, 'isEdit?', isEdit);
    }
  }, [userData, isEdit]);

  // Автоматически загружаем профиль при фокусе на экран
  // Обновляем workSettings в editData когда они загружаются
  useEffect(() => {
    if (workSettings.length > 0 && isEdit) {
      setEditData(prev => ({
        ...prev,
        workSettings: workSettings,
      }));
    }
  }, [workSettings, isEdit]);

  useFocusEffect(
    React.useCallback(() => {
      // Проверяем, что пользователь авторизован перед загрузкой профиля
      if (!logged) {
        console.log('PersonalData: User not logged in, skipping profile load');
        return;
      }

      const loadUserProfile = async () => {
        setLoading(true);
        try {
          const response = await retryApiCall(() => api.user.apiUserMe());
          if (response.success && response.result) {
            dispatch({type: 'SET_USERDATA', payload: {...response.result}});
          } else {
            console.error('Ошибка при загрузке профиля:', response);
          }
        } catch (error) {
          console.error('Ошибка при загрузке профиля пользователя:', error);

          // Проверяем статус ошибки - если 401/403, то разлогиниваем и перекидываем на онбординг
          // 400 с "Unauthenticated" теперь обрабатывается глобально в axios интерцепторе
          const status = error.response?.status || error.status;
          if (status === 401 || status === 403) {
            console.log(
              'Ошибка авторизации (401/403) - разлогиниваем пользователя и перекидываем на онбординг',
            );
            setApiToken(null);
            dispatch({type: 'LOG_OUT'});
            navigation.replace('Loading');
            return;
          }

          notifyError(t('Error'), t('Failed to load profile data'));
        } finally {
          setLoading(false);
        }
      };

      // Обновляем актуальные данные пользователя и work settings при входе на экран
      refreshUserData();
      loadWorkSettings();

      // Для исполнителей со статусом Pending - обновляем каждые 30 секунд
      let interval = null;
      if (isWorker && userData?.verification_status === 0) {
        console.log('Setting up auto-refresh for pending verification user');
        interval = setInterval(() => {
          console.log('Auto-refreshing user data for pending verification');
          refreshUserData();
        }, 30000); // 30 секунд
      }

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }, [logged, dispatch, t, isWorker, userData?.verification_status]),
  );

  const handleUploadPhoto = () => {
    const options = {
      title: t('Select Avatar'),
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        notifyError(t('Error'), response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        uploadAvatar(asset);
      }
    });
  };

  const uploadAvatar = async asset => {
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || 'avatar.jpg',
      });

      const result = await retryApiCall(() =>
        api.user.apiUserUpdateAvatarCorrect(formData),
      );

      if (result.success) {
        notifySuccess(t('Success'), t('Avatar updated successfully'));
        // Обновляем данные пользователя
        refreshUserData();
      } else {
        notifyError(
          t('Error'),
          result.error?.message || t('Failed to update avatar'),
        );
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      notifyError(t('Error'), t('Failed to update avatar'));
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteAlert(false);
    setDeleteLoading(true);

    try {
      const response = await retryApiCall(() => api.user.apiUserDelete());

      if (response.success) {
        // Очищаем все данные онбординга для показа нового онбординга
        await clearOnboardingData();

        notifySuccess(t('Account deleted successfully'), '', {
          onPress: () => {
            dispatch({type: 'LOG_OUT'});
            navigation.reset({index: 0, routes: [{name: 'MainStack'}]});
          },
        });
      } else {
        notifyError(
          t('Error'),
          response.message || t('Failed to delete account'),
        );
      }
    } catch (error) {
      console.error('Ошибка при удалении аккаунта:', error);
      notifyError(t('Error'), t('Failed to delete account'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExit = () => {
    setShowExitAlert(true);
  };

  const handleConfirmExit = async () => {
    setShowExitAlert(false);
    setExitLoading(true);

    try {
      await retryApiCall(() => api.logout.apiLogout());

      // Очищаем все данные онбординга для показа нового онбординга
      await clearOnboardingData();

      // Выход из аккаунта и переход на экран загрузки для проверки онбординга
      dispatch({type: 'LOG_OUT'});
      navigation.reset({
        index: 0,
        routes: [{name: 'Loading'}],
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // Даже если API запрос не удался, всё равно разлогиниваем локально
      // Очищаем данные онбординга даже при ошибке
      await clearOnboardingData();

      dispatch({type: 'LOG_OUT'});
      navigation.reset({
        index: 0,
        routes: [{name: 'Loading'}],
      });
    } finally {
      setExitLoading(false);
    }
  };

  return (
    <View style={personalStyles.container}>
      {/* HEADER */}
      <View style={[personalStyles.header, {paddingTop: insets.top + 16}]}>
        <View style={personalStyles.headerContent}>
          <TouchableOpacity
            style={personalStyles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={14} color="#323232" />
          </TouchableOpacity>

          <Text style={personalStyles.headerTitle}>{t('Personal data')}</Text>

          <TouchableOpacity
            style={personalStyles.editButton}
            onPress={toggleEdit}>
            <MaterialIcons
              name={isEdit ? 'close' : 'edit'}
              size={16}
              color={isEdit ? '#FF3B30' : '#8A94A0'}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={personalStyles.headerSeparator} />

      {loading && (
        <View style={personalStyles.loadingContainer}>
          <ActivityIndicator size="small" color="#3579F5" />
        </View>
      )}

      <ScrollView
        style={personalStyles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* PROFILE PHOTO */}
        <View style={personalStyles.photoSection}>
          {userData?.avatar ? (
            <Image
              source={{uri: getAvatarUrl(userData.avatar)}}
              style={personalStyles.avatar}
            />
          ) : (
            <View style={personalStyles.avatarPlaceholder}>
              <MaterialIcons name="person" size={64} color="#8A94A0" />
            </View>
          )}

          <TouchableOpacity
            style={[
              personalStyles.uploadButton,
              avatarLoading && {opacity: 0.6},
            ]}
            onPress={handleUploadPhoto}
            disabled={avatarLoading}>
            {avatarLoading ? (
              <ActivityIndicator size="small" color="#3579F5" />
            ) : (
              <MaterialIcons name="upload" size={24} color="#3579F5" />
            )}
            <Text style={personalStyles.uploadButtonText}>
              {avatarLoading ? t('Uploading...') : t('Upload photo')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FORM FIELDS */}
        <View style={personalStyles.formContainer}>
          <EditableDataField
            label={isWorker ? t('Company name') : t('Full name')}
            value={editData.name}
            onChangeText={value => handleFieldChange('name', value)}
            isEdit={isEdit}
            required={true}
            error={errors.name}
            placeholder={
              isWorker ? t('Enter company name') : t('Enter your full name')
            }
          />

          {!isWorker && (
            <EditableDataField
              label={t('Birth date')}
              value={editData.birth_date}
              onChangeText={value => handleFieldChange('birth_date', value)}
              isEdit={isEdit}
              fieldType="date"
              required={true}
              error={errors.birth_date}
            />
          )}

          {/* Phone field */}
          {isEdit ? (
            <PhoneInput
              value={editData.phone}
              onChange={value => handleFieldChange('phone', value)}
              placeholder={t('Phone number')}
              size="md"
              width="100%"
              error={errors.phone}
              style={personalStyles.phoneInputInField}
            />
          ) : (
            <EditableDataField
              label={t('Phone')}
              value={editData.phone}
              onChangeText={value => handleFieldChange('phone', value)}
              isEdit={isEdit}
              fieldType="phone"
              required={true}
              error={errors.phone}
              placeholder={t('Enter phone number with country code')}
            />
          )}

          <EditableDataField
            label={t('Email')}
            value={editData.email}
            onChangeText={value => handleFieldChange('email', value)}
            isEdit={isEdit}
            fieldType="email"
            required={true}
            error={errors.email}
            placeholder={t('Enter your email')}
          />

          {isWorker && (
            <EditableDataField
              label={t('Work experience (years)')}
              value={editData.work_experience}
              onChangeText={value =>
                handleFieldChange('work_experience', value)
              }
              isEdit={isEdit}
              fieldType="number"
              error={errors.work_experience}
              placeholder={t('Years of experience (0-50)')}
            />
          )}

          {isWorker && (
            <LicenseUpload
              licenseFilePath={userData?.license_file_path}
              verificationStatus={userData?.verification_status || 0}
              verificationComment={userData?.verification_comment}
              verifiedAt={userData?.verified_at}
              onUploadSuccess={refreshUserData}
            />
          )}

          {/* Work Types для исполнителей */}
          {isWorker && (
            <View style={{marginBottom: 16}}>
              <WorkTypeSelector
                currentWorkSettings={workSettings}
                isEdit={isEdit}
                editData={editData}
                onEditDataChange={handleFieldChange}
                loading={workSettingsLoading}
              />
            </View>
          )}

          {isWorker && (
            <EditableDataField
              label={t('About me')}
              value={editData.about_me}
              onChangeText={value => handleFieldChange('about_me', value)}
              isEdit={isEdit}
              isMultiline={true}
              error={errors.about_me}
              placeholder={t(
                'Tell about your experience, skills and advantages',
              )}
              maxLength={1000}
            />
          )}

          {/* Контакты */}
          <EditableDataField
            label={t('Telegram')}
            value={editData.telegram}
            onChangeText={value => handleFieldChange('telegram', value)}
            isEdit={isEdit}
            placeholder={t('Telegram username or link')}
          />

          <EditableDataField
            label={t('WhatsApp')}
            value={editData.whatsApp}
            onChangeText={value => handleFieldChange('whatsApp', value)}
            isEdit={isEdit}
            fieldType="phone"
            placeholder={t('WhatsApp number')}
          />

          <EditableDataField
            label={t('Facebook')}
            value={editData.facebook}
            onChangeText={value => handleFieldChange('facebook', value)}
            isEdit={isEdit}
            placeholder={t('Facebook username or link')}
          />

          <EditableDataField
            label={t('Viber')}
            value={editData.viber}
            onChangeText={value => handleFieldChange('viber', value)}
            isEdit={isEdit}
            placeholder={t('Viber number or username')}
          />

          {/* Кнопка сохранения */}
          {isEdit && (
            <View style={personalStyles.saveButtonContainer}>
              <StandardButton
                title={t('Save')}
                action={handleSave}
                loading={saveLoading}
                disabled={saveLoading}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM TABS */}
      <View style={personalStyles.bottomTabs}>
        <TouchableOpacity
          style={personalStyles.deleteTab}
          onPress={handleDeleteAccount}>
          <Text style={personalStyles.deleteTabText}>{t('Delete')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={personalStyles.exitTab} onPress={handleExit}>
          <Text style={personalStyles.exitTabText}>{t('Exit')}</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM SHEETS */}
      <BottomSheet
        visible={showDeleteAlert}
        title={t('Do you really want to delete your account?')}
        subtitle={t('Account cannot be restored')}
        confirmText={t('Delete')}
        cancelText={t('Cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteAlert(false)}
        loading={deleteLoading}
      />

      <BottomSheet
        visible={showExitAlert}
        title={t('Do you really want to exit?')}
        confirmText={t('Exit')}
        cancelText={t('Cancel')}
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitAlert(false)}
        loading={exitLoading}
      />
    </View>
  );
}

const personalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 28,
  },
  backButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F3F3F3',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  editButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F3F3F3',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 15,
    backgroundColor: '#E7EFFF',
    borderRadius: 36,
    gap: 10,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3579F5',
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  formContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  fieldContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 20,
    position: 'relative',
  },
  fieldLabelContainer: {
    position: 'absolute',
    top: -12,
    left: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    borderRadius: 42,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A94A0',
    lineHeight: 24,
    letterSpacing: -0.006,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#323232',
    lineHeight: 24,
    letterSpacing: -0.006,
  },
  fieldValueMultiline: {
    lineHeight: 24,
    minHeight: 72,
  },
  bottomTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  deleteTab: {
    flex: 1,
    height: 49,
    backgroundColor: '#F3F3F3',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#989898',
    lineHeight: 24,
    letterSpacing: -0.006,
  },
  exitTab: {
    flex: 1,
    height: 49,
    backgroundColor: '#3579F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: -0.006,
  },
  testTab: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  testTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
    letterSpacing: -0.006,
  },
  saveButtonContainer: {
    marginTop: 12,
    marginBottom: 40,
  },
  phoneInputInField: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 4,
  },
});
