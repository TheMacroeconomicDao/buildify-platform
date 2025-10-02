import {api, retryApiCall, setApiToken} from '../services/index';
import {useDispatch, useSelector} from 'react-redux';
import {useState, useEffect} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import React from 'react';
import * as yup from 'yup';
import {login} from '../actions/auth';
import {innerToArray, handleErrorResponse} from './useRegistration';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {notifyError, notifySuccess, showConfirm} from '../services/notify';
import {useTranslation} from 'react-i18next';
import DocumentPicker from 'react-native-document-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import config from '../config';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

export function usePersonalData() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const userData = auth.userData;
  const isWorker = auth.userData?.type == 0;
  const width = Dimensions.get('window').width;
  const contentWidth = width - 16 * 2; // Предположим, что styles.paddingHorizontal = 16

  // Состояния с гарантированными начальными значениями
  const [formData, setFormData] = useState({
    email: userData?.email || '',
    name: userData?.name || '',
    about_me: userData?.about_me || '',
    categories: auth?.categories || [],
    license: userData?.license || '',
    portfolios: userData?.portfolios || userData?.portfolio || [],
    facebook: userData?.facebook || '',
    telegram: userData?.telegram || '',
    whatsApp: userData?.whatsApp || '',
    phone: userData?.phone || '',
    viber: userData?.viber || '',
  });
  const [newAvatat, setNewAvatar] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [passVisible, setPassVisible] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  // Валидация формы
  const validate = async () => {
    let userSchema = isWorker
      ? yup.object({
          email: yup
            .string()
            .email('Email is not valid')
            .required('Email is required'),
          name: yup.string().required('Name is required'),
          license: yup.string().required('License is required'),
        })
      : yup.object({
          email: yup
            .string()
            .email('Email is not valid')
            .required('Email is required'),
          name: yup.string().required('Name is required'),
          phone: yup.string().required('Phone is required'),
        });
    return await userSchema.validate(formData, {abortEarly: false});
  };

  // Загрузка данных пользователя
  async function handleLoadUserData() {
    return retryApiCall(() => api.user.apiUserMe())
      .then(response => {
        if (response.success && response.user) {
          dispatch({type: 'SET_USERDATA', payload: {...response.user}});
        }
      })
      .catch(err => {
        console.error('Ошибка при загрузке данных пользователя:', err);

        // Проверяем статус ошибки - если 401/403, то разлогиниваем и перекидываем на онбординг
        // 400 с "Unauthenticated" теперь обрабатывается глобально в axios интерцепторе
        const status = err.response?.status || err.status;
        if (status === 401 || status === 403) {
          console.log(
            'Ошибка авторизации (401/403) - разлогиниваем пользователя и перекидываем на онбординг',
          );
          setApiToken(null);
          dispatch({type: 'LOG_OUT'});
          navigation.replace('Loading');
        }
      });
  }

  // Изменение полей формы
  const handleInputChange = React.useCallback((target, value) => {
    setFormData(prevFormData => ({...prevFormData, [target]: value}));
  }, []);

  // Мемоизированные обработчики для контактов
  const handleEmailChange = React.useCallback(
    value => handleInputChange('email', value),
    [handleInputChange],
  );
  const handlePhoneChange = React.useCallback(
    value => handleInputChange('phone', value),
    [handleInputChange],
  );
  const handleTelegramChange = React.useCallback(
    value => handleInputChange('telegram', value),
    [handleInputChange],
  );
  const handleWhatsAppChange = React.useCallback(
    value => handleInputChange('whatsApp', value),
    [handleInputChange],
  );
  const handleFacebookChange = React.useCallback(
    value => handleInputChange('facebook', value),
    [handleInputChange],
  );
  const handleViberChange = React.useCallback(
    value => handleInputChange('viber', value),
    [handleInputChange],
  );
  const handleNameChange = React.useCallback(
    value => handleInputChange('name', value),
    [handleInputChange],
  );
  const handleAboutMeChange = React.useCallback(
    value => handleInputChange('about_me', value),
    [handleInputChange],
  );
  const handleLicenseChange = React.useCallback(
    value => handleInputChange('license', value),
    [handleInputChange],
  );

  // Отправка формы на сервер
  const handleSubmit = async () => {
    setErrors([]);
    validate()
      .then(() => {
        // Функция для преобразования пустой строки в null
        const toNullIfEmpty = value =>
          value && value.trim() !== '' ? value.trim() : null;

        const formDataToSend = isWorker
          ? {
              name: formData.name?.trim() || '',
              email: formData.email?.trim().toLowerCase() || '', // ✅ Приводим email к нижнему регистру
              about_me: toNullIfEmpty(formData.about_me),
              telegram: toNullIfEmpty(formData.telegram),
              whatsApp: toNullIfEmpty(formData.whatsApp),
              facebook: toNullIfEmpty(formData.facebook),
              viber: toNullIfEmpty(formData.viber),
              license: formData.license?.trim() || '',
              portfolios: formData.portfolios?.map(item => item.id),
            }
          : {
              name: formData.name?.trim() || '',
              email: formData.email?.trim().toLowerCase() || '', // ✅ Приводим email к нижнему регистру
              phone: formData.phone?.trim() || '',
              about_me: toNullIfEmpty(formData.about_me),
              telegram: toNullIfEmpty(formData.telegram),
              whatsApp: toNullIfEmpty(formData.whatsApp),
              facebook: toNullIfEmpty(formData.facebook),
            };

        retryApiCall(() => api.user.apiUserEdit(formDataToSend))
          .then(response => {
            if (response.success) {
              handleLoadUserData();
              notifySuccess(t('Success'), t('Profile updated successfully'), {
                onPress: () => navigation.pop(),
              });
            } else {
              // Обрабатываем ошибки валидации через handleErrorResponse
              handleErrorResponse(response, setErrors, {
                // Для ошибок валидации не показываем глобальные уведомления
                showNotification: false,
              });
            }
          })
          .catch(err => {
            console.error('Ошибка при обновлении профиля:', err);
            // Обрабатываем сетевые и другие ошибки через handleErrorResponse
            handleErrorResponse(err, setErrors, {
              // Для сетевых ошибок показываем уведомления
              showNotification: true,
            });
          });
      })
      .catch(e => setErrors(innerToArray(e?.inner)));
  };

  // Обработка обновления аватара
  useEffect(() => {
    if (!newAvatat?.assets) return;
    const file = newAvatat?.assets[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', {
        uri: file.uri,
        type: file.type,
        name: file.fileName || 'avatar.jpg',
      });

      retryApiCall(() => api.user.apiUserUpdateAvatarCorrect(formData))
        .then(response => {
          if (response.success) {
            setNewAvatar(null);
            handleLoadUserData();
          }
        })
        .catch(err => {
          setNewAvatar(null);
          handleLoadUserData();
          if (err.response?.data?.error) {
            return [
              {url: err?.request._url, message: err.response?.data?.error},
            ];
          } else {
            return [{url: err?.request._url, message: err.message}];
          }
        });
    }
  }, [newAvatat]);

  // ✅ Инициализация данных формы только при загрузке новых данных пользователя
  useEffect(() => {
    // ✅ Исправлено: проверяем изменения всех ключевых полей, а не только email
    if (
      userData?.email &&
      (!formData.email ||
        formData.email !== userData.email ||
        formData.name !== userData.name ||
        formData.about_me !== userData.about_me)
    ) {
      setFormData(prevFormData => ({
        email: userData.email || '',
        name: userData.name || '',
        about_me: userData.about_me || '',
        categories: auth.categories || [],
        license: userData.license || '',
        portfolios: userData.portfolios || userData.portfolio || [],
        facebook: userData.facebook || '',
        telegram: userData.telegram || '',
        whatsApp: userData.whatsApp || '',
        phone: userData.phone || '',
        viber: userData.viber || '',
      }));
    }
  }, [userData?.email, userData?.name, userData?.about_me]); // ✅ Добавлено userData?.about_me в зависимости

  // ✅ Загрузка данных только при первом монтировании компонента
  useEffect(() => {
    // Проверяем, что пользователь авторизован перед загрузкой данных
    if (!auth.logged) {
      console.log('usePersonalData: User not logged in, skipping data load');
      return;
    }

    // Загружаем данные только один раз при монтировании
    handleLoadUserData();
  }, [auth.logged]); // Добавляем auth.logged в зависимости

  // Загрузка отзывов пользователя с сервера
  useEffect(() => {
    const fetchReviews = async () => {
      if (!auth.userData?.id) return;

      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const response = await retryApiCall(() =>
          api.executors.reviewsList(auth.userData.id),
        );

        if (response.success) {
          setReviews(response.result || []);
        } else {
          throw new Error(response.message || 'Не удалось получить отзывы');
        }
      } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
        setReviewsError(
          error.message || 'Произошла ошибка при загрузке отзывов',
        );
      } finally {
        setReviewsLoading(false);
      }
    };

    if (isWorker) {
      fetchReviews();
    }
  }, [auth.userData?.id, isWorker]);

  // Функции
  const toggleEditMode = () => {
    if (isEdit) handleSubmit();
    setIsEdit(!isEdit);
  };

  const toggleMenuVisible = () => {
    setMenuVisible(!menuVisible);
  };

  const togglePasswordModal = () => {
    setPassVisible(!passVisible);
  };

  const toggleDeleteModal = () => {
    setShowDelete(!showDelete);
  };

  const toggleCategoriesExpanded = () => {
    setIsCategoriesExpanded(!isCategoriesExpanded);
  };

  // ✅ Улучшенная функция открытия ссылок с fallback вариантами
  const openLink = async (type, value) => {
    if (!value || value.trim() === '') {
      Alert.alert(t('Error'), t('Contact information is not available'));
      return;
    }

    const cleanValue = value.trim();

    switch (type) {
      case 'phone':
        await openPhoneLink(cleanValue);
        break;
      case 'email':
        await openEmailLink(cleanValue);
        break;
      case 'telegram':
        await openTelegramLink(cleanValue);
        break;
      case 'whatsapp':
        await openWhatsAppLink(cleanValue);
        break;
      case 'viber':
        await openViberLink(cleanValue);
        break;
      case 'facebook':
        await openFacebookLink(cleanValue);
        break;
      default:
        Alert.alert(t('Error'), t('Unsupported contact type'));
    }
  };

  // Функция для открытия телефонных ссылок
  const openPhoneLink = async phone => {
    const telUrl = `tel:${phone}`;

    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
      } else {
        // Fallback: предлагаем скопировать номер
        Alert.alert(
          t('Cannot make call'),
          t(
            'Phone calls are not supported on this device. Would you like to copy the number?',
          ),
          [
            {text: t('Cancel'), style: 'cancel'},
            {
              text: t('Copy'),
              onPress: () => {
                // ✅ Временное решение: показываем номер пользователю для ручного копирования
                Alert.alert(t('Phone Number'), phone, [
                  {text: t('OK'), style: 'default'},
                ]);
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error opening phone link:', error);
      Alert.alert(t('Error'), t('Failed to open phone application'));
    }
  };

  // Функция для открытия email ссылок
  const openEmailLink = async email => {
    const mailtoUrl = `mailto:${email}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        // Fallback: предлагаем скопировать email
        Alert.alert(
          t('Cannot send email'),
          t(
            'Email application is not available. Would you like to copy the email address?',
          ),
          [
            {text: t('Cancel'), style: 'cancel'},
            {
              text: t('Copy'),
              onPress: () => {
                Alert.alert(t('Email Address'), email, [
                  {text: t('OK'), style: 'default'},
                ]);
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error opening email link:', error);
      Alert.alert(t('Error'), t('Failed to open email application'));
    }
  };

  // Функция для открытия Telegram ссылок
  const openTelegramLink = async username => {
    const cleanUsername = username.replace('@', '');
    const telegramAppUrl = `tg://resolve?domain=${cleanUsername}`;
    const telegramWebUrl = `https://t.me/${cleanUsername}`;

    try {
      // Сначала пробуем открыть в приложении Telegram
      const canOpenApp = await Linking.canOpenURL(telegramAppUrl);
      if (canOpenApp) {
        await Linking.openURL(telegramAppUrl);
        return;
      }

      // Если приложение недоступно, предлагаем варианты
      Alert.alert(
        t('Open Telegram'),
        t('Telegram app is not installed. How would you like to proceed?'),
        [
          {text: t('Cancel'), style: 'cancel'},
          {
            text: t('Open in Browser'),
            onPress: async () => {
              try {
                await Linking.openURL(telegramWebUrl);
              } catch (error) {
                console.error('Error opening Telegram web:', error);
                Alert.alert(
                  t('Error'),
                  t('Failed to open Telegram in browser'),
                );
              }
            },
          },
          {
            text: t('Copy Username'),
            onPress: () => {
              Alert.alert(t('Telegram Username'), `@${cleanUsername}`, [
                {text: t('OK'), style: 'default'},
              ]);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error opening Telegram link:', error);
      Alert.alert(t('Error'), t('Failed to open Telegram'));
    }
  };

  // Функция для открытия WhatsApp ссылок
  const openWhatsAppLink = async phone => {
    const cleanPhone = phone.replace(/[^0-9+]/g, ''); // Убираем все кроме цифр и +
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
    const whatsappWebUrl = `https://wa.me/${cleanPhone.replace('+', '')}`;

    try {
      // Сначала пробуем открыть в приложении WhatsApp
      const canOpenApp = await Linking.canOpenURL(whatsappUrl);
      if (canOpenApp) {
        await Linking.openURL(whatsappUrl);
        return;
      }

      // Если приложение недоступно, предлагаем варианты
      Alert.alert(
        t('Open WhatsApp'),
        t('WhatsApp is not installed. How would you like to proceed?'),
        [
          {text: t('Cancel'), style: 'cancel'},
          {
            text: t('Open in Browser'),
            onPress: async () => {
              try {
                await Linking.openURL(whatsappWebUrl);
              } catch (error) {
                console.error('Error opening WhatsApp web:', error);
                Alert.alert(
                  t('Error'),
                  t('Failed to open WhatsApp in browser'),
                );
              }
            },
          },
          {
            text: t('Copy Number'),
            onPress: () => {
              Alert.alert(t('WhatsApp Number'), cleanPhone, [
                {text: t('OK'), style: 'default'},
              ]);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error opening WhatsApp link:', error);
      Alert.alert(t('Error'), t('Failed to open WhatsApp'));
    }
  };

  // Функция для открытия Viber ссылок
  const openViberLink = async phone => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const viberUrl = `viber://chat?number=${cleanPhone}`;

    try {
      const canOpenApp = await Linking.canOpenURL(viberUrl);
      if (canOpenApp) {
        await Linking.openURL(viberUrl);
      } else {
        // Для Viber нет веб-версии, только предлагаем скопировать номер
        Alert.alert(
          t('Viber not available'),
          t('Viber is not installed. Would you like to copy the phone number?'),
          [
            {text: t('Cancel'), style: 'cancel'},
            {
              text: t('Copy Number'),
              onPress: () => {
                Alert.alert(t('Viber Number'), cleanPhone, [
                  {text: t('OK'), style: 'default'},
                ]);
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error opening Viber link:', error);
      Alert.alert(t('Error'), t('Failed to open Viber'));
    }
  };

  // Функция для открытия Facebook ссылок
  const openFacebookLink = async username => {
    const cleanUsername = username
      .replace(/^@/, '')
      .replace(/^facebook\.com\//, '');
    const facebookAppUrl = `fb://profile/${cleanUsername}`;
    const facebookWebUrl = `https://www.facebook.com/${cleanUsername}`;

    try {
      // Сначала пробуем открыть в приложении Facebook
      const canOpenApp = await Linking.canOpenURL(facebookAppUrl);
      if (canOpenApp) {
        await Linking.openURL(facebookAppUrl);
        return;
      }

      // Если приложение недоступно, предлагаем варианты
      Alert.alert(
        t('Open Facebook'),
        t('Facebook app is not installed. How would you like to proceed?'),
        [
          {text: t('Cancel'), style: 'cancel'},
          {
            text: t('Open in Browser'),
            onPress: async () => {
              try {
                await Linking.openURL(facebookWebUrl);
              } catch (error) {
                console.error('Error opening Facebook web:', error);
                Alert.alert(
                  t('Error'),
                  t('Failed to open Facebook in browser'),
                );
              }
            },
          },
          {
            text: t('Copy Profile'),
            onPress: () => {
              Alert.alert(t('Facebook Profile'), facebookWebUrl, [
                {text: t('OK'), style: 'default'},
              ]);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error opening Facebook link:', error);
      Alert.alert(t('Error'), t('Failed to open Facebook'));
    }
  };

  const handleEditCategories = () => {
    navigation.navigate('SelectDirection');
  };

  const pickFromCamera = () => {
    toggleMenuVisible();
    launchCamera({mediaType: 'photo'}, response => {
      if (response.didCancel) return;
      if (response.errorCode) return;
      setNewAvatar(response);
    });
  };

  const pickFromGallery = () => {
    toggleMenuVisible();
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.didCancel) return;
      if (response.errorCode) return;
      setNewAvatar(response);
    });
  };

  const addPortfolioItem = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      });

      const file = result[0];

      // ✅ Сразу загружаем файл на сервер

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });

      const uploadResponse = await retryApiCall(() =>
        api.files.storeCreate(formData),
      );

      if (
        uploadResponse.success &&
        uploadResponse.result &&
        uploadResponse.result.file_id
      ) {
        const newPortfolioItem = {
          id: uploadResponse.result.file_id.id,
          name: file.name,
          type: file.type,
          path: uploadResponse.result.file_id.path, // ✅ Для отображения
          file_path: uploadResponse.result.file_id.path, // ✅ Для API
        };

        setFormData(prev => ({
          ...prev,
          portfolios: [...prev.portfolios, newPortfolioItem],
        }));

        Alert.alert(t('Success'), t('File added to portfolio successfully'));
      } else {
        throw new Error(uploadResponse.message || 'Не удалось загрузить файл');
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        return;
      }
      console.error('Ошибка загрузки файла портфолио:', err);
      Alert.alert(
        t('Error'),
        err.message || t('Failed to add file to portfolio'),
      );
    }
  };

  const removePortfolioItem = index => {
    const itemToRemove = formData.portfolios[index];

    // ✅ Предупреждаем пользователя о удалении
    Alert.alert(
      t('Confirm deletion'),
      t('Are you sure you want to delete this portfolio item?'),
      [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: () => {
            const newPortfolios = [...formData.portfolios];
            newPortfolios.splice(index, 1);
            setFormData({...formData, portfolios: newPortfolios});

            console.log('Удален элемент портфолио:', itemToRemove);
            Alert.alert(t('Success'), t('Portfolio item removed'));
          },
        },
      ],
    );
  };

  const retryFetchReviews = () => {
    if (isWorker) {
      setReviewsLoading(true);
      setReviewsError(null);

      retryApiCall(() => api.executors.reviewsList(auth.userData.id))
        .then(response => {
          if (response.success) {
            setReviews(response.result || []);
          } else {
            throw new Error(response.message || 'Не удалось получить отзывы');
          }
        })
        .catch(error => {
          console.error('Ошибка при загрузке отзывов:', error);
          setReviewsError(
            error.message || 'Произошла ошибка при загрузке отзывов',
          );
        })
        .finally(() => {
          setReviewsLoading(false);
        });
    }
  };

  // Вычисляемые значения
  const ordersCount = isWorker ? userData.orders_count || 0 : 0;
  const averageRating = isWorker
    ? userData.average_rating || userData.rating || 0
    : 0;

  // Стили для тени карточки (в зависимости от платформы)
  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  });

  // Функции просмотра и скачивания файлов
  const getFileTypeFromUrl = url => {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
    };
    return {
      mimeType: mimeTypes[extension] || 'image/jpeg',
      ext: mimeTypes[extension] ? extension : 'jpg',
    };
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: t('Storage Permission'),
            message: t('App needs access to save images'),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: t('Storage Permission'),
            message: t('App needs access to save images'),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const viewFile = async (fileUri, fileName, mimeType) => {
    try {
      if (fileUri.startsWith('file://') || !fileUri.startsWith('http')) {
        await FileViewer.open(fileUri, {
          displayName: fileName,
          showOpenWithDialog: Platform.OS === 'android',
          showAppsSuggestions: Platform.OS === 'android',
        });
        return;
      }

      const tempDir = RNFS.TemporaryDirectoryPath;
      const fileExtension = getFileTypeFromUrl(fileUri).ext;
      const timestamp = new Date().getTime();
      const tempFileName = `temp_${timestamp}.${fileExtension}`;
      const tempFilePath = `${tempDir}/${tempFileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUri,
        toFile: tempFilePath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        await FileViewer.open(tempFilePath, {
          displayName: fileName || `file.${fileExtension}`,
          showOpenWithDialog: Platform.OS === 'android',
          showAppsSuggestions: Platform.OS === 'android',
          onDismiss: async () => {
            try {
              await RNFS.unlink(tempFilePath);
            } catch (error) {
              console.log('Error deleting temporary file:', error);
            }
          },
        });
      }
    } catch (error) {
      console.error('File viewing error:', error);
      Alert.alert(t('Cannot Open File'), t('Failed to open file'));
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      if (Platform.OS === 'ios') {
        Alert.alert(
          t('Save Image'),
          t('Where would you like to save the image?'),
          [
            {text: t('Cancel'), style: 'cancel'},
            {
              text: t('Photo Library'),
              onPress: () => saveToPhotoLibrary(fileUrl, fileName),
            },
            {
              text: t('Files App'),
              onPress: () => saveToDocuments(fileUrl, fileName),
            },
          ],
        );
      } else {
        await saveToDocuments(fileUrl, fileName);
      }
    } catch (error) {
      Alert.alert(
        t('Download Failed'),
        error.message || t('Failed to download file. Please try again.'),
      );
    }
  };

  const saveToPhotoLibrary = async (fileUrl, fileName) => {
    try {
      // ✅ Исправлено: Используем правильный способ запроса разрешений для iOS
      if (Platform.OS === 'ios') {
        // Для iOS просто пробуем сохранить, CameraRoll.save сам запросит разрешение
        // если оно не предоставлено
      }

      const timestamp = new Date().getTime();
      const fileExtension = getFileTypeFromUrl(fileUrl).ext;
      const tempPath = `${RNFS.TemporaryDirectoryPath}/${timestamp}_${fileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: tempPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        await CameraRoll.save(tempPath, {type: 'photo'});
        await RNFS.unlink(tempPath);
        Alert.alert(t('Success'), t('Image saved to Photo Library'));
      }
    } catch (error) {
      console.error('Save to photo library error:', error);
      Alert.alert(
        t('Save Failed'),
        error.message || t('Failed to save image to gallery'),
      );
    }
  };

  const saveToDocuments = async (fileUrl, fileName) => {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            t('Permission Required'),
            t('Storage permission is required to download files'),
          );
          return;
        }
      }

      const downloadDir =
        Platform.OS === 'ios'
          ? RNFS.DocumentDirectoryPath
          : RNFS.DownloadDirectoryPath;
      const timestamp = new Date().getTime();
      const fileExtension = getFileTypeFromUrl(fileUrl).ext;
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      const finalFileName = `${baseFileName}_${timestamp}.${fileExtension}`;
      const filePath = `${downloadDir}/${finalFileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: filePath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          t('Download Complete'),
          Platform.OS === 'ios'
            ? t('File saved to Files app (Documents)')
            : t('File saved to Downloads folder'),
        );
      }
    } catch (error) {
      Alert.alert(t('Save Failed'), error.message || t('Failed to save file'));
    }
  };

  return {
    // Состояния
    formData,
    userData,
    errors,
    isEdit,
    menuVisible,
    passVisible,
    showDelete,
    isCategoriesExpanded,
    isWorker,
    reviews,
    reviewsLoading,
    reviewsError,
    contentWidth,

    // Вычисляемые значения
    ordersCount,
    averageRating,
    cardShadow,

    // Обработчики для формы
    setNewAvatar,
    handleInputChange,
    handleSubmit,

    // Мемоизированные обработчики для контактов
    handleEmailChange,
    handlePhoneChange,
    handleTelegramChange,
    handleWhatsAppChange,
    handleFacebookChange,
    handleViberChange,
    handleNameChange,
    handleAboutMeChange,
    handleLicenseChange,

    // Функции для управления UI
    toggleEditMode,
    toggleMenuVisible,
    togglePasswordModal,
    toggleDeleteModal,
    toggleCategoriesExpanded,
    openLink,
    handleEditCategories,
    pickFromCamera,
    pickFromGallery,
    addPortfolioItem,
    removePortfolioItem,
    retryFetchReviews,
    viewFile,
    downloadFile,
  };
}

export default usePersonalData;
