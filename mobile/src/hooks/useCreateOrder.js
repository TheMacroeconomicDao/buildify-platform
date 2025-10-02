import {useState, useEffect} from 'react';
import {Alert, Platform, PermissionsAndroid} from 'react-native';
import {notifyError, notifySuccess, showConfirm} from '../services/notify';
import DocumentPicker from 'react-native-document-picker';
import {api, retryApiCall} from '../services/index';
import {useTranslation} from 'react-i18next';
import {handleErrorResponse} from '../services/utils';
import config from '../config';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {launchImageLibrary} from 'react-native-image-picker';

export const useCreateOrder = (navigation, route) => {
  const {t} = useTranslation();

  // Получаем начальные данные из route параметров
  const initialData = route?.params || {};
  const {initialDescription, initialAttachments, designData} = initialData;
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // Начинаем сразу с выбора категории (стандартный флоу)
  const [formData, setFormData] = useState({
    category: null,
    subcategory: null,
    name: '',
    city: '',
    address: '',
    description: initialDescription || '',
    maximum_price: '',
    attachment_ids: [],
    housing_type: 'apartment',
    housing_condition: 'new',
    housing_preparation_level: 'without_walls',
    bathroom_type: 'separate',
    ceiling_height: '',
    total_area: '',
    latitude: 25.2048, // Dubai coordinates as default
    longitude: 55.2708,
    full_address: '',
    date_type: 'single', // 'single' или 'period'
    work_date: '',
    work_time: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
  });
  const [errors, setErrors] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const [isGalleryModalVisible, setIsGalleryModalVisible] = useState(false);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
  const [galleryFiles, setGalleryFiles] = useState([]); // Файлы из галереи устройства

  // Инициализация attachments из designData
  useEffect(() => {
    const initializeDesignAttachments = async () => {
      if (initialAttachments && initialAttachments.length > 0) {
        try {
          setLoading(true);
          console.log('Uploading design images to server...');

          // Преобразуем изображения дизайна в формат attachments
          const designAttachments = initialAttachments.map((image, index) => ({
            id: `design_${index}`,
            name: `design_image_${index + 1}.jpg`,
            uri: image.url,
            type: 'image/jpeg',
            size: null,
            isDesignImage: true, // Маркер что это изображение из дизайна
          }));

          setAttachments(designAttachments);

          // Загружаем изображения на сервер и получаем их ID
          const uploadedIds = [];
          for (let i = 0; i < designAttachments.length; i++) {
            try {
              const attachment = designAttachments[i];

              // Если это URL изображения, сначала скачиваем его
              let localFile = attachment;
              if (attachment.uri.startsWith('http')) {
                const timestamp = new Date().getTime();
                const fileName = `design_temp_${timestamp}_${i}.jpg`;
                const localPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;

                const downloadResult = await RNFS.downloadFile({
                  fromUrl: attachment.uri,
                  toFile: localPath,
                }).promise;

                if (downloadResult.statusCode === 200) {
                  localFile = {
                    ...attachment,
                    uri: `file://${localPath}`,
                  };
                } else {
                  throw new Error('Failed to download image');
                }
              }

              const fileId = await uploadFile(localFile);
              if (fileId) {
                uploadedIds.push(fileId);
              }

              // Удаляем временный файл если он был создан
              if (
                localFile.uri !== attachment.uri &&
                localFile.uri.startsWith('file://')
              ) {
                try {
                  await RNFS.unlink(localFile.uri.replace('file://', ''));
                } catch (unlinkError) {
                  console.log('Could not delete temp file:', unlinkError);
                }
              }
            } catch (error) {
              console.error(`Failed to upload design image ${i + 1}:`, error);
            }
          }

          // Обновляем formData с ID загруженных файлов
          setFormData(prev => ({
            ...prev,
            attachment_ids: uploadedIds,
          }));

          console.log(
            `Successfully uploaded ${uploadedIds.length} design images to server`,
          );
          console.log('Uploaded image IDs:', uploadedIds);
        } catch (error) {
          console.error('Error initializing design attachments:', error);
          notifyError(t('Error'), t('Failed to upload design images'));
        } finally {
          setLoading(false);
        }
      }
    };

    initializeDesignAttachments();
  }, [initialAttachments]);

  // Загрузка категорий при монтировании компонента
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await retryApiCall(() => api.user.getAppSettings());

        if (response.success && response.result) {
          const result = response.result;
          console.log(
            'App settings response:',
            JSON.stringify(result, null, 2),
          );

          if (result.direction_work) {
            const mappedCategories = result.direction_work.map(dir => ({
              id: dir.key,
              name: dir.name,
            }));
            setCategories(mappedCategories);
          }

          if (result.types_work) {
            const subcategoriesByCategory = {};

            Object.keys(result.types_work).forEach(categoryKey => {
              const categoryTypes = result.types_work[categoryKey];
              if (Array.isArray(categoryTypes)) {
                subcategoriesByCategory[categoryKey] = categoryTypes.map(
                  type => ({
                    id: type.key,
                    name: type.name,
                    categoryId: categoryKey,
                  }),
                );
              } else {
                console.warn(
                  `types_work[${categoryKey}] is not an array:`,
                  categoryTypes,
                );
                subcategoriesByCategory[categoryKey] = [];
              }
            });
            setSubcategories(subcategoriesByCategory);
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
        notifyError(
          t('Error'),
          t('Failed to load categories. Please try again later.'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [t]);

  // Получить подкатегории для текущей выбранной категории
  const getSubcategoriesForSelectedCategory = () => {
    if (!formData.category || !formData.category.id) return [];
    return subcategories[formData.category.id] || [];
  };

  // Функция для загрузки изображений из галереи устройства
  const loadGalleryImages = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      selectionLimit: 10, // Позволяем выбрать до 10 фото
    };

    launchImageLibrary(options, response => {
      if (response.didCancel || response.errorCode) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const deviceGalleryFiles = response.assets.map(asset => ({
          id: `gallery_${Date.now()}_${Math.random()}`,
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          fileSize: asset.fileSize,
        }));

        setGalleryFiles(deviceGalleryFiles);
        setIsGalleryModalVisible(true);
      }
    });
  };

  // Функция для загрузки документов из устройства
  const loadDocumentsFromDevice = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
          DocumentPicker.types.xls,
          DocumentPicker.types.xlsx,
          DocumentPicker.types.ppt,
          DocumentPicker.types.pptx,
          DocumentPicker.types.plainText,
          DocumentPicker.types.zip,
        ],
        allowMultiSelection: true,
        copyTo: 'documentDirectory',
      });

      if (result && result.length > 0) {
        const deviceDocuments = result.map(doc => ({
          id: `doc_${Date.now()}_${Math.random()}`,
          uri: doc.uri,
          name: doc.name,
          type: doc.type,
          fileSize: doc.size,
        }));

        // Добавляем документы к существующим файлам галереи
        setGalleryFiles(prev => [...prev, ...deviceDocuments]);
        setIsGalleryModalVisible(true);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        return; // Пользователь отменил выбор
      }
      console.error('Error picking documents:', err);
      notifyError(t('Error'), t('Failed to select documents'));
    }
  };

  // Универсальная функция для выбора файлов из галереи и документов
  const loadGalleryAndDocuments = () => {
    Alert.alert(t('Select Files'), t('Choose what you want to add'), [
      {
        text: t('Images from Gallery'),
        onPress: loadGalleryImages,
      },
      {
        text: t('Documents'),
        onPress: loadDocumentsFromDevice,
      },
      {
        text: t('Cancel'),
        style: 'cancel',
      },
    ]);
  };

  // Функции для управления галереей
  const closeGalleryModal = () => {
    setIsGalleryModalVisible(false);
    setSelectedGalleryFiles([]);
    setGalleryFiles([]); // Очищаем загруженные из галереи файлы
  };

  const toggleGalleryFile = file => {
    setSelectedGalleryFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  // Проверка является ли файл изображением
  const isImageFile = file => {
    if (file.type && file.type.startsWith('image/')) return true;
    if (file.uri) {
      return file.uri.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
    }
    if (file.name) {
      return file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
    }
    return false;
  };

  // Проверка является ли файл документом
  const isDocumentFile = file => {
    if (file.type) {
      return (
        file.type.includes('pdf') ||
        file.type.includes('document') ||
        file.type.includes('word') ||
        file.type.includes('excel') ||
        file.type.includes('sheet')
      );
    }
    if (file.uri) {
      return file.uri.match(/\.(pdf|doc|docx|xlsx|xls)$/i);
    }
    if (file.name) {
      return file.name.match(/\.(pdf|doc|docx|xlsx|xls)$/i);
    }
    return false;
  };

  // Проверка что среди выбранных файлов есть и изображения, и документы
  const hasRequiredFileTypes = files => {
    const hasImage = files.some(file => isImageFile(file));
    const hasDocument = files.some(file => isDocumentFile(file));
    return hasImage && hasDocument;
  };

  const selectGalleryFiles = async () => {
    // Проверяем что выбран хотя бы один файл
    if (selectedGalleryFiles.length === 0) {
      Alert.alert(
        t('No Files Selected'),
        t('Please select at least one file to continue.'),
        [{text: t('OK')}],
      );
      return;
    }

    try {
      setLoading(true);

      // Загружаем каждый выбранный файл на сервер
      const uploadedFiles = [];
      const uploadedIds = [];

      for (const file of selectedGalleryFiles) {
        try {
          const fileId = await uploadFile(file);
          if (fileId) {
            uploadedIds.push(fileId);
            uploadedFiles.push({
              ...file,
              id: fileId,
            });
          }
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error);
          notifyError(t('Error'), t(`Failed to upload ${file.name}`));
        }
      }

      if (uploadedIds.length > 0) {
        // Добавляем загруженные файлы в attachment_ids для формы
        setFormData(prev => ({
          ...prev,
          attachment_ids: [...prev.attachment_ids, ...uploadedIds],
        }));

        // Добавляем файлы в attachments для отображения
        setAttachments(prev => [...prev, ...uploadedFiles]);

        notifySuccess(
          t('Success'),
          t(`${uploadedIds.length} files uploaded successfully`),
        );
      }

      setIsGalleryModalVisible(false);
      setSelectedGalleryFiles([]);
      setGalleryFiles([]);

      // Переходим к следующему шагу
      setStep(1);
    } catch (error) {
      console.error('Error uploading gallery files:', error);
      notifyError(t('Error'), t('Failed to upload files. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (target, value) => {
    // Если меняется категория, то сбрасываем подкатегорию
    if (target === 'category' && formData.subcategory) {
      setFormData({...formData, [target]: value, subcategory: null});
    } else {
      setFormData({...formData, [target]: value});
    }
  };

  const stepBack = () => {
    switch (step) {
      case 1:
        navigation.goBack();
        return;
      case 2:
        setStep(1);
        handleInputChange('category', null);
        return;
      case 3:
        setStep(2);
        handleInputChange('subcategory', null);
        return;
      case 4:
        setStep(3);
        return;
      case 5:
        setStep(4);
        return;
      case 6:
        setStep(5);
        return;
      case 7:
        setStep(6);
        return;
      default:
        return;
    }
  };

  const titleByStep = step => {
    switch (step) {
      case 1:
        return t('New order');
      case 2:
        return t('New order');
      case 3:
        return t('New order');
      case 4:
        return t('Address');
      case 5:
        return t('Date');
      case 6:
        return t('Order placement');
      case 7:
        return t('New order');
      default:
        return '';
    }
  };

  // ✅ ЭТАП 1: Загрузка файла на сервер
  // API: POST /api/files/store с multipart/form-data
  // Возвращает: { "success": true, "result": { "file_id": 123 } }
  const uploadFile = async file => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });

      const response = await retryApiCall(() =>
        api.files.storeCreate(formData),
      );

      if (response.success && response.result && response.result.file_id) {
        // API возвращает { "result": { "file_id": 123 } }
        return response.result.file_id;
      } else {
        throw new Error(response.message || 'Не удалось загрузить файл');
      }
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      notifyError(t('Error'), t('Failed to upload file. Please try again.'));
      throw error;
    }
  };

  // Обработка выбора файлов
  const pickFile = async () => {
    try {
      setLoading(true);
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const file = {
        uri: res[0].uri,
        name: res[0].name,
        type: res[0].type,
      };
      // Реальная загрузка на сервер
      const fileId = await uploadFile(file);

      // Добавляем файл в attachments
      setAttachments(prev => [...prev, {id: fileId, ...file}]);

      // Добавляем ID в formData.attachment_ids
      setFormData(prev => ({
        ...prev,
        attachment_ids: [...prev.attachment_ids, fileId],
      }));
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // Пользователь отменил выбор
      } else {
        console.error('Ошибка выбора файла:', err);
        notifyError(t('Error'), t('Failed to select or upload file'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Удаление файла
  const removeFile = fileId => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
    setFormData(prev => ({
      ...prev,
      attachment_ids: prev.attachment_ids.filter(id => id !== fileId),
    }));
  };

  // Сброс формы к начальному состоянию
  const resetForm = () => {
    setFormData({
      category: null,
      subcategory: null,
      name: '',
      city: '',
      address: '',
      description: '',
      maximum_price: '',
      attachment_ids: [],
      housing_type: 'apartment',
      housing_condition: 'new',
      housing_preparation_level: 'without_walls',
      bathroom_type: 'separate',
      ceiling_height: '',
      total_area: '',
      latitude: 25.2048, // Dubai coordinates as default
      longitude: 55.2708,
      full_address: '',
      date_type: 'single',
      work_date: '',
      work_time: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
    });
    setAttachments([]);
    setErrors([]);
    setStep(1);
  };

  // Безопасное преобразование даты из формата ДД.ММ.ГГГГ в ISO формат
  const parseDate = dateString => {
    if (!dateString) return '';

    try {
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
        return '';
      }

      const [day, month, year] = dateString.split('.').map(Number);

      if (
        day < 1 ||
        day > 31 ||
        month < 1 ||
        month > 12 ||
        year < 2000 ||
        year > 2111
      ) {
        return '';
      }

      const date = new Date(year, month - 1, day);

      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Ошибка при парсинге даты:', error, dateString);
      return '';
    }
  };

  // ✅ ЭТАП 2: Создание заказа с файлами
  // API: POST /api/orders с application/json
  // В поле attachments передается массив file_id из этапа 1
  const handleCreateOrder = async () => {
    try {
      setSubmitting(true);
      setErrors([]);

      // Проверяем обязательные поля согласно API документации
      const requiredFields = [
        'name',
        'category',
        'subcategory',
        'city',
        'address',
        'date_type',
        'maximum_price',
      ];
      const newErrors = [];

      requiredFields.forEach(field => {
        if (
          !formData[field] ||
          (field === 'category' && !formData.category?.id) ||
          (field === 'subcategory' && !formData.subcategory?.id)
        ) {
          newErrors.push({path: field, message: t('This field is required')});
        }
      });

      // Проверяем дату в зависимости от типа
      if (formData.date_type === 'single') {
        if (!formData.work_date) {
          newErrors.push({
            path: 'work_date',
            message: t('This field is required'),
          });
        }
        if (!formData.work_time) {
          newErrors.push({
            path: 'work_time',
            message: t('This field is required'),
          });
        }
      } else if (formData.date_type === 'period') {
        if (!formData.start_date) {
          newErrors.push({
            path: 'start_date',
            message: t('This field is required'),
          });
        }
        if (!formData.start_time) {
          newErrors.push({
            path: 'start_time',
            message: t('This field is required'),
          });
        }
        if (!formData.end_date) {
          newErrors.push({
            path: 'end_date',
            message: t('This field is required'),
          });
        }
        if (!formData.end_time) {
          newErrors.push({
            path: 'end_time',
            message: t('This field is required'),
          });
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return;
      }

      // Отладка: проверяем значения категорий
      console.log('🔍 formData.category:', formData.category);
      console.log('🔍 formData.subcategory:', formData.subcategory);
      console.log(
        '🔍 category.id:',
        formData.category?.id,
        'type:',
        typeof formData.category?.id,
      );
      console.log(
        '🔍 subcategory.id:',
        formData.subcategory?.id,
        'type:',
        typeof formData.subcategory?.id,
      );

      const orderData = {
        // === ОСНОВНАЯ ИНФОРМАЦИЯ ===
        title: formData.name,
        work_direction: formData.category?.id || null,
        work_type: formData.subcategory?.id || null,
        description: formData.description || '',

        // === АДРЕС И ЛОКАЦИЯ ===
        city: formData.city || '',
        address: formData.address || '',
        full_address: formData.full_address || '',

        // === ДАТА И ВРЕМЯ ===
        date_type: formData.date_type,

        // === БЮДЖЕТ ===
        max_amount: parseFloat(formData.maximum_price) || 0,
      };

      // Добавляем координаты если есть
      if (formData.latitude) {
        orderData.latitude = formData.latitude;
      }
      if (formData.longitude) {
        orderData.longitude = formData.longitude;
      }

      // === ДЕТАЛИ ЖИЛЬЯ (только если заполнены) ===
      if (formData.housing_type) {
        orderData.housing_type = formData.housing_type;
      }
      if (formData.housing_condition) {
        orderData.housing_condition = formData.housing_condition;
      }
      if (formData.housing_preparation_level) {
        orderData.housing_preparation_level =
          formData.housing_preparation_level;
      }
      if (formData.bathroom_type) {
        orderData.bathroom_type = formData.bathroom_type;
      }
      if (formData.ceiling_height) {
        orderData.ceiling_height = formData.ceiling_height;
      }
      if (formData.total_area) {
        orderData.total_area = formData.total_area;
      }

      // === ДАТЫ В ЗАВИСИМОСТИ ОТ ТИПА ===
      if (formData.date_type === 'single') {
        orderData.work_date = formData.work_date;
        orderData.work_time = formData.work_time;
      } else if (formData.date_type === 'period') {
        orderData.start_date = formData.start_date;
        orderData.start_time = formData.start_time;
        orderData.end_date = formData.end_date;
        orderData.end_time = formData.end_time;
      }

      // === ВЛОЖЕНИЯ ===
      // Отправляем массив ID файлов, которые уже загружены на сервер
      if (formData.attachment_ids && formData.attachment_ids.length > 0) {
        orderData.attachments = formData.attachment_ids
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
      }

      const response = await retryApiCall(() =>
        api.orders.ordersCreate(orderData),
      );

      if (response.success) {
        // Сбрасываем форму после успешного создания
        resetForm();

        notifySuccess(t('Success'), t('Order created successfully'));

        // Автоматически перенаправляем на главный экран
        navigation.navigate('Main');
      } else {
        // Обрабатываем ошибки валидации через handleErrorResponse
        handleErrorResponse(response, setErrors, {
          // Для ошибок валидации не показываем глобальные уведомления
          showNotification: false,
        });
        return;
      }
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      // Обрабатываем сетевые и другие ошибки через handleErrorResponse
      handleErrorResponse(error, setErrors, {
        // Для сетевых ошибок показываем уведомления
        showNotification: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Функции просмотра и скачивания - копируем из useDesignGeneration
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
        notifySuccess(t('Success'), t('Image saved to Photo Library'));
      }
    } catch (error) {
      console.error('Save to photo library error:', error);
      notifyError(
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
          notifyError(
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
        notifySuccess(
          t('Download Complete'),
          Platform.OS === 'ios'
            ? t('File saved to Files app (Documents)')
            : t('File saved to Downloads folder'),
        );
      }
    } catch (error) {
      notifyError(t('Save Failed'), error.message || t('Failed to save file'));
    }
  };

  return {
    categories,
    subcategories: getSubcategoriesForSelectedCategory(),
    loading,
    submitting,
    step,
    setStep,
    formData,
    errors,
    attachments,

    isGalleryModalVisible,
    selectedGalleryFiles,
    galleryFiles, // Добавляем файлы из галереи устройства
    closeGalleryModal,
    toggleGalleryFile,
    selectGalleryFiles,
    handleInputChange,
    stepBack,
    titleByStep,
    pickFile,
    removeFile,
    resetForm,
    handleCreateOrder,
    viewFile,
    downloadFile,
    isImageFile,
    isDocumentFile,
    hasRequiredFileTypes,
    loadGalleryImages,
    loadDocumentsFromDevice,
    loadGalleryAndDocuments,
  };
};

export default useCreateOrder;
