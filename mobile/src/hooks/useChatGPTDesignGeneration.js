import {useState, useEffect} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {api, retryApiCall} from '../services';
import {notifyError, notifySuccess} from '../services/notify';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

export const useChatGPTDesignGeneration = navigation => {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const userId = auth.userData?.id || null;

  // Состояние формы
  const [description, setDescription] = useState('');
  const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [attachedPhotos, setAttachedPhotos] = useState([]);

  // Состояние генерации
  const [generationStatus, setGenerationStatus] = useState(null); // null, 'pending', 'complete', 'failed'
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState(null);

  // Опции для выбора
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [styleOptions, setStyleOptions] = useState([]);
  const [budgetOptions, setBudgetOptions] = useState([]);

  // Загрузка опций при инициализации
  useEffect(() => {
    loadGenerationOptions();
  }, []);

  /**
   * Загрузка опций для генерации дизайна
   */
  const loadGenerationOptions = async () => {
    try {
      const response = await retryApiCall(() => api.design.getOptions());

      if (response.success) {
        setRoomTypeOptions(response.data.room_types || []);
        setStyleOptions(response.data.styles || []);
        setBudgetOptions(response.data.budget_ranges || []);
      }
    } catch (error) {
      console.error('Error loading generation options:', error);
      // Устанавливаем базовые опции по умолчанию
      setDefaultOptions();
    }
  };

  /**
   * Установка опций по умолчанию
   */
  const setDefaultOptions = () => {
    setRoomTypeOptions([
      {key: 'living_room', label: t('Living Room')},
      {key: 'bedroom', label: t('Bedroom')},
      {key: 'kitchen', label: t('Kitchen')},
      {key: 'bathroom', label: t('Bathroom')},
      {key: 'dining_room', label: t('Dining Room')},
      {key: 'office', label: t('Office')},
    ]);

    setStyleOptions([
      {key: 'modern', label: t('Modern')},
      {key: 'classic', label: t('Classic')},
      {key: 'minimalist', label: t('Minimalist')},
      {key: 'arabic', label: t('Arabic Style')},
      {key: 'luxury', label: t('Luxury')},
    ]);

    setBudgetOptions([
      {min: 5000, max: 15000, label: '5,000 - 15,000 AED'},
      {min: 15000, max: 30000, label: '15,000 - 30,000 AED'},
      {min: 30000, max: 60000, label: '30,000 - 60,000 AED'},
      {min: 60000, max: 100000, label: '60,000 - 100,000 AED'},
      {min: 100000, max: null, label: '100,000+ AED'},
    ]);
  };

  /**
   * Polling для получения готовых изображений
   */
  const startImagePolling = (generationId, designData) => {
    console.log('Starting image polling for:', generationId);

    const pollImages = async () => {
      try {
        const response = await retryApiCall(() =>
          api.design.getGenerationStatus(generationId),
        );

        console.log('Polling response:', response);

        if (response.success) {
          if (response.status === 'completed' && response.images?.length > 0) {
            console.log('Images ready!', response.images.length);
            const updatedDesignData = {
              ...designData,
              images: response.images,
            };
            setGeneratedDesign(updatedDesignData);
            return true; // Останавливаем polling
          } else if (response.status === 'failed') {
            console.error('Image generation failed:', response.error_message);
            return true; // Останавливаем polling
          }
        }
        return false; // Продолжаем polling
      } catch (error) {
        console.error('Polling error:', error);
        return false;
      }
    };

    // Немедленная первая проверка
    pollImages().then(shouldStop => {
      if (!shouldStop) {
        // Если не готово, запускаем интервал
        const intervalId = setInterval(async () => {
          const shouldStop = await pollImages();
          if (shouldStop) {
            clearInterval(intervalId);
          }
        }, 5000); // Каждые 5 секунд

        // Максимум 15 минут
        setTimeout(() => {
          clearInterval(intervalId);
          console.log('Polling timeout reached');
        }, 900000);
      }
    });
  };

  /**
   * Генерация дизайна с использованием ChatGPT
   */
  const generateDesign = async () => {
    try {
      // Валидация
      if (!description.trim()) {
        setErrorMessage(t('Please provide a description'));
        setGenerationStatus('failed');
        return;
      }

      if (description.trim().length < 10) {
        setErrorMessage(t('Description must be at least 10 characters long'));
        setGenerationStatus('failed');
        return;
      }

      // Фотографии теперь опциональны - можно генерировать дизайн только по описанию

      // Сброс предыдущих результатов
      setErrorMessage('');
      setGenerationStatus('pending');
      setGeneratedDesign(null);
      setIsLoading(true);

      // Используем FormData для отправки с фотографиями (теперь обязательными)
      const formData = new FormData();

      formData.append('description', description.trim());

      selectedRoomTypes.forEach((type, index) => {
        formData.append(`room_type[${index}]`, type);
      });

      selectedStyles.forEach((style, index) => {
        formData.append(`style[${index}]`, style);
      });

      if (selectedBudget) {
        formData.append('budget[min]', selectedBudget.min.toString());
        if (selectedBudget.max !== null) {
          formData.append('budget[max]', selectedBudget.max.toString());
        }
      }

      // Добавляем фотографии
      attachedPhotos.forEach((photo, index) => {
        formData.append(`photos[${index}]`, {
          uri: photo.uri,
          type: photo.type,
          name: photo.name,
        });
      });

      console.log('ChatGPT Design Generation Request with photos:', {
        description: description.trim(),
        room_type: selectedRoomTypes,
        style: selectedStyles,
        budget: selectedBudget,
        photos: attachedPhotos.length,
      });

      // Отправка запроса с фотографиями
      const response = await retryApiCall(() =>
        api.design.generateWithPhotos(formData),
      );

      if (response.success) {
        const designData = {
          design: response.data.design,
          images: response.data.images || [],
          raw_response: response.data.design?.raw_response,
          originalDescription: description.trim(),
          budget: selectedBudget,
          roomTypes: selectedRoomTypes,
          styles: selectedStyles,
        };

        setGeneratedDesign(designData);
        setGenerationStatus('complete');

        // Сохраняем generation_id и запускаем polling
        if (response.data.generation_id) {
          setCurrentGenerationId(response.data.generation_id);
          startImagePolling(response.data.generation_id, designData);
        }

        notifySuccess(t('Design generated successfully!'));

        // Автоматический переход на экран результатов
        navigation.navigate('DesignResult', {
          designData: designData,
          generationId: response.data.generation_id,
        });
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Design generation error:', error);

      let errorMessage = t('Failed to generate design');

      // Обработка ошибок валидации
      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
          if (validationErrors.description) {
            errorMessage = validationErrors.description[0];
          } else if (validationErrors.photos) {
            errorMessage = validationErrors.photos[0];
          } else {
            errorMessage = Object.values(validationErrors)[0][0];
          }
        }
      } else if (error.response && error.response.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrorMessage(errorMessage);
      setGenerationStatus('failed');
      notifyError(t('Error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Генерация вариаций дизайна
   */
  const generateVariations = async (count = 3) => {
    if (!generatedDesign || !generatedDesign.design?.sections) {
      notifyError(t('Error'), t('No design to create variations from'));
      return;
    }

    try {
      setIsLoading(true);

      // Создаем строку с оригинальным дизайном
      const originalDesignText = Object.values(
        generatedDesign.design.sections,
      ).join('\n\n');

      const response = await retryApiCall(() =>
        api.design.generateVariations({
          original_design: originalDesignText,
          count: count,
        }),
      );

      if (response.success) {
        // Добавляем вариации к текущему дизайну
        setGeneratedDesign(prev => ({
          ...prev,
          variations: response.data.variations,
        }));

        notifySuccess(t('Design variations generated successfully!'));
      } else {
        throw new Error(response.error || 'Variations generation failed');
      }
    } catch (error) {
      console.error('Design variations error:', error);
      notifyError(t('Error'), t('Failed to generate variations'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Переключение выбора типа комнаты
   */
  const toggleRoomType = roomTypeKey => {
    setSelectedRoomTypes(prev => {
      if (prev.includes(roomTypeKey)) {
        return prev.filter(key => key !== roomTypeKey);
      } else {
        return [...prev, roomTypeKey];
      }
    });
  };

  /**
   * Переключение выбора стиля
   */
  const toggleStyle = styleKey => {
    setSelectedStyles(prev => {
      if (prev.includes(styleKey)) {
        return prev.filter(key => key !== styleKey);
      } else {
        return [...prev, styleKey];
      }
    });
  };

  /**
   * Установка бюджета
   */
  const setBudget = budgetRange => {
    setSelectedBudget(budgetRange);
  };

  /**
   * Очистка формы
   */
  const clearForm = () => {
    setDescription('');
    setSelectedRoomTypes([]);
    setSelectedStyles([]);
    setSelectedBudget(null);
    setAttachedPhotos([]);
    setGeneratedDesign(null);
    setGenerationStatus(null);
    setErrorMessage('');
  };

  /**
   * Создание заказа на основе сгенерированного дизайна
   */
  const createOrderWithDesign = () => {
    if (!generatedDesign) {
      notifyError(t('Error'), t('No design to create order from'));
      return;
    }

    // Подготавливаем данные для создания заказа
    const orderData = {
      title: t('Interior Design Implementation'),
      description: `${description}\n\n${t('Generated design details')}:\n${
        generatedDesign.summary || ''
      }`,
      category: 'interior_design',
      design_data: generatedDesign,
    };

    // Переходим к созданию заказа
    navigation.navigate('CreateOrder', {
      prefilledData: orderData,
      designData: generatedDesign,
    });
  };

  /**
   * Повторная генерация
   */
  const regenerateDesign = () => {
    Alert.alert(
      t('Regenerate Design'),
      t(
        'Are you sure you want to generate a new design? Current results will be lost.',
      ),
      [
        {text: t('Cancel'), style: 'cancel'},
        {text: t('Generate'), onPress: generateDesign},
      ],
    );
  };

  /**
   * Запрос разрешений камеры
   */
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('Camera Permission'),
            message: t('App needs access to camera to take photos'),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  /**
   * Сделать фото с камеры
   */
  const takePhotoFromCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      notifyError(
        t('Permission Required'),
        t('Camera permission is required to take photos'),
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
    };

    launchCamera(options, response => {
      if (response.didCancel || response.errorCode) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const newPhoto = {
          id: `photo_${Date.now()}`,
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          fileSize: asset.fileSize,
        };

        setAttachedPhotos(prev => [...prev, newPhoto]);
        notifySuccess(t('Success'), t('Photo added successfully'));
      }
    });
  };

  /**
   * Выбрать фото из галереи
   */
  const pickPhotoFromGallery = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      selectionLimit: 5, // Позволяем выбрать до 5 фото
    };

    launchImageLibrary(options, response => {
      if (response.didCancel || response.errorCode) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newPhotos = response.assets.map(asset => ({
          id: `photo_${Date.now()}_${Math.random()}`,
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          fileSize: asset.fileSize,
        }));

        // Проверяем лимит фотографий (максимум 10)
        const totalPhotos = attachedPhotos.length + newPhotos.length;
        if (totalPhotos > 10) {
          notifyError(
            t('Limit Exceeded'),
            t('You can upload maximum 10 photos'),
          );
          return;
        }

        setAttachedPhotos(prev => [...prev, ...newPhotos]);
        notifySuccess(t('Success'), t('Photos added successfully'));
      }
    });
  };

  /**
   * Удалить фото
   */
  const removePhoto = photoId => {
    setAttachedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  /**
   * Очистить все фото
   */
  const clearPhotos = () => {
    setAttachedPhotos([]);
  };

  /**
   * Сохранить изображение в галерею
   */
  const saveImageToGallery = async (imageUrl, imageName = 'design_image') => {
    try {
      // Запрашиваем разрешения для Android
      if (Platform.OS === 'android') {
        let permission;
        if (Platform.Version >= 33) {
          permission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: t('Storage Permission'),
              message: t('App needs access to save images'),
              buttonNeutral: t('Ask Me Later'),
              buttonNegative: t('Cancel'),
              buttonPositive: t('OK'),
            },
          );
        } else {
          permission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: t('Storage Permission'),
              message: t('App needs access to save images'),
              buttonNeutral: t('Ask Me Later'),
              buttonNegative: t('Cancel'),
              buttonPositive: t('OK'),
            },
          );
        }

        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
          notifyError(
            t('Permission Required'),
            t('Storage permission is required to save images'),
          );
          return;
        }
      }

      // Создаем временный файл
      const timestamp = new Date().getTime();
      const tempPath = `${RNFS.TemporaryDirectoryPath}/${imageName}_${timestamp}.jpg`;

      // Скачиваем изображение
      const downloadResult = await RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: tempPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        // Сохраняем в галерею
        await CameraRoll.save(tempPath, {type: 'photo'});

        // Удаляем временный файл
        await RNFS.unlink(tempPath);

        notifySuccess(t('Success'), t('Image saved to gallery'));
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Save image error:', error);
      notifyError(t('Error'), t('Failed to save image'));
    }
  };

  /**
   * Сохранить все сгенерированные изображения
   */
  const saveAllImages = async () => {
    if (!generatedDesign?.images || generatedDesign.images.length === 0) {
      notifyError(t('Error'), t('No images to save'));
      return;
    }

    try {
      for (let i = 0; i < generatedDesign.images.length; i++) {
        const image = generatedDesign.images[i];
        await saveImageToGallery(image.url, `design_${i + 1}`);

        // Небольшая пауза между сохранениями
        if (i < generatedDesign.images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      notifySuccess(t('Success'), t('All images saved to gallery'));
    } catch (error) {
      console.error('Save all images error:', error);
      notifyError(t('Error'), t('Failed to save some images'));
    }
  };

  return {
    // Состояние формы
    description,
    setDescription,
    selectedRoomTypes,
    selectedStyles,
    selectedBudget,
    attachedPhotos,

    // Опции
    roomTypeOptions,
    styleOptions,
    budgetOptions,

    // Состояние генерации
    generationStatus,
    generatedDesign,
    errorMessage,
    isLoading,

    // Методы
    generateDesign,
    generateVariations,
    toggleRoomType,
    toggleStyle,
    setBudget,
    clearForm,
    createOrderWithDesign,
    regenerateDesign,

    // Методы для работы с фотографиями
    takePhotoFromCamera,
    pickPhotoFromGallery,
    removePhoto,
    clearPhotos,

    // Методы для сохранения изображений
    saveImageToGallery,
    saveAllImages,

    // Утилиты
    userId,
  };
};
