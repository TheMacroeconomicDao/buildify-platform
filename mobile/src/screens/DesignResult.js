import React, {useState} from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Share,
  Alert,
  Modal,
  Platform,
  PermissionsAndroid,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useEffect} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {api, retryApiCall} from '../services';
import RNFS from 'react-native-fs';
import Text from '../components/Text';
import HeaderBack from '../headers/HeaderBack';

import styles from '../styles';
import {LoadingComponent} from './Loading';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export default function DesignResult({navigation, route}) {
  const {t} = useTranslation();
  const {designData: initialDesignData, generationId} = route?.params || {};
  const [designData, setDesignData] = useState(initialDesignData);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Polling для изображений
  useEffect(() => {
    if (
      generationId &&
      (!designData?.images || designData.images.length === 0)
    ) {
      setIsLoadingImages(true);
      startImagePolling();
    }
  }, [generationId]);

  const startImagePolling = () => {
    const pollImages = async () => {
      try {
        const response = await retryApiCall(() =>
          api.design.getGenerationStatus(generationId),
        );

        if (response.success) {
          if (response.status === 'completed' && response.images?.length > 0) {
            setDesignData(prev => ({
              ...prev,
              images: response.images,
            }));
            setIsLoadingImages(false);
            return true;
          } else if (response.status === 'failed') {
            setIsLoadingImages(false);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Polling error:', error);
        return false;
      }
    };

    // Первая проверка
    pollImages().then(shouldStop => {
      if (!shouldStop) {
        const intervalId = setInterval(async () => {
          const shouldStop = await pollImages();
          if (shouldStop) {
            clearInterval(intervalId);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(intervalId);
          setIsLoadingImages(false);
        }, 300000);
      }
    });
  };

  const goBack = () => {
    navigation.goBack();
  };

  // Функция для сохранения изображения
  const saveImageToGallery = async (imageUrl, filename) => {
    try {
      // Создаем путь для сохранения
      const timestamp = new Date().getTime();
      const extension = imageUrl.split('.').pop() || 'jpg';
      const fileName = `${filename}_${timestamp}.${extension}`;

      let downloadPath;

      if (Platform.OS === 'android') {
        // Запрос разрешений для Android
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: t('Storage Permission'),
            message: t('App needs access to storage to save images'),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(t('Error'), t('Storage permission denied'));
          return;
        }

        downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        downloadPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }

      // Скачиваем изображение
      const downloadResult = await RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: downloadPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          t('Success'),
          Platform.OS === 'android'
            ? t('Image saved to Downloads folder')
            : t('Image saved to app documents'),
          [
            {
              text: t('OK'),
              onPress: () => {},
            },
            Platform.OS === 'android'
              ? {
                  text: t('Open Downloads'),
                  onPress: () => {
                    // Открываем папку Downloads на Android
                    Linking.openURL(
                      'content://com.android.externalstorage.documents/document/primary%3ADownload',
                    );
                  },
                }
              : null,
          ].filter(Boolean),
        );
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert(t('Error'), t('Failed to save image'));
    }
  };

  // Функция для поделиться дизайном
  const shareDesign = async () => {
    try {
      const shareContent = {
        message: `${t('Check out this design')}:\n\n${
          designData?.design?.summary || designData?.raw_response || ''
        }`,
      };
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing design:', error);
    }
  };

  // Открытие просмотрщика изображений
  const openImageViewer = index => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  // Компонент просмотрщика изображений
  const ImageViewer = () => {
    const images = designData?.images || [];
    const currentImage = images[selectedImageIndex];

    if (!currentImage) return null;

    return (
      <Modal
        visible={imageViewerVisible}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setImageViewerVisible(false)}>
        <View style={localStyles.imageViewerContainer}>
          {/* Header */}
          <View style={localStyles.imageViewerHeader}>
            <TouchableOpacity
              style={localStyles.imageViewerCloseButton}
              onPress={() => setImageViewerVisible(false)}>
              <Ionicons name="close" size={24} color={styles.colors.white} />
            </TouchableOpacity>
            <Text style={localStyles.imageViewerTitle}>
              {selectedImageIndex + 1} / {images.length}
            </Text>
            <TouchableOpacity
              style={localStyles.imageViewerActionButton}
              onPress={() =>
                saveImageToGallery(
                  currentImage.url,
                  `design_${selectedImageIndex + 1}`,
                )
              }>
              <Ionicons
                name="download-outline"
                size={24}
                color={styles.colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Image */}
          <ScrollView
            contentContainerStyle={localStyles.imageViewerImageContainer}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}>
            <Image
              source={{uri: currentImage.url}}
              style={localStyles.imageViewerImage}
              resizeMode="contain"
            />
          </ScrollView>

          {/* Navigation */}
          {images.length > 1 && (
            <View style={localStyles.imageViewerNavigation}>
              <TouchableOpacity
                style={[
                  localStyles.imageViewerNavButton,
                  selectedImageIndex === 0 &&
                    localStyles.imageViewerNavButtonDisabled,
                ]}
                onPress={() =>
                  setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
                }
                disabled={selectedImageIndex === 0}>
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={
                    selectedImageIndex === 0
                      ? styles.colors.gray
                      : styles.colors.white
                  }
                />
              </TouchableOpacity>

              <View style={localStyles.imageViewerDots}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      localStyles.imageViewerDot,
                      index === selectedImageIndex &&
                        localStyles.imageViewerDotActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  localStyles.imageViewerNavButton,
                  selectedImageIndex === images.length - 1 &&
                    localStyles.imageViewerNavButtonDisabled,
                ]}
                onPress={() =>
                  setSelectedImageIndex(
                    Math.min(images.length - 1, selectedImageIndex + 1),
                  )
                }
                disabled={selectedImageIndex === images.length - 1}>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    selectedImageIndex === images.length - 1
                      ? styles.colors.gray
                      : styles.colors.white
                  }
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  if (!designData) {
    return (
      <View style={localStyles.container}>
        <HeaderBack title={t('Design Result')} action={goBack} />
        <View style={localStyles.errorContainer}>
          <Text style={localStyles.errorText}>
            {t('No design data available')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <HeaderBack
        title={t('Design Result')}
        action={goBack}
        menu={true}
        menuAction={shareDesign}
        menuIcon="share-outline"
      />

      <ScrollView
        style={localStyles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Секция изображений */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>{t('Generated Images')}</Text>

          {isLoadingImages ? (
            <LoadingComponent
              showLogo={false}
              text={t('Generating images...')}
              style={{paddingVertical: 40}}
            />
          ) : designData?.images && designData.images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={localStyles.imagesGrid}>
                {designData.images.map((image, index) => (
                  <View key={index} style={localStyles.imageItem}>
                    <TouchableOpacity onPress={() => openImageViewer(index)}>
                      <Image
                        source={{uri: image.url}}
                        style={localStyles.generatedImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={localStyles.saveImageButton}
                      onPress={() =>
                        saveImageToGallery(image.url, `design_${index + 1}`)
                      }>
                      <Ionicons
                        name="download-outline"
                        size={20}
                        color={styles.colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={localStyles.noImagesContainer}>
              <Ionicons
                name="image-outline"
                size={48}
                color={styles.colors.gray}
              />
              <Text style={localStyles.noImagesText}>
                {t('Images will appear here when ready')}
              </Text>
            </View>
          )}
        </View>

        {/* Краткое резюме */}
        {designData.design?.summary && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Summary')}</Text>
            <Text style={localStyles.sectionContent}>
              {designData.design.summary}
            </Text>
          </View>
        )}

        {/* Секции дизайна */}
        {designData.design?.sections &&
          Object.entries(designData.design.sections).map(([key, content]) => (
            <View key={key} style={localStyles.section}>
              <Text style={localStyles.sectionTitle}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={localStyles.sectionContent}>{content}</Text>
            </View>
          ))}

        {/* Список покупок */}
        {designData.design?.shopping_list && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Shopping List')}</Text>
            {designData.design.shopping_list.map((item, index) => (
              <View key={index} style={localStyles.shoppingItem}>
                <View style={localStyles.shoppingItemBullet} />
                <Text style={localStyles.shoppingItemText}>
                  {typeof item === 'object' ? item.item : item}
                  {typeof item === 'object' && item.estimated_price && (
                    <Text style={localStyles.priceText}>
                      {' '}
                      - {item.estimated_price} AED
                    </Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Общая стоимость от модели */}
        {designData.design?.estimated_cost && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Estimated Cost')}</Text>
            <Text style={localStyles.costText}>
              {typeof designData.design.estimated_cost === 'object'
                ? `${designData.design.estimated_cost.min} - ${designData.design.estimated_cost.max} AED`
                : designData.design.estimated_cost}
            </Text>
          </View>
        )}

        {/* Полный текст ответа если нет структурированных данных */}
        {designData.raw_response && !designData.design?.summary && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>
              {t('Design Recommendations')}
            </Text>
            <Text style={localStyles.sectionContent}>
              {designData.raw_response}
            </Text>
          </View>
        )}

        {/* Кнопки действий */}
        <View style={localStyles.actionsSection}>
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={() => navigation.navigate('DesignGeneration')}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color={styles.colors.primary}
            />
            <Text style={localStyles.actionButtonText}>
              {t('Generate Variations')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={localStyles.primaryActionButton}
            onPress={() =>
              navigation.navigate('CreateOrder', {
                initialDescription:
                  designData.design?.summary || designData.raw_response,
                initialAttachments: designData.images,
                designData: designData,
              })
            }>
            <Ionicons name="add-circle" size={20} color={styles.colors.white} />
            <Text style={localStyles.primaryActionButtonText}>
              {t('Create Order')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Исходное описание */}
        {designData.originalDescription && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>
              {t('Original Description')}
            </Text>
            <Text style={localStyles.sectionContent}>
              {designData.originalDescription}
            </Text>
          </View>
        )}

        {/* Бюджет */}
        {designData.budget && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Budget')}</Text>
            <Text style={localStyles.budgetText}>
              {designData.budget.min && designData.budget.max
                ? `${designData.budget.min} - ${designData.budget.max} AED`
                : designData.budget.min
                ? `From ${designData.budget.min} AED`
                : t('Budget not specified')}
            </Text>
          </View>
        )}

        {/* Типы комнат */}
        {designData.roomTypes && designData.roomTypes.length > 0 && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Room Types')}</Text>
            <View style={localStyles.tagsContainer}>
              {designData.roomTypes.map((roomType, index) => (
                <View key={index} style={localStyles.tag}>
                  <Text style={localStyles.tagText}>{roomType}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Стили */}
        {designData.styles && designData.styles.length > 0 && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>{t('Styles')}</Text>
            <View style={localStyles.tagsContainer}>
              {designData.styles.map((style, index) => (
                <View key={index} style={localStyles.tag}>
                  <Text style={localStyles.tagText}>{style}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{height: 100}} />
      </ScrollView>

      <ImageViewer />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: styles.colors.gray,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: styles.colors.black,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    color: styles.colors.text,
  },
  imagesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  imageItem: {
    marginRight: 12,
    position: 'relative',
  },

  generatedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  loadingImagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingImagesText: {
    fontSize: 16,
    fontWeight: '500',
    color: styles.colors.black,
  },
  loadingImagesSubtext: {
    fontSize: 14,
    color: styles.colors.gray,
    textAlign: 'center',
  },
  noImagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noImagesText: {
    fontSize: 14,
    color: styles.colors.gray,
    textAlign: 'center',
    marginBottom: 16,
  },
  generateImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: styles.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  generateImagesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  shoppingItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: styles.colors.primary,
    marginTop: 7,
    marginRight: 12,
  },
  shoppingItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: styles.colors.text,
  },
  priceText: {
    fontWeight: '600',
    color: styles.colors.primary,
  },
  budgetText: {
    fontSize: 16,
    color: styles.colors.primary,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: styles.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: styles.colors.border,
  },
  tagText: {
    fontSize: 14,
    color: styles.colors.text,
    fontWeight: '500',
  },
  costText: {
    fontSize: 18,
    color: styles.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionsSection: {
    marginHorizontal: 16,
    marginVertical: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: styles.colors.primary,
    backgroundColor: styles.colors.white,
    gap: 8,
  },
  actionButtonText: {
    color: styles.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: styles.colors.primary,
    gap: 8,
  },
  primaryActionButtonText: {
    color: styles.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Image Viewer Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  imageViewerCloseButton: {
    padding: 8,
  },
  imageViewerTitle: {
    color: styles.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  imageViewerActionButton: {
    padding: 8,
  },
  imageViewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  imageViewerNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  imageViewerNavButton: {
    padding: 12,
  },
  imageViewerNavButtonDisabled: {
    opacity: 0.5,
  },
  imageViewerDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageViewerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  imageViewerDotActive: {
    backgroundColor: styles.colors.white,
  },
});
