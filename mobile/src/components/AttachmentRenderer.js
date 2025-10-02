import React from 'react';
import {View, Text, Image, TouchableOpacity, Linking} from 'react-native';
import {notifyError, showConfirm} from '../services/notify';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import styles from '../styles';
import config from '../config';

/**
 * Определяет, является ли файл изображением
 * @param {Object} file - объект файла с сервера
 * @returns {boolean} true если файл является изображением
 */
export const isImageFile = file => {
  if (!file) return false;

  // Проверяем MIME-тип, если доступен (для локальных файлов)
  if (file.type) {
    return file.type.startsWith('image/');
  }

  // Определяем по расширению из path (основной случай для файлов с сервера)
  if (file.path) {
    const extension = file.path.toLowerCase().split('.').pop()?.split('?')[0];
    const imageExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'webp',
      'svg',
      'tiff',
      'ico',
    ];
    return imageExtensions.includes(extension);
  }

  // Определяем по имени файла (для локальных файлов)
  if (file.name || file.fileName) {
    const fileName = file.name || file.fileName;
    const extension = fileName.toLowerCase().split('.').pop();
    const imageExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'webp',
      'svg',
      'tiff',
      'ico',
    ];
    return imageExtensions.includes(extension);
  }

  // Определяем по URL (fallback)
  if (file.url || file.uri) {
    const url = file.url || file.uri;
    const extension = url.toLowerCase().split('.').pop()?.split('?')[0];
    const imageExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'webp',
      'svg',
      'tiff',
      'ico',
    ];
    return imageExtensions.includes(extension);
  }

  return false;
};

/**
 * Получает иконку для файла в зависимости от его типа
 * @param {Object} file - объект файла с сервера
 * @returns {string} название иконки Ionicons
 */
export const getFileIcon = file => {
  if (isImageFile(file)) return 'image-outline';

  // Получаем расширение из path (приоритет) или имени файла
  let extension = '';
  if (file.path) {
    extension = file.path.toLowerCase().split('.').pop()?.split('?')[0] || '';
  } else {
    const fileName = file.name || file.fileName || '';
    extension = fileName.toLowerCase().split('.').pop() || '';
  }

  switch (extension) {
    case 'pdf':
      return 'document-text-outline';
    case 'doc':
    case 'docx':
      return 'document-outline';
    case 'xls':
    case 'xlsx':
      return 'grid-outline';
    case 'ppt':
    case 'pptx':
      return 'easel-outline';
    case 'zip':
    case 'rar':
    case '7z':
      return 'archive-outline';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'videocam-outline';
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'musical-notes-outline';
    default:
      return 'document-outline';
  }
};

/**
 * Получает цвет фона для иконки файла
 * @param {Object} file - объект файла с сервера
 * @returns {string} цвет фона
 */
export const getFileIconColor = file => {
  if (isImageFile(file)) return styles.colors.primary;

  // Получаем расширение из path (приоритет) или имени файла
  let extension = '';
  if (file.path) {
    extension = file.path.toLowerCase().split('.').pop()?.split('?')[0] || '';
  } else {
    const fileName = file.name || file.fileName || '';
    extension = fileName.toLowerCase().split('.').pop() || '';
  }

  switch (extension) {
    case 'pdf':
      return '#e74c3c'; // красный
    case 'doc':
    case 'docx':
      return '#3498db'; // синий
    case 'xls':
    case 'xlsx':
      return '#27ae60'; // зеленый
    case 'ppt':
    case 'pptx':
      return '#f39c12'; // оранжевый
    case 'zip':
    case 'rar':
    case '7z':
      return '#9b59b6'; // фиолетовый
    case 'mp4':
    case 'avi':
    case 'mov':
      return '#e67e22'; // темно-оранжевый
    case 'mp3':
    case 'wav':
    case 'flac':
      return '#1abc9c'; // бирюзовый
    default:
      return styles.colors.highlight;
  }
};

/**
 * Унифицированный компонент для отображения файлов/вложений
 */
