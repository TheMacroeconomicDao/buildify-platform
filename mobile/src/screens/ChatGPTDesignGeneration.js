import React from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HeaderBack from '../headers/HeaderBack';
import TextArea from '../components/TextArea';
import Text from '../components/Text';
import {useChatGPTDesignGeneration} from '../hooks/useChatGPTDesignGeneration';
import {LoadingComponent} from './Loading';

const {width} = Dimensions.get('window');

export default function ChatGPTDesignGeneration({navigation}) {
  const {t} = useTranslation();
  const {
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
  } = useChatGPTDesignGeneration(navigation);

  const goBack = () => {
    navigation.goBack();
  };

  // Компонент для выбора опций
  const OptionSelector = ({
    title,
    options,
    selectedItems,
    onToggle,
    multiSelect = true,
  }) => (
    <View style={localStyles.optionSection}>
      <Text style={localStyles.optionTitle}>{title}</Text>
      <View style={localStyles.optionsContainer}>
        {options.map(option => {
          const isSelected = multiSelect
            ? selectedItems.includes(option.key)
            : selectedItems === option.key;

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                localStyles.optionChip,
                isSelected && localStyles.optionChipSelected,
              ]}
              onPress={() => onToggle(option.key)}>
              <Text
                style={[
                  localStyles.optionChipText,
                  isSelected && localStyles.optionChipTextSelected,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Компонент для работы с фотографиями
  const PhotoSection = () => (
    <View style={localStyles.inputSection}>
      <Text style={localStyles.inputLabel}>
        {t('Image generation')}{' '}
        <Text style={localStyles.optionalText}>({t('Optional')})</Text>
      </Text>
      <Text style={localStyles.photoSectionSubtitle}>
        {t(
          'Upload photos for better results or generate design based on description only',
        )}
      </Text>

      {/* Кнопки для добавления фото */}
      <View style={localStyles.photoButtonsContainer}>
        <TouchableOpacity
          style={[localStyles.photoButton, localStyles.cameraButton]}
          onPress={takePhotoFromCamera}>
          <View style={localStyles.photoButtonContent}>
            <View style={localStyles.photoButtonText}>
              <Text style={localStyles.photoButtonTitle}>
                {t('Take Photo')}
              </Text>
              <Text style={localStyles.photoButtonSubtitle}>
                {t('Take a photo right now using your phone camera')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.photoButton, localStyles.galleryButton]}
          onPress={pickPhotoFromGallery}>
          <View style={localStyles.photoButtonContent}>
            <View style={localStyles.photoButtonText}>
              <Text style={localStyles.photoButtonTitle}>
                {t('Upload from Gallery')}
              </Text>
              <Text style={localStyles.photoButtonSubtitle}>
                {t('This could be a ready-made photo or drawing')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Список прикрепленных фото */}
      {attachedPhotos.length > 0 && (
        <View style={localStyles.attachedPhotosContainer}>
          <View style={localStyles.attachedPhotosHeader}>
            <Text style={localStyles.attachedPhotosTitle}>
              {t('Attached Photos')} ({attachedPhotos.length})
            </Text>
            <TouchableOpacity onPress={clearPhotos}>
              <Text style={localStyles.clearAllText}>{t('Clear All')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={localStyles.photosGrid}>
              {attachedPhotos.map(photo => (
                <View key={photo.id} style={localStyles.photoItem}>
                  <Image
                    source={{uri: photo.uri}}
                    style={localStyles.photoPreview}
                  />
                  <TouchableOpacity
                    style={localStyles.removePhotoButton}
                    onPress={() => removePhoto(photo.id)}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={styles.colors.red}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={localStyles.container}>
      <HeaderBack title={t('AI Design Generation')} action={goBack} />

      {/* Индикатор загрузки во время генерации */}
      {isLoading && (
        <View style={localStyles.loadingOverlay}>
          <View style={localStyles.loadingContainer}>
            <ActivityIndicator size="large" color={styles.colors.primary} />
            <Text style={localStyles.loadingTitle}>
              {t('Generating Your Design')}
            </Text>
            <Text style={localStyles.loadingDescription}>
              {t(
                'AI is analyzing your requirements and creating a personalized interior design plan...',
              )}
            </Text>
            <View style={localStyles.loadingSteps}>
              <View style={localStyles.loadingStep}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={styles.colors.primary}
                />
                <Text style={localStyles.loadingStepText}>
                  {t('Processing description')}
                </Text>
              </View>
              <View style={localStyles.loadingStep}>
                <ActivityIndicator size="small" color={styles.colors.primary} />
                <Text style={localStyles.loadingStepText}>
                  {t('Creating design plan')}
                </Text>
              </View>
              <View style={localStyles.loadingStep}>
                <View style={localStyles.loadingStepIcon}>
                  <Ionicons
                    name="ellipse-outline"
                    size={16}
                    color={styles.colors.gray}
                  />
                </View>
                <Text
                  style={[
                    localStyles.loadingStepText,
                    localStyles.loadingStepTextPending,
                  ]}>
                  {t('Preparing materials list')}
                </Text>
              </View>
            </View>
            <Text style={localStyles.loadingTimeEstimate}>
              {t('This usually takes 20-40 seconds')}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={[
          localStyles.scrollView,
          isLoading && localStyles.scrollViewHidden,
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.scrollContent}>
        {/* Секция фотографий */}
        <PhotoSection />

        {/* Описание проекта */}
        <View style={localStyles.inputSection}>
          <Text style={localStyles.inputLabel}>{t('Project Description')}</Text>
          <TextArea
            value={description}
            onChange={setDescription}
            placeholder={t(
              'Describe your interior design project in detail...',
            )}
            size="lg"
            width="100%"
            style={localStyles.textArea}
          />
          <Text style={localStyles.helperText}>
            {t('Minimum 10 characters required')} ({description.length}/10)
          </Text>
        </View>

        {/* Выбор типа комнаты */}
        <OptionSelector
          title={t('Room Type')}
          options={roomTypeOptions}
          selectedItems={selectedRoomTypes}
          onToggle={toggleRoomType}
          multiSelect={true}
        />

        {/* Выбор стиля */}
        <OptionSelector
          title={t('Design Style')}
          options={styleOptions}
          selectedItems={selectedStyles}
          onToggle={toggleStyle}
          multiSelect={true}
        />

        {/* Выбор бюджета */}
        <View style={localStyles.optionSection}>
          <Text style={localStyles.optionTitle}>{t('Budget Range')}</Text>
          <View style={localStyles.optionsContainer}>
            {budgetOptions.map((budget, index) => {
              const isSelected = selectedBudget === budget;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    localStyles.budgetChip,
                    isSelected && localStyles.budgetChipSelected,
                  ]}
                  onPress={() => setBudget(budget)}>
                  <Text
                    style={[
                      localStyles.budgetChipText,
                      isSelected && localStyles.budgetChipTextSelected,
                    ]}>
                    {budget.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Сообщение об ошибке */}
        {errorMessage && (
          <View style={localStyles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={localStyles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Кнопка очистки */}
        {(generatedDesign || description || selectedRoomTypes.length > 0) && (
          <TouchableOpacity style={localStyles.clearButton} onPress={clearForm}>
            <Text style={localStyles.clearButtonText}>{t('Clear All')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Кнопка генерации */}
      <View style={localStyles.bottomContainer}>
        <TouchableOpacity
          style={[
            localStyles.generateButton,
            (isLoading || !description.trim()) &&
              localStyles.generateButtonDisabled,
          ]}
          onPress={
            generationStatus === 'complete' ? regenerateDesign : generateDesign
          }
          disabled={isLoading || !description.trim()}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={
                  generationStatus === 'complete' ? 'refresh' : 'flash-outline'
                }
                size={20}
                color="#FFFFFF"
              />
              <Text style={localStyles.generateButtonText}>
                {generationStatus === 'complete'
                  ? t('Regenerate Design')
                  : t('Generate Design')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: styles.paddingHorizontal,
    paddingBottom: 100,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 14,
    fontWeight: '400',
    color: styles.colors.regular || '#8A94A0',
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 100,
  },
  helperText: {
    fontSize: 12,
    color: styles.colors.gray,
    marginTop: 4,
  },
  optionSection: {
    marginBottom: 24,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: styles.colors.border,
    backgroundColor: styles.colors.white,
  },
  optionChipSelected: {
    backgroundColor: styles.colors.primary,
    borderColor: styles.colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: styles.colors.regular,
  },
  optionChipTextSelected: {
    color: styles.colors.white,
  },
  budgetChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: styles.colors.border,
    backgroundColor: styles.colors.white,
    marginBottom: 8,
    width: '100%',
  },
  budgetChipSelected: {
    backgroundColor: styles.colors.primary,
    borderColor: styles.colors.primary,
  },
  budgetChipText: {
    fontSize: 14,
    color: styles.colors.regular,
    textAlign: 'center',
  },
  budgetChipTextSelected: {
    color: styles.colors.white,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
  },
  resultContainer: {
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 16,
  },
  resultSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: styles.colors.regular,
    lineHeight: 20,
  },
  shoppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  shoppingItemText: {
    flex: 1,
    fontSize: 14,
    color: styles.colors.regular,
  },
  shoppingItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: styles.colors.primary,
  },
  costText: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  variationsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: styles.colors.primary,
  },
  variationsButtonText: {
    color: styles.colors.primary,
    fontWeight: '600',
  },
  orderButton: {
    backgroundColor: styles.colors.primary,
  },
  orderButtonText: {
    color: styles.colors.white,
    fontWeight: '600',
  },
  variationsContainer: {
    marginTop: 16,
  },
  variationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 12,
  },
  variationCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  variationNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: styles.colors.primary,
    marginBottom: 4,
  },
  variationContent: {
    fontSize: 13,
    color: styles.colors.regular,
    lineHeight: 18,
  },
  clearButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    marginTop: 16,
  },
  clearButtonText: {
    color: styles.colors.white,
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: styles.paddingHorizontal,
    paddingBottom: 34,
    backgroundColor: styles.colors.background,
    borderTopWidth: 1,
    borderTopColor: styles.colors.border,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: styles.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: styles.colors.actionGray,
  },
  generateButtonText: {
    color: styles.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Стили для секции фотографий
  photoSectionSubtitle: {
    fontSize: 14,
    color: styles.colors.actionGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  photoButtonsContainer: {
    gap: 12,
  },
  photoButton: {
    backgroundColor: styles.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 22,
  },
  cameraButton: {
    borderColor: styles.colors.primary,
  },
  galleryButton: {
    borderColor: '#EBEBEB',
  },
  photoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoButtonText: {
    flex: 1,
  },
  photoButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: styles.colors.black,
    marginBottom: 4,
  },
  photoButtonSubtitle: {
    fontSize: 13,
    color: styles.colors.actionGray,
    lineHeight: 17,
  },

  // Стили для прикрепленных фото
  attachedPhotosContainer: {
    marginTop: 16,
  },
  attachedPhotosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attachedPhotosTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: styles.colors.black,
  },
  clearAllText: {
    fontSize: 14,
    color: styles.colors.primary,
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: styles.colors.border,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: styles.colors.white,
    borderRadius: 10,
  },

  // Стили для сгенерированных изображений
  imagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: styles.colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: styles.colors.primary,
  },
  saveAllText: {
    fontSize: 14,
    color: styles.colors.primary,
    fontWeight: '500',
  },
  imagesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  imageItem: {
    position: 'relative',
  },
  generatedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: styles.colors.border,
  },
  saveImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Стили для индикатора загрузки
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '90%',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: styles.colors.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingDescription: {
    fontSize: 14,
    color: styles.colors.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loadingSteps: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 24,
  },
  loadingStepIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  loadingStepText: {
    fontSize: 14,
    color: styles.colors.black,
    flex: 1,
    flexWrap: 'wrap',
  },
  loadingStepTextPending: {
    color: styles.colors.gray,
  },
  loadingTimeEstimate: {
    fontSize: 12,
    color: styles.colors.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollViewHidden: {
    opacity: 0.3,
  },
});
