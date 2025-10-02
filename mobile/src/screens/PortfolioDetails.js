import React, {useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import config from '../config';
import styles from '../styles';
import StandardButton from '../components/StandardButton';
import DocumentPicker from 'react-native-document-picker';
import usePortfolio from '../hooks/usePortfolio';

const {width: screenWidth} = Dimensions.get('window');

export default function PortfolioDetails({navigation, route}) {
  const {t} = useTranslation();
  const {portfolio} = route?.params || {};
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [title, setTitle] = useState(portfolio?.name || '');
  const {uploading, uploadFile, updatePortfolio, deletePortfolio} =
    usePortfolio();

  const goBack = () => {
    navigation.goBack();
  };

  if (!portfolio) {
    return (
      <View style={detailStyles.errorContainer}>
        <Text style={detailStyles.errorText}>Портфолио не найдено</Text>
      </View>
    );
  }

  const mediaFiles =
    portfolio.files?.filter(file => {
      const extension = file.name?.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'mkv'].includes(
        extension,
      );
    }) || [];

  const [items, setItems] = useState(mediaFiles);

  const handleImagePress = index => {
    setCurrentImageIndex(index);
  };

  const getMediaUrl = file => {
    if (file.path) {
      return `${config.siteUrl.replace(/\/$/, '')}${file.path}`;
    }
    return null;
  };

  const isVideo = file => {
    const extension = file.name?.split('.').pop()?.toLowerCase();
    return ['mp4', 'mov', 'avi', 'mkv'].includes(extension);
  };

  const isImage = file => {
    const extension = file.name?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
  };

  const onUploadPress = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.video],
      });
      const fileData = {
        uri: res.uri,
        type: res.type,
        name: res.name,
        size: res.size,
      };
      const result = await uploadFile(fileData);
      if (result && (result.file_id || result.file?.id)) {
        const fileId = result.file_id || result.file?.id;
        // Обновляем портфолио файлами (добавляем новый id)
        const updatedIds = [...(items || []).map(f => f.id), fileId];
        await updatePortfolio(portfolio.id, {files: updatedIds});
        // Локально добавляем новый файл в список для мгновенного UI
        const newFile = result.file || {
          id: fileId,
          name: res.name,
          size: res.size,
          path: result.file?.path,
        };
        setItems(prev => [...prev, newFile]);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) return;
      console.error('Upload error', err);
    }
  };

  const handleRename = async () => {
    try {
      await updatePortfolio(portfolio.id, {name: title});
      setRenameVisible(false);
    } catch {}
  };

  const handleDelete = async () => {
    try {
      setDeleteVisible(false);
      await deletePortfolio(portfolio.id);
      navigation.goBack();
    } catch {}
  };

  return (
    <View style={detailStyles.container}>
      <HeaderBack
        title={title}
        action={goBack}
        center={false}
        menu={true}
        menuAction={() => setOptionsVisible(true)}
      />

      <ScrollView style={detailStyles.scrollView}>
        {/* Сетка медиа 2x2 как в макете */}
        <View style={detailStyles.grid}>
          {items.map((file, index) => (
            <View key={file.id || index} style={detailStyles.gridItem}>
              <Image
                source={{uri: getMediaUrl(file)}}
                style={detailStyles.gridImage}
              />
              {isVideo(file) && (
                <View style={detailStyles.gridVideoBadge}>
                  <Ionicons
                    name="play-circle"
                    size={28}
                    color={styles.colors.white}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Информация о портфолио */}
        <View style={detailStyles.infoContainer}>
          <Text style={detailStyles.title}>{portfolio.name}</Text>

          {portfolio.description && (
            <View style={detailStyles.descriptionSection}>
              <Text style={detailStyles.sectionTitle}>Описание</Text>
              <Text style={detailStyles.description}>
                {portfolio.description}
              </Text>
            </View>
          )}

          {/* Файлы */}
          {portfolio.files && portfolio.files.length > 0 && (
            <View style={detailStyles.filesSection}>
              <Text style={detailStyles.sectionTitle}>
                Файлы ({portfolio.files.length})
              </Text>
              {portfolio.files.map((file, index) => (
                <View key={file.id || index} style={detailStyles.fileItem}>
                  <View style={detailStyles.fileIcon}>
                    <Ionicons
                      name={getFileIcon(file)}
                      size={20}
                      color={styles.colors.primary}
                    />
                  </View>
                  <View style={detailStyles.fileInfo}>
                    <Text style={detailStyles.fileName}>{file.name}</Text>
                    <Text style={detailStyles.fileSize}>
                      {formatFileSize(file.size)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Дата создания */}
          {portfolio.created_at && (
            <View style={detailStyles.metaInfo}>
              <Text style={detailStyles.metaLabel}>Создано:</Text>
              <Text style={detailStyles.metaValue}>
                {new Date(portfolio.created_at).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          )}
        </View>

        {/* Кнопка загрузки */}
        <View style={detailStyles.uploadContainer}>
          <StandardButton
            title={t('Add file')}
            action={onUploadPress}
            loading={uploading}
          />
        </View>
      </ScrollView>

      {/* Меню опций */}
      <Modal
        transparent
        visible={optionsVisible}
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}>
        <TouchableOpacity
          style={detailStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionsVisible(false)}>
          <View style={detailStyles.optionsSheet}>
            <TouchableOpacity
              style={detailStyles.optionItem}
              onPress={() => {
                setOptionsVisible(false);
                setRenameVisible(true);
              }}>
              <Text style={detailStyles.optionText}>{t('Rename')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={detailStyles.optionItem}
              onPress={() => {
                setOptionsVisible(false);
                setDeleteVisible(true);
              }}>
              <Text style={[detailStyles.optionText, {color: '#E53935'}]}>
                {t('Delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Переименование */}
      <Modal
        transparent
        visible={renameVisible}
        animationType="slide"
        onRequestClose={() => setRenameVisible(false)}>
        <View style={detailStyles.renameContainer}>
          <View style={detailStyles.renameCard}>
            <Text style={detailStyles.renameTitle}>{t('Edit name')}</Text>
            <View style={detailStyles.inputWrap}>
              <Text style={detailStyles.inputLabel}>{t('Folder name')}</Text>
              {/* Используем простой Text как input заменитель, если есть StandardInput — можно подменить */}
            </View>
            <View style={detailStyles.renameActions}>
              <TouchableOpacity
                style={detailStyles.cancelBtn}
                onPress={() => setRenameVisible(false)}>
                <Text style={detailStyles.cancelText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={detailStyles.saveBtn}
                onPress={handleRename}>
                <Text style={detailStyles.saveText}>{t('Save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Удаление */}
      <Modal
        transparent
        visible={deleteVisible}
        animationType="fade"
        onRequestClose={() => setDeleteVisible(false)}>
        <View style={detailStyles.renameContainer}>
          <View style={detailStyles.renameCard}>
            <Text style={detailStyles.renameTitle}>
              {t('Are you sure you want to delete?')}
            </Text>
            <View style={detailStyles.renameActions}>
              <TouchableOpacity
                style={detailStyles.cancelBtn}
                onPress={() => setDeleteVisible(false)}>
                <Text style={detailStyles.cancelText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={detailStyles.saveBtn}
                onPress={handleDelete}>
                <Text style={detailStyles.saveText}>{t('Delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getFileIcon = file => {
  const extension = file.name?.split('.').pop()?.toLowerCase();
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
    return 'play-circle';
  }
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return 'image';
  }
  if (['pdf'].includes(extension)) {
    return 'document-text';
  }
  return 'document';
};

const formatFileSize = bytes => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  errorText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
  },
  scrollView: {
    flex: 1,
  },

  // Грид
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  gridItem: {
    width: '46%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: styles.colors.grayLight,
  },
  gridImage: {width: '100%', height: '100%'},
  gridVideoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 12,
  },

  // Информация
  infoContainer: {
    backgroundColor: styles.colors.white,
    padding: 16,
    margin: 16,
    borderRadius: styles.borderR,
    borderWidth: 1,
    borderColor: styles.colors.border,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 16,
  },

  // Секции
  descriptionSection: {
    marginBottom: 20,
  },
  filesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 12,
  },
  description: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    lineHeight: 20,
  },

  // Файлы
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: styles.colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: styles.fonSize.sm,
    fontWeight: '500',
    color: styles.colors.titles,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.actionGray,
  },

  // Мета информация
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: styles.colors.border,
  },
  metaLabel: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
  },
  metaValue: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.titles,
    fontWeight: '500',
  },

  // Отступ снизу
  uploadContainer: {
    padding: 16,
  },

  // Модалки
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  optionsSheet: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  optionItem: {
    paddingVertical: 14,
  },
  optionText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.titles,
  },
  renameContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  renameCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  renameTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 12,
  },
  inputWrap: {marginBottom: 16},
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: styles.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {color: '#777', fontWeight: '600'},
  saveText: {color: '#fff', fontWeight: '600'},
});
