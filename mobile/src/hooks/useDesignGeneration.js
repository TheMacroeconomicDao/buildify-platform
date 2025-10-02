import {useState, useEffect, useRef} from 'react';
import {Alert, Platform, PermissionsAndroid} from 'react-native';
import {notifyError, notifySuccess, showConfirm} from '../services/notify';
import DocumentPicker from 'react-native-document-picker';
import axios from 'axios';
import config from '../config';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import FileViewer from 'react-native-file-viewer';

export const useDesignGeneration = navigation => {
  const {t} = useTranslation();
  const auth = useSelector(state => state.auth);
  const userId = auth.userData?.id || 'guest';

  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  // null - не запрошено, pending - запрошено (в процессе), complete - готово, failed - ошибка
  const [generationStatus, setGenerationStatus] = useState(null);
  const [generatedDesign, setGeneratedDesign] = useState(null); // Результат от нейросети
  const [errorMessage, setErrorMessage] = useState('');
  const [currentJobId, setCurrentJobId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pollingInterval = useRef(null);

  // Очистка интервала опроса при размонтировании компонента
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Загрузка существующих задач пользователя при входе на экран
  useEffect(() => {
    fetchUserJobs();
  }, []);

  // Функция для получения задач пользователя
  const fetchUserJobs = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${config.aiServiceUrl}/user/${userId}`);

      // Обработка полученных данных
      const {pendingJobs, completedJobs, failedJobs} = response.data;

      // Проверка на наличие задач
      if (pendingJobs.length > 0) {
        // Берем последнюю активную задачу
        const latestPendingJob = pendingJobs[0];

        // Заполняем форму данными из задачи
        setDescription(latestPendingJob.description || '');

        // Преобразуем изображения в формат для компонента
        if (
          latestPendingJob.originalImages &&
          latestPendingJob.originalImages.length > 0
        ) {
          const images = latestPendingJob.originalImages.map((url, index) => ({
            id: `original_${index}`,
            name: `image_${index}.jpg`,
            uri: url,
            type: 'image/jpeg',
          }));
          setAttachments(images);
        }

        // Устанавливаем jobId и начинаем опрос
        setCurrentJobId(latestPendingJob.jobId);
        setGenerationStatus('pending');
        startPolling(latestPendingJob.jobId);
      } else if (completedJobs.length > 0) {
        // Берем последнюю завершенную задачу
        const latestCompletedJob = completedJobs[0];

        // Заполняем форму данными из задачи
        setDescription(latestCompletedJob.description || '');

        // Преобразуем исходные изображения в формат для компонента
        if (
          latestCompletedJob.originalImages &&
          latestCompletedJob.originalImages.length > 0
        ) {
          const images = latestCompletedJob.originalImages.map(
            (url, index) => ({
              id: `original_${index}`,
              name: `image_${index}.jpg`,
              uri: url,
              type: 'image/jpeg',
            }),
          );
          setAttachments(images);
        }

        // Формируем объект с результатами
        const designResult = {
          text: latestCompletedJob.description,
          originalDescription: description,
          images: Array.isArray(latestCompletedJob.resultImageUrl)
            ? latestCompletedJob.resultImageUrl.map((url, index) => {
                // Определяем тип файла на основе URL или устанавливаем jpeg по умолчанию
                const fileType = getFileTypeFromUrl(url);
                return {
                  id: `result_${index}`,
                  name: `generated_design_${index}.${fileType.ext}`,
                  uri: url,
                  type: fileType.mimeType,
                };
              })
            : [
                {
                  // Определяем тип файла на основе URL или устанавливаем jpeg по умолчанию
                  ...(() => {
                    const fileType = getFileTypeFromUrl(
                      latestCompletedJob.resultImageUrl,
                    );
                    return {
                      id: 'result_0',
                      name: `generated_design.${fileType.ext}`,
                      uri: latestCompletedJob.resultImageUrl,
                      type: fileType.mimeType,
                    };
                  })(),
                },
              ],
        };

        setGeneratedDesign(designResult);
        setCurrentJobId(latestCompletedJob.jobId);
        setGenerationStatus('complete');

        // Автоматический переход на экран результатов
        navigation.navigate('DesignResult', {
          designData: designResult,
        });
      } else if (failedJobs.length > 0) {
        // Берем последнюю неудачную задачу
        const latestFailedJob = failedJobs[0];

        // Заполняем форму данными из задачи
        setDescription(latestFailedJob.description || '');

        // Преобразуем изображения в формат для компонента
        if (
          latestFailedJob.originalImages &&
          latestFailedJob.originalImages.length > 0
        ) {
          const images = latestFailedJob.originalImages.map((url, index) => ({
            id: `original_${index}`,
            name: `image_${index}.jpg`,
            uri: url,
            type: 'image/jpeg',
          }));
          setAttachments(images);
        }

        setCurrentJobId(latestFailedJob.jobId);
        setGenerationStatus('failed');
        setErrorMessage(
          latestFailedJob.errorMessage || t('Failed to generate design'),
        );
      }
    } catch (error) {
      console.error('Ошибка при получении задач пользователя:', error);
      // Если ошибка при запросе, просто показываем пустой экран для создания новой задачи
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для периодического опроса статуса задачи
  const startPolling = jobId => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    setIsPolling(true);
    pollingInterval.current = setInterval(() => {
      checkJobStatus(jobId);
    }, 5000); // Опрос каждые 5 секунд

    // Максимум 15 минут polling
    setTimeout(() => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        setIsPolling(false);
        setGenerationStatus('failed');
        setErrorMessage('Timeout: генерация заняла слишком много времени');
        console.log('Polling timeout reached for job:', jobId);
      }
    }, 900000); // 15 минут
  };

  // Функция для проверки статуса задачи
  const checkJobStatus = async jobId => {
    try {
      const response = await axios.get(
        `${config.aiServiceUrl}/result/${jobId}`,
      );
      const jobData = response.data;

      // Обновляем статус в зависимости от ответа сервера
      if (jobData.status === 'complete') {
        setGenerationStatus('complete');
        setIsPolling(false);
        clearInterval(pollingInterval.current);

        // Преобразуем результат с сервера в формат, ожидаемый приложением
        const designResult = {
          text: jobData.description,
          originalDescription: description,
          images: Array.isArray(jobData.resultImageUrl)
            ? jobData.resultImageUrl.map((url, index) => {
                const fileType = getFileTypeFromUrl(url);
                return {
                  id: `result_${index}`,
                  name: `generated_design_${index}.${fileType.ext}`,
                  uri: url,
                  type: fileType.mimeType,
                };
              })
            : [
                {
                  ...(() => {
                    const fileType = getFileTypeFromUrl(jobData.resultImageUrl);
                    return {
                      id: 'result_0',
                      name: `generated_design.${fileType.ext}`,
                      uri: jobData.resultImageUrl,
                      type: fileType.mimeType,
                    };
                  })(),
                },
              ],
        };

        setGeneratedDesign(designResult);

        // Автоматический переход на экран результатов
        navigation.navigate('DesignResult', {
          designData: designResult,
        });
      } else if (jobData.status === 'failed') {
        setGenerationStatus('failed');
        setErrorMessage(
          jobData.errorMessage || 'Произошла ошибка при генерации дизайна',
        );
        setIsPolling(false);
        clearInterval(pollingInterval.current);
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса задачи:', error);
      if (error.response?.status === 404) {
        // Задача не найдена
        setErrorMessage('Задача не найдена');
        setGenerationStatus('failed');
        setIsPolling(false);
        clearInterval(pollingInterval.current);
      }
    }
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images], // Ограничиваем выбор только изображениями
        allowMultiSelection: true,
      });

      // Проверяем, не превышает ли количество файлов ограничение
      const newFiles = res.map(file => ({
        uri: file.uri,
        name: file.name,
        type: file.type,
        id: `${Math.random().toString(36).substr(2, 9)}`,
      }));

      if (attachments.length + newFiles.length > 10) {
        notifyError(t('Limit Exceeded'), t('You can upload maximum 10 images'));
        return;
      }

      setAttachments(prev => [...prev, ...newFiles]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Ошибка выбора файла:', err);
        notifyError(t('Error'), t('Failed to select file'));
      }
    }
  };

  const removeFile = fileId => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
  };

  const generateDesign = async () => {
    try {
      // Сбрасываем предыдущие результаты и ошибки
      setErrorMessage('');
      setGenerationStatus('pending');
      setGeneratedDesign(null);

      // Проверяем, что есть хотя бы одно изображение или описание
      if (attachments.length === 0 && !description.trim()) {
        setErrorMessage(t('Please provide at least one image or description'));
        setGenerationStatus('failed');
        return;
      }

      // Создаем FormData для отправки файлов
      const formData = new FormData();

      // Добавляем изображения в formData
      attachments.forEach(file => {
        formData.append('images', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
      });

      // Добавляем описание и ID пользователя
      formData.append('description', description);
      formData.append('userId', userId);

      // Отправляем запрос на сервер
      console.log('Перед отправкой запроса:');
      console.log('Attachments:', JSON.stringify(attachments, null, 2));
      console.log('Description:', description);
      console.log('UserId:', userId);
      if (formData && typeof formData.getParts === 'function') {
        console.log('FormData parts:', formData.getParts());
      } else {
        console.log('Не удалось вывести части FormData');
      }
      const response = await axios.post(
        `${config.aiServiceUrl}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 минуты таймаут для генерации дизайна
        },
      );
      console.log('Response from server:', JSON.stringify(response));
      // Если получили ID задачи, начинаем опрашивать статус
      if (response?.data?.jobId) {
        setCurrentJobId(response.data.jobId);
        startPolling(response.data.jobId);
      } else {
        throw new Error('No job ID received');
      }
    } catch (error) {
      console.error(
        'Ошибка при отправке запроса на генерацию (полная):',
        error.toJSON ? error.toJSON() : error,
      );
      setGenerationStatus('failed');

      // Обработка различных типов ошибок
      if (error.response) {
        // Серверный ответ с ошибкой
        if (error.response.status === 429) {
          setErrorMessage(
            t('Too many requests. Please wait before trying again.'),
          );
        } else {
          setErrorMessage(
            error.response.data?.errorMessage || t('Server error occurred'),
          );
        }
      } else if (error.request) {
        // Запрос был отправлен, но ответ не получен
        setErrorMessage(
          t('No response from server. Check your internet connection.'),
        );
      } else {
        // Ошибка настройки запроса
        setErrorMessage(t('Failed to send request.'));
      }
    }
  };

  const createOrderWithDesign = () => {
    navigation.navigate('CreateOrder', {
      initialDescription: generatedDesign.text,
      initialAttachments: generatedDesign.images,
    });
  };

  const regenerateDesign = async () => {
    try {
      // Проверяем наличие JobId
      if (!currentJobId) {
        setErrorMessage(t('Cannot regenerate without a previous job'));
        return;
      }

      setErrorMessage('');
      setGenerationStatus('pending');

      // Создаем FormData для отправки файлов и описания
      const formData = new FormData();

      // Фильтруем attachments, добавляя только серверные URL
      // Локальные файлы на iOS становятся недоступными после первой генерации
      const serverAttachments = attachments.filter(
        file =>
          file.uri.startsWith('http://') || file.uri.startsWith('https://'),
      );

      // Добавляем только серверные изображения (локальные файлы пропускаем для регенерации)
      serverAttachments.forEach(file => {
        formData.append('images', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
      });

      // Добавляем описание
      formData.append('description', description);

      console.log(
        `Отправляем на регенерацию: ${serverAttachments.length} из ${attachments.length} файлов (только серверные URL)`,
      );

      // Отправляем запрос на регенерацию
      const response = await axios.post(
        `${config.aiServiceUrl}/regenerate/${currentJobId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 минуты таймаут для генерации дизайна
        },
      );

      // Если получили ID задачи, начинаем опрашивать статус
      if (response.data.jobId) {
        setCurrentJobId(response.data.jobId);
        startPolling(response.data.jobId);
      } else {
        throw new Error('No job ID received');
      }
    } catch (error) {
      console.error('Ошибка при отправке запроса на регенерацию:', error);
      setGenerationStatus('failed');

      if (error.response) {
        setErrorMessage(
          error.response.data?.errorMessage || t('Server error occurred'),
        );
      } else if (error.request) {
        setErrorMessage(
          t('No response from server. Check your internet connection.'),
        );
      } else {
        setErrorMessage(t('Failed to send request.'));
      }
    }
  };

  // Функция для определения типа файла и расширения на основе URL
  const getFileTypeFromUrl = url => {
    // Получаем расширение из URL
    const extension = url.split('.').pop().toLowerCase().split('?')[0];

    // Маппинг расширений на MIME-типы
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
    };

    // Возвращаем тип и расширение (с обработкой случая, когда расширение неизвестно)
    return {
      mimeType: mimeTypes[extension] || 'image/jpeg',
      ext: mimeTypes[extension] ? extension : 'jpg',
    };
  };

  // Функция для запроса разрешений на Android
  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true; // На iOS разрешения не требуются
    }

    try {
      // Для Android 13+ (API 33+) используем новые разрешения
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
        // Для более старых версий Android используем WRITE_EXTERNAL_STORAGE
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

  // Функция скачивания файла
  const downloadFile = async (fileUrl, fileName) => {
    try {
      if (Platform.OS === 'ios') {
        // На iOS предлагаем выбор между Documents и галереей
        Alert.alert(
          t('Save Image'),
          t('Where would you like to save the image?'),
          [
            {
              text: t('Cancel'),
              style: 'cancel',
            },
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
        // На Android сохраняем в Downloads
        await saveToDocuments(fileUrl, fileName);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        t('Download Failed'),
        error.message || t('Failed to download file. Please try again.'),
        [{text: t('OK')}],
      );
    }
  };

  // Функция сохранения в фото галерею (iOS)
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

  // Функция сохранения в Documents/Downloads
  const saveToDocuments = async (fileUrl, fileName) => {
    try {
      // Проверяем разрешения для Android
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

      // Определяем путь для сохранения
      const downloadDir =
        Platform.OS === 'ios'
          ? RNFS.DocumentDirectoryPath
          : RNFS.DownloadDirectoryPath;

      // Создаем уникальное имя файла с временной меткой
      const timestamp = new Date().getTime();
      const fileExtension = getFileTypeFromUrl(fileUrl).ext;
      const baseFileName = fileName.replace(/\.[^/.]+$/, ''); // Убираем расширение
      const finalFileName = `${baseFileName}_${timestamp}.${fileExtension}`;
      const filePath = `${downloadDir}/${finalFileName}`;

      // Скачиваем файл
      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: filePath,
        progress: res => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Download progress: ${progress.toFixed(2)}%`);
        },
      }).promise;

      if (downloadResult.statusCode === 200) {
        // Проверяем, что файл действительно сохранился
        const fileExists = await RNFS.exists(filePath);
        if (fileExists) {
          const fileStats = await RNFS.stat(filePath);
          console.log('File downloaded successfully:', {
            path: filePath,
            size: fileStats.size,
          });

          Alert.alert(
            t('Download Complete'),
            Platform.OS === 'ios'
              ? t('File saved to Files app (Documents)')
              : t('File saved to Downloads folder'),
            [{text: t('OK')}],
          );
        } else {
          throw new Error('File was not saved properly');
        }
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.statusCode}`,
        );
      }
    } catch (error) {
      console.error('Save to documents error:', error);
      Alert.alert(t('Save Failed'), error.message || t('Failed to save file'), [
        {text: t('OK')},
      ]);
    }
  };

  // Функция для определения типа файла
  const getFileType = (uri, mimeType) => {
    const fileName = uri.split('/').pop().toLowerCase();
    const extension = fileName.split('.').pop();

    // Типы изображений
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    // Типы PDF
    const pdfTypes = ['pdf'];
    // Типы документов
    const documentTypes = [
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'rtf',
    ];
    // Типы видео
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    // Типы аудио
    const audioTypes = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];

    if (imageTypes.includes(extension) || mimeType?.startsWith('image/')) {
      return 'image';
    } else if (pdfTypes.includes(extension) || mimeType?.includes('pdf')) {
      return 'pdf';
    } else if (
      documentTypes.includes(extension) ||
      mimeType?.includes('document') ||
      mimeType?.includes('text')
    ) {
      return 'document';
    } else if (
      videoTypes.includes(extension) ||
      mimeType?.startsWith('video/')
    ) {
      return 'video';
    } else if (
      audioTypes.includes(extension) ||
      mimeType?.startsWith('audio/')
    ) {
      return 'audio';
    } else {
      return 'other';
    }
  };

  // Функция просмотра файла
  const viewFile = async (fileUri, fileName, mimeType) => {
    try {
      const fileType = getFileType(fileUri, mimeType);

      // Для изображений используем FileViewer (универсальное решение)
      if (fileType === 'image') {
        console.log('Viewing image:', fileUri);

        // Если это локальный файл, открываем напрямую
        if (fileUri.startsWith('file://') || !fileUri.startsWith('http')) {
          await FileViewer.open(fileUri, {
            displayName: fileName,
            showOpenWithDialog: Platform.OS === 'android',
            showAppsSuggestions: Platform.OS === 'android',
          });
          return;
        }

        // Для удаленных изображений скачиваем и открываем
        const tempDir = RNFS.TemporaryDirectoryPath;
        const fileExtension = getFileTypeFromUrl(fileUri).ext;
        const timestamp = new Date().getTime();
        const tempFileName = `temp_image_${timestamp}.${fileExtension}`;
        const tempFilePath = `${tempDir}/${tempFileName}`;

        const downloadResult = await RNFS.downloadFile({
          fromUrl: fileUri,
          toFile: tempFilePath,
        }).promise;

        if (downloadResult.statusCode === 200) {
          await FileViewer.open(tempFilePath, {
            displayName: fileName || `image.${fileExtension}`,
            showOpenWithDialog: Platform.OS === 'android',
            showAppsSuggestions: Platform.OS === 'android',
            onDismiss: async () => {
              try {
                await RNFS.unlink(tempFilePath);
                console.log('Temporary image file deleted');
              } catch (error) {
                console.log('Error deleting temporary image file:', error);
              }
            },
          });
        }
        return;
      }

      // Для локальных файлов используем FileViewer напрямую
      if (fileUri.startsWith('file://') || !fileUri.startsWith('http')) {
        await FileViewer.open(fileUri, {
          displayName: fileName,
          showOpenWithDialog: Platform.OS === 'android',
          showAppsSuggestions: Platform.OS === 'android',
          onDismiss: () => {
            console.log('File viewer dismissed');
          },
        });
        return;
      }

      // Для удаленных файлов сначала скачиваем во временную папку
      const tempDir = RNFS.TemporaryDirectoryPath;
      const fileExtension = getFileTypeFromUrl(fileUri).ext;
      const timestamp = new Date().getTime();
      const tempFileName = `temp_${timestamp}.${fileExtension}`;
      const tempFilePath = `${tempDir}/${tempFileName}`;

      console.log('Downloading file for viewing:', fileUri);

      // Не показываем блокирующий алерт, оставим лог/индикатор по месту

      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUri,
        toFile: tempFilePath,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; React Native app)',
        },
      }).promise;

      if (downloadResult.statusCode === 200) {
        // Проверяем, что файл скачался
        const fileExists = await RNFS.exists(tempFilePath);
        if (fileExists) {
          // Открываем файл
          await FileViewer.open(tempFilePath, {
            displayName: fileName || `file.${fileExtension}`,
            showOpenWithDialog: Platform.OS === 'android',
            showAppsSuggestions: Platform.OS === 'android',
            onDismiss: async () => {
              // Удаляем временный файл после закрытия
              try {
                await RNFS.unlink(tempFilePath);
                console.log('Temporary file deleted');
              } catch (error) {
                console.log('Error deleting temporary file:', error);
              }
            },
          });
        } else {
          throw new Error('Downloaded file not found');
        }
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.statusCode}`,
        );
      }
    } catch (error) {
      console.error('File viewing error:', error);

      // Определяем тип ошибки для пользователя
      let errorMessage = t('Failed to open file');

      if (error.message?.includes('No app associated')) {
        errorMessage = t('No app found to open this file type');
      } else if (error.message?.includes('Download failed')) {
        errorMessage = t('Failed to download file');
      } else if (error.message?.includes('Permission')) {
        errorMessage = t('Permission denied to open file');
      }

      showConfirm({
        title: t('Cannot Open File'),
        message: errorMessage,
        cancelText: t('Cancel'),
        confirmText: t('Try Download'),
        onConfirm: () => downloadFile(fileUri, fileName),
      });
    }
  };

  return {
    description,
    setDescription,
    attachments,
    generationStatus,
    generatedDesign,
    errorMessage,
    isPolling,
    isLoading,
    pickFile,
    removeFile,
    generateDesign,
    createOrderWithDesign,
    regenerateDesign,
    getFileTypeFromUrl,
    downloadFile,
    viewFile,
  };
};

export default useDesignGeneration;