const AttachmentRenderer = ({
  file,
  size = 'medium', // 'small' | 'medium' | 'large'
  showName = true,
  showRemove = false,
  onRemove = null,
  onPress = null,
  onView = null,
  onDownload = null,
  style = {},
  imageStyle = {},
  nameStyle = {},
  containerStyle = {},
}) => {
  const {t} = useTranslation();

  if (!file) return null;

  const isImage = isImageFile(file);

  // Получаем имя файла из path или оригинального имени
  let fileName = '';
  if (file.path) {
    fileName = file.path.split('/').pop() || t('Unknown file'); // Берем последнюю часть path
  } else {
    fileName = file.name || file.fileName || t('Unknown file');
  }

  // Составляем URL для файла
  let fileUri = file.uri || null;

  // Базовый URL backend без /api
  const backendUrl = config.baseUrl.replace('/api', '');

  if (!fileUri && file.url) {
    // Если URL уже полный (содержит http), используем как есть
    if (file.url.startsWith('http')) {
      fileUri = file.url;
    } else {
      // Если URL относительный, добавляем базовый URL
      fileUri = file.url.startsWith('/')
        ? `${backendUrl}${file.url}`
        : `${backendUrl}/${file.url}`;
    }
  }

  if (!fileUri && file.path) {
    // Для path добавляем backend URL
    fileUri = `${backendUrl}/storage/${file.path}`;
  }
  // Размеры в зависимости от размера
  const sizes = {
    small: {width: 40, height: 40, iconSize: 20},
    medium: {width: 50, height: 50, iconSize: 24},
    large: {width: 80, height: 80, iconSize: 32},
  };

  const currentSize = sizes[size] || sizes.medium;

  const handlePress = () => {
    if (onPress) {
      onPress(file);
    } else if (onView) {
      onView(fileUri, fileName, file.type);
    } else if (fileUri) {
      // Дефолтное поведение - открыть файл
      if (isImage) {
        // Для изображений можно добавить lightbox или галерею
        console.log('Открыть изображение:', fileUri);
      } else {
        // Для других файлов пытаемся открыть через систему
        Linking.canOpenURL(fileUri)
          .then(supported => {
            if (supported) {
              Linking.openURL(fileUri);
            } else {
              notifyError(t('Error'), t('Cannot open this file type'));
            }
          })
          .catch(err => console.error('Ошибка открытия файла:', err));
      }
    }
  };

  const handleView = () => {
    if (onView) {
      onView(fileUri, fileName, file.type);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(fileUri, fileName);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      showConfirm({
        title: t('Remove file'),
        message: t('Are you sure you want to remove this file?'),
        cancelText: t('Cancel'),
        confirmText: t('Remove'),
        onConfirm: () => onRemove(file.id),
      });
    }
  };

  const renderContent = () => {
    if (isImage && fileUri) {
      return (
        <Image
          source={{uri: fileUri}}
          style={[
            {
              width: currentSize.width,
              height: currentSize.height,
              borderRadius: 4,
            },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      );
    } else {
      // Рендер иконки для файлов
      const iconName = getFileIcon(file);
      const iconColor = getFileIconColor(file);

      return (
        <View
          style={[
            {
              width: currentSize.width,
              height: currentSize.height,
              borderRadius: 4,
              backgroundColor: iconColor,
              alignItems: 'center',
              justifyContent: 'center',
            },
            style,
          ]}>
          <Ionicons
            name={iconName}
            size={currentSize.iconSize}
            color={styles.colors.white}
          />
        </View>
      );
    }
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
        },
        containerStyle,
      ]}>
      {/* Превью файла */}
      <TouchableOpacity
        onPress={handlePress}
        disabled={!fileUri && !onPress}
        style={{marginRight: showName ? 10 : 0}}>
        {renderContent()}
      </TouchableOpacity>

      {/* Название файла */}
      {showName && (
        <Text
          style={[
            {
              flex: 1,
              fontSize: 14,
              color: styles.colors.black,
            },
            nameStyle,
          ]}
          numberOfLines={1}>
          {fileName}
        </Text>
      )}

      {/* Кнопки действий */}
      <View
        style={{flexDirection: 'row', alignItems: 'center', marginLeft: 10}}>
        {/* Кнопка просмотра */}
        {onView && fileUri && (
          <TouchableOpacity
            onPress={handleView}
            style={{padding: 4, marginRight: 8}}>
            <Ionicons
              name="eye-outline"
              size={20}
              color={styles.colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Кнопка скачивания */}
        {onDownload && fileUri && (
          <TouchableOpacity
            onPress={handleDownload}
            style={{padding: 4, marginRight: 8}}>
            <Ionicons
              name="download-outline"
              size={20}
              color={styles.colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Кнопка удаления */}
        {showRemove && onRemove && (
          <TouchableOpacity onPress={handleRemove} style={{padding: 4}}>
            <Ionicons name="close" size={20} color={styles.colors.red} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AttachmentRenderer;
