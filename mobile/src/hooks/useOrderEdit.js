import {useState, useEffect} from 'react';
import {Alert, Platform, PermissionsAndroid} from 'react-native';
import {notifyError, notifySuccess, showConfirm} from '../services/notify';
import {useTranslation} from 'react-i18next';
import DocumentPicker from 'react-native-document-picker';
import {api, retryApiCall} from '../services/index';
import styles from '../styles';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

const useOrderEdit = (navigation, orderId) => {
  const {t} = useTranslation();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('category'); // 'category' или 'subcategory'
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const orderStatuses = {
    1: t('Searching for performer'),
    2: t('Waiting for response'),
    3: t('In progress'),
    4: t('Awaiting acceptance'),
  };

  // Загрузка категорий и подкатегорий с сервера
  const fetchCategories = async () => {
    try {
      const response = await retryApiCall(() => api.user.getAppSettings());

      if (response.success && response.result) {
        const result = response.result;
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
    }
  };

  // Получить подкатегории для текущей выбранной категории
  const getSubcategoriesForSelectedCategory = () => {
    if (!orderData?.work_direction) return [];
    return subcategories[orderData.work_direction] || [];
  };

  const getStatusColor = status => {
    switch (status) {
      case 1:
      case 2:
        return '#333333';
      case 3:
        return styles.colors.green;
      case 4:
        return styles.colors.yellow;
      default:
        return styles.colors.gray;
    }
  };

  const fetchOrderData = async id => {
    try {
      const response = await retryApiCall(() => api.orders.ordersDetail(id));

      if (!response.success || !response.result) {
        throw new Error(
          response.message || 'Не удалось получить данные заказа',
        );
      }

      return response.result;
    } catch (error) {
      console.error('Ошибка при загрузке заказа:', error);
      notifyError(
        t('Error'),
        t('Failed to load order data. Please try again later.'),
      );
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Загружаем категории и подкатегории
        await fetchCategories();

        // Загружаем данные заказа
        if (orderId) {
          const data = await fetchOrderData(orderId);
          if (data) {
            // Инициализируем attachment_ids из существующих файлов
            data.attachment_ids = (data.files || []).map(file => file.id);

            setOrderData(data);
            setAttachments(data.files || []);
          } else {
            navigation.goBack();
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        notifyError(
          t('Error'),
          t('Failed to load data. Please try again later.'),
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, navigation]);

  const handleInputChange = (target, value) => {
    setOrderData(prev => ({...prev, [target]: value}));
  };

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

      if (
        response.success &&
        response.result &&
        response.result.file_id &&
        response.result.file_id.id
      ) {
        return response.result.file_id.id;
      } else {
        throw new Error(response.message || 'Не удалось загрузить файл');
      }
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      notifyError(t('Error'), t('Failed to upload file. Please try again.'));
      throw error;
    }
  };

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
      const fileId = await uploadFile(file);

      setAttachments(prev => [...prev, {id: fileId, ...file}]);
      handleInputChange('attachment_ids', [
        ...(orderData.attachment_ids || []),
        fileId,
      ]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Ошибка выбора файла:', err);
        notifyError(t('Error'), t('Failed to select or upload file'));
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFile = file => {
    // Получаем ID файла (может быть передан как ID или объект файла)
    const fileId = typeof file === 'object' ? file.id : file;

    setAttachments(prev => prev.filter(attachment => attachment.id !== fileId));
    handleInputChange(
      'attachment_ids',
      (orderData.attachment_ids || []).filter(id => id !== fileId),
    );
  };

  // Безопасное преобразование даты из формата ДД.ММ.ГГГГ в ISO формат
  const parseDate = dateString => {
    if (!dateString) return '';

    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

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

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setErrors([]);

      const requiredFields = [
        'title',
        'description',
        'work_direction',
        'work_type',
      ];
      const newErrors = [];

      requiredFields.forEach(field => {
        if (!orderData[field]) {
          newErrors.push({path: field, message: t('This field is required')});
        }
      });

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return;
      }

      // ✅ Создаем FormData для отправки на сервер
      const formData = new FormData();
      formData.append('id', orderData.id);
      formData.append('title', orderData.title);
      formData.append('description', orderData.description);
      formData.append('work_direction', orderData.work_direction);
      formData.append('work_type', orderData.work_type);
      formData.append('city', orderData.city || '');
      formData.append('address', orderData.address || '');
      formData.append('max_amount', orderData.max_amount || '');

      // Добавляем ID вложений
      if (orderData.attachment_ids && orderData.attachment_ids.length > 0) {
        orderData.attachment_ids.forEach((attachmentId, index) => {
          formData.append(`attachments[${index}]`, attachmentId);
        });
      }

      const response = await retryApiCall(() =>
        api.orders.ordersEdit(orderData.id, formData),
      );

      if (response.success) {
        notifySuccess(t('Success'), t('Order has been updated successfully'));
        // Автоматически переходим на экран просмотра заказа
        navigation.navigate('Order', {orderId: orderData.id});
      } else {
        throw new Error(response.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);

      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        notifyError(
          t('Error'),
          t('Failed to update order. Please try again later.'),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const openModal = type => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const selectItem = item => {
    if (modalType === 'category') {
      handleInputChange('work_direction', item.id);
      // Сбрасываем подкатегорию при смене категории
      handleInputChange('work_type', null);
    } else {
      handleInputChange('work_type', item.id);
    }
    closeModal();
  };

  // Получить название категории по ID
  const getCategoryName = categoryId => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  // Получить название подкатегории по ID
  const getSubcategoryName = subcategoryId => {
    if (!orderData?.work_direction) return '';
    const subcategoryList = subcategories[orderData.work_direction] || [];
    const subcategory = subcategoryList.find(sub => sub.id === subcategoryId);
    return subcategory ? subcategory.name : '';
  };

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
      notifyError(t('Cannot Open File'), t('Failed to open file'));
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      if (Platform.OS === 'ios') {
        showConfirm({
          title: t('Save Image'),
          message: t('Where would you like to save the image?'),
          cancelText: t('Files App'),
          confirmText: t('Photo Library'),
          onConfirm: () => saveToPhotoLibrary(fileUrl, fileName),
          onCancel: () => saveToDocuments(fileUrl, fileName),
        });
      } else {
        await saveToDocuments(fileUrl, fileName);
      }
    } catch (error) {
      notifyError(
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
    orderData,
    loading,
    submitting,
    attachments,
    errors,
    modalVisible,
    modalType,
    categories,
    subcategories: getSubcategoriesForSelectedCategory(),
    orderStatuses,
    getStatusColor,
    getCategoryName,
    getSubcategoryName,
    handleInputChange,
    pickFile,
    removeFile,
    handleSave,
    handleCancel,
    openModal,
    closeModal,
    selectItem,
    viewFile,
    downloadFile,
  };
};

export default useOrderEdit;
