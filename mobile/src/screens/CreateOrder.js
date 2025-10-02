import React from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import HeaderBack from '../headers/HeaderBack';
import TextArea from '../components/TextArea';
import StandardInput from '../components/StandardInput';
import StandardButton from '../components/StandardButton';
import Text from '../components/Text';

import TimeInput from '../components/TimeInput';
import DatePickerInput from '../components/DatePickerInput';
import TimePickerInput from '../components/TimePickerInput';
import AttachmentsList from '../components/AttachmentsList';
import GalleryModal from '../components/GalleryModal';
import MapView, {Marker, PROVIDER_DEFAULT} from 'react-native-maps';

import useCreateOrder from '../hooks/useCreateOrder';
import useHousingOptions from '../hooks/useHousingOptions';
import {LoadingComponent} from './Loading';

export default function CreateOrder({navigation, route}) {
  const {t} = useTranslation();

  // Проверка наличия Google Maps API ключа
  const GOOGLE_MAPS_API_KEY = null; // Поставить здесь реальный ключ при необходимости
  const hasMapApiKey =
    GOOGLE_MAPS_API_KEY &&
    GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  const {
    categories,
    subcategories,
    loading,
    submitting,
    step,
    setStep,
    formData,
    errors,
    attachments,

    isGalleryModalVisible,
    selectedGalleryFiles,
    galleryFiles,
    closeGalleryModal,
    toggleGalleryFile,
    selectGalleryFiles,
    handleInputChange,
    stepBack,
    titleByStep,
    pickFile,
    removeFile,
    handleCreateOrder,
    viewFile,
    downloadFile,
    isImageFile,
    isDocumentFile,
    hasRequiredFileTypes,
    loadGalleryImages,
    loadDocumentsFromDevice,
    loadGalleryAndDocuments,
  } = useCreateOrder(navigation, route);

  // Загружаем опции жилья из API
  const {housingOptions, loading: optionsLoading} = useHousingOptions();

  // Отладка: проверяем, что handleCreateOrder определена
  console.log('🔍 handleCreateOrder in CreateOrder:', !!handleCreateOrder);
  console.log('🔍 Current step:', step);
  console.log('🔍 submitting state:', submitting);

  // Проверка на null или undefined значения для безопасности
  const safeCategories = categories || [];
  const safeSubcategories = subcategories || [];
  const safeAttachments = attachments || [];

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: styles.colors.background,
        }}>
        <LoadingComponent text={t('Loading...')} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: styles.colors.background,
      }}>
      <HeaderBack action={() => stepBack()} title={titleByStep(step)} />
      <ScrollView
        style={{
          width: '100%',
          height: '100%',
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          rowGap: styles.paddingHorizontal,
          padding: step === 6 ? 0 : styles.paddingHorizontal,
          paddingBottom: 120,
        }}>
        {step === 1 && (
          <View style={{gap: 8, marginBottom: 24, width: '100%'}}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: styles.colors.primary,
                lineHeight: 27,
              }}>
              {t('Step 1')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '400',
                color: '#8A94A0',
                lineHeight: 24,
              }}>
              {t('Choose the type of work you need')}
            </Text>
          </View>
        )}

        {step === 1 && safeCategories.length > 0
          ? safeCategories.map((item, index) => (
              <TouchableOpacity
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor:
                    formData.category && formData.category.id === item.id
                      ? styles.colors.primary
                      : '#EBEBEB',
                  padding: 16,
                  shadowColor: 'rgba(213, 213, 213, 0.25)',
                  shadowOffset: {width: 0, height: 4},
                  shadowOpacity: 1,
                  shadowRadius: 16.9,
                  elevation: 5,
                  marginBottom: 8,
                  minHeight: 60,
                  justifyContent: 'center',
                }}
                onPress={() => {
                  handleInputChange('category', item);
                }}
                key={index}>
                <View style={{gap: 8, justifyContent: 'center'}}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '500',
                      color: '#323232',
                      lineHeight: 15,
                    }}>
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '400',
                      color: '#8A94A0',
                      lineHeight: 17,
                    }}>
                    {t('This can be a ready photo or drawing')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          : null}

        {step === 1 && safeCategories.length === 0 ? (
          <View style={{width: '100%', alignItems: 'center', padding: 20}}>
            <Text
              style={{
                color: styles.colors.grey,
                fontSize: 16,
                textAlign: 'center',
              }}>
              {t('No categories available')}
            </Text>
          </View>
        ) : null}

        {step === 2 && (
          <View style={{gap: 8, marginBottom: 24, width: '100%'}}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: styles.colors.primary,
                lineHeight: 27,
              }}>
              {t('Step 2')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '400',
                color: '#8A94A0',
                lineHeight: 24,
              }}>
              {t('Select specific service from the category')}
            </Text>
          </View>
        )}

        {step === 2 && safeSubcategories.length > 0 ? (
          safeSubcategories.map((item, index) => (
            <TouchableOpacity
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                borderWidth: 1,
                borderColor:
                  formData.subcategory && formData.subcategory.id === item.id
                    ? styles.colors.primary
                    : '#EBEBEB',
                padding: 16,
                shadowColor: 'rgba(213, 213, 213, 0.25)',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 1,
                shadowRadius: 16.9,
                elevation: 5,
                marginBottom: 8,
                minHeight: 60,
                justifyContent: 'center',
              }}
              onPress={() => {
                handleInputChange('subcategory', item);
              }}
              key={index}>
              <View style={{gap: 8, justifyContent: 'center'}}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '500',
                    color: '#323232',
                    lineHeight: 15,
                  }}>
                  {item.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : step === 2 && safeSubcategories.length === 0 ? (
          <View style={{width: '100%', alignItems: 'center', padding: 20}}>
            <Text
              style={{
                color: styles.colors.grey,
                fontSize: 16,
                textAlign: 'center',
              }}>
              {t('No subcategories available for this category')}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                padding: 10,
                backgroundColor: styles.colors.primary,
                borderRadius: 8,
              }}
              onPress={() => stepBack()}>
              <Text style={{color: styles.colors.white, fontWeight: 'bold'}}>
                {t('Select another category')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 3 && (
          <View style={{width: '100%', gap: 8, marginBottom: 24}}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: styles.colors.primary,
                lineHeight: 27,
              }}>
              {t('Step 3')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '400',
                color: '#8A94A0',
                lineHeight: 24,
              }}>
              {t('Specify data for more accurate calculation')}
            </Text>
          </View>
        )}

        {step === 3 && (
          <View style={{width: '100%', gap: 24}}>
            {/* Тип жилья */}
            <View style={{gap: 12}}>
              <Text style={{fontSize: 16, fontWeight: '500', color: '#000'}}>
                {t('Housing type')}
              </Text>
              <View style={{gap: 12}}>
                {(
                  housingOptions.housing_type || [
                    {key: 'apartment', value: t('Apartment')},
                    {key: 'house', value: t('House / villa')},
                    {key: 'commercial', value: t('Commercial property')},
                  ]
                ).map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        formData.housing_type === item.key
                          ? styles.colors.primary
                          : '#EBEBEB',
                      padding: 16,
                      justifyContent: 'center',
                    }}
                    onPress={() => handleInputChange('housing_type', item.key)}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#323232',
                      }}>
                      {item.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Состояние жилья */}
            <View style={{gap: 12}}>
              <Text style={{fontSize: 16, fontWeight: '500', color: '#000'}}>
                {t('Housing condition')}
              </Text>
              <View style={{gap: 12}}>
                {(
                  housingOptions.housing_condition || [
                    {key: 'new', value: t('New housing')},
                    {key: 'secondary', value: t('Secondary housing')},
                  ]
                ).map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        formData.housing_condition === item.key
                          ? styles.colors.primary
                          : '#EBEBEB',
                      padding: 16,
                      justifyContent: 'center',
                    }}
                    onPress={() =>
                      handleInputChange('housing_condition', item.key)
                    }>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#323232',
                      }}>
                      {item.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Уровень подготовки жилья */}
            <View style={{gap: 12}}>
              <Text style={{fontSize: 16, fontWeight: '500', color: '#000'}}>
                {t('Housing preparation level')}
              </Text>
              <View style={{gap: 12}}>
                {(
                  housingOptions.housing_preparation_level || [
                    {key: 'without_walls', value: t('Without walls')},
                    {key: 'rough_finish', value: t('Rough finish')},
                    {key: 'finish_finish', value: t('Finish finish')},
                  ]
                ).map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        formData.housing_preparation_level === item.key
                          ? styles.colors.primary
                          : '#EBEBEB',
                      padding: 16,
                      justifyContent: 'center',
                    }}
                    onPress={() =>
                      handleInputChange('housing_preparation_level', item.key)
                    }>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#323232',
                      }}>
                      {item.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Тип санузла */}
            <View style={{gap: 12}}>
              <Text style={{fontSize: 16, fontWeight: '500', color: '#000'}}>
                {t('Bathroom type')}
              </Text>
              <View style={{gap: 12}}>
                {(
                  housingOptions.bathroom_type || [
                    {key: 'separate', value: t('Separate')},
                    {key: 'combined', value: t('Combined')},
                  ]
                ).map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        formData.bathroom_type === item.key
                          ? styles.colors.primary
                          : '#EBEBEB',
                      padding: 16,
                      justifyContent: 'center',
                    }}
                    onPress={() =>
                      handleInputChange('bathroom_type', item.key)
                    }>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#323232',
                      }}>
                      {item.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Высота потолков */}
            <View style={{gap: 12}}>
              <Text style={{fontSize: 16, fontWeight: '500', color: '#000'}}>
                {t('Ceiling height')}
              </Text>
              <StandardInput
                label={t('Height, m')}
                mode="numeric"
                value={formData.ceiling_height}
                onChange={val => handleInputChange('ceiling_height', val)}
                placeholder="2,5"
                size="md"
                width="100%"
              />
            </View>

            {/* Общая площадь */}
            <View style={{gap: 12}}>
              <Text style={{fontSize: 16, fontWeight: '500', color: '#000'}}>
                {t('Total area')}
              </Text>
              <StandardInput
                label={t('Area, sq.m.')}
                mode="numeric"
                value={formData.total_area}
                onChange={val => handleInputChange('total_area', val)}
                placeholder="450,5"
                size="md"
                width="100%"
              />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={{width: '100%', gap: 24}}>
            {/* Заголовок */}
            <View style={{gap: 8}}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: styles.colors.primary,
                  lineHeight: 27,
                }}>
                {t('Step 4')}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '400',
                  color: '#8A94A0',
                  lineHeight: 24,
                }}>
                {t('You can specify the address manually or on the map')}
              </Text>
            </View>

            {/* Поле ввода города */}
            <StandardInput
              label={t('City')}
              value={formData.city}
              onChange={val => handleInputChange('city', val)}
              placeholder={t('Enter city name')}
              size="md"
              width="100%"
              error={errors?.find(e => e.path === 'city')?.message || null}
            />

            {/* Поле ввода адреса */}
            <StandardInput
              label={t('Address')}
              value={formData.address}
              onChange={val => handleInputChange('address', val)}
              placeholder={t('Enter street address')}
              size="md"
              width="100%"
              error={errors?.find(e => e.path === 'address')?.message || null}
            />

            {/* Поле ввода полного адреса */}
            <StandardInput
              label={t('Full address (optional)')}
              value={formData.full_address}
              onChange={val => handleInputChange('full_address', val)}
              placeholder={t('Full address with details')}
              size="md"
              width="100%"
            />

            {/* Карта или заглушка */}
            <View style={{height: 400, borderRadius: 8, overflow: 'hidden'}}>
              {hasMapApiKey ? (
                <MapView
                  provider={PROVIDER_DEFAULT}
                  style={{flex: 1}}
                  initialRegion={{
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  onPress={event => {
                    const {latitude, longitude} = event.nativeEvent.coordinate;
                    handleInputChange('latitude', latitude);
                    handleInputChange('longitude', longitude);
                  }}>
                  <Marker
                    coordinate={{
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                    }}
                    draggable
                    onDragEnd={event => {
                      const {latitude, longitude} =
                        event.nativeEvent.coordinate;
                      handleInputChange('latitude', latitude);
                      handleInputChange('longitude', longitude);
                    }}
                  />
                </MapView>
              ) : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#F5F5F5',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#8A94A0',
                      textAlign: 'center',
                      paddingHorizontal: 20,
                    }}>
                    {t('Map will be available after API key configuration')}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#C0C0C0',
                      textAlign: 'center',
                      paddingHorizontal: 20,
                      marginTop: 8,
                    }}>
                    {t('Please enter address manually')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={{width: '100%', gap: 24}}>
            {/* Заголовок */}
            <View style={{gap: 8}}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: styles.colors.primary,
                  lineHeight: 27,
                }}>
                {t('Step 5')}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '400',
                  color: '#8A94A0',
                  lineHeight: 24,
                }}>
                {t('When do you need the work to be done?')}
              </Text>
            </View>

            {/* Переключатель Дата/Период */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: '#F5F5F5',
                borderRadius: 25,
                padding: 4,
                gap: 4,
              }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 21,
                  backgroundColor:
                    formData.date_type === 'single'
                      ? styles.colors.primary
                      : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => handleInputChange('date_type', 'single')}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color:
                      formData.date_type === 'single' ? '#FFFFFF' : '#8A94A0',
                  }}>
                  {t('Date')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 21,
                  backgroundColor:
                    formData.date_type === 'period'
                      ? styles.colors.primary
                      : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => handleInputChange('date_type', 'period')}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color:
                      formData.date_type === 'period' ? '#FFFFFF' : '#8A94A0',
                  }}>
                  {t('Period')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Поля для выбора даты */}
            {formData.date_type === 'single' ? (
              <View style={{gap: 16}}>
                <DatePickerInput
                  value={formData.work_date}
                  onChange={val => handleInputChange('work_date', val)}
                  placeholder={t('Select date')}
                  size="md"
                  width="100%"
                />
                <TimePickerInput
                  value={formData.work_time}
                  onChange={val => handleInputChange('work_time', val)}
                  placeholder={t('Select time')}
                  size="md"
                  width="100%"
                />
              </View>
            ) : (
              <View style={{gap: 16}}>
                <DatePickerInput
                  value={formData.start_date}
                  onChange={val => handleInputChange('start_date', val)}
                  placeholder={t('Select start date')}
                  size="md"
                  width="100%"
                />
                <TimePickerInput
                  value={formData.start_time}
                  onChange={val => handleInputChange('start_time', val)}
                  placeholder={t('Select start time')}
                  size="md"
                  width="100%"
                />
                <DatePickerInput
                  value={formData.end_date}
                  onChange={val => handleInputChange('end_date', val)}
                  placeholder={t('Select end date')}
                  size="md"
                  width="100%"
                />
                <TimePickerInput
                  value={formData.end_time}
                  onChange={val => handleInputChange('end_time', val)}
                  placeholder={t('Select end time')}
                  size="md"
                  width="100%"
                />
              </View>
            )}
          </View>
        )}

        {step === 6 && (
          <View style={{width: '100%', gap: 24}}>
            {/* Заголовок */}
            <View
              style={{
                gap: 8,
                paddingHorizontal: styles.paddingHorizontal,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: styles.colors.primary,
                  lineHeight: 27,
                }}>
                {t('Step 6')}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '400',
                  color: '#8A94A0',
                  lineHeight: 24,
                }}>
                {t('Provide detailed description and budget for your project')}
              </Text>
            </View>

            {/* Тип работ */}
            {(formData.category?.name || formData.subcategory?.name) && (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  gap: 12,
                }}>
                <Text style={{fontSize: 16, fontWeight: '600', color: '#000'}}>
                  {t('Work type')}
                </Text>

                <View style={{gap: 12}}>
                  {formData.category?.name && (
                    <StandardInput
                      value={formData.category.name}
                      onChange={() => {}}
                      placeholder={t('Not selected')}
                      size="md"
                      width="100%"
                      editable={false}
                      onPress={() => setStep(1)}
                      hideLabel={true}
                      hideValidationIcon={true}
                    />
                  )}
                  {formData.subcategory?.name && (
                    <StandardInput
                      value={formData.subcategory.name}
                      onChange={() => {}}
                      placeholder={t('Not selected')}
                      size="md"
                      width="100%"
                      editable={false}
                      onPress={() => setStep(2)}
                      hideLabel={true}
                      hideValidationIcon={true}
                    />
                  )}
                </View>
              </View>
            )}

            {/* Детали */}
            {(formData.housing_type ||
              formData.housing_condition ||
              formData.housing_preparation_level ||
              formData.bathroom_type ||
              formData.ceiling_height ||
              formData.total_area) && (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  gap: 12,
                }}>
                <Text style={{fontSize: 16, fontWeight: '600', color: '#000'}}>
                  {t('Details')}
                </Text>

                <View style={{gap: 12}}>
                  {formData.housing_type && (
                    <StandardInput
                      value={
                        formData.housing_type === 'apartment'
                          ? t('Apartment')
                          : formData.housing_type === 'house'
                          ? t('House / villa')
                          : formData.housing_type === 'commercial'
                          ? t('Commercial property')
                          : ''
                      }
                      onChange={() => {}}
                      placeholder={t('Not selected')}
                      size="md"
                      width="100%"
                      editable={false}
                      onPress={() => setStep(3)}
                      hideLabel={true}
                      hideValidationIcon={true}
                    />
                  )}

                  {formData.housing_condition && (
                    <StandardInput
                      value={
                        formData.housing_condition === 'new'
                          ? t('New housing')
                          : formData.housing_condition === 'secondary'
                          ? t('Secondary housing')
                          : ''
                      }
                      onChange={() => {}}
                      placeholder={t('Not selected')}
                      size="md"
                      width="100%"
                      editable={false}
                      onPress={() => setStep(3)}
                      hideLabel={true}
                      hideValidationIcon={true}
                    />
                  )}

                  {formData.housing_preparation_level && (
                    <StandardInput
                      value={
                        formData.housing_preparation_level === 'without_walls'
                          ? t('Without walls')
                          : formData.housing_preparation_level ===
                            'rough_finish'
                          ? t('Rough finish')
                          : formData.housing_preparation_level ===
                            'finish_finish'
                          ? t('Finish finish')
                          : ''
                      }
                      onChange={() => {}}
                      placeholder={t('Not selected')}
                      size="md"
                      width="100%"
                      editable={false}
                      onPress={() => setStep(3)}
                      hideLabel={true}
                      hideValidationIcon={true}
                    />
                  )}

                  {formData.bathroom_type && (
                    <StandardInput
                      value={
                        formData.bathroom_type === 'separate'
                          ? t('Separate')
                          : formData.bathroom_type === 'combined'
                          ? t('Combined')
                          : ''
                      }
                      onChange={() => {}}
                      placeholder={t('Not selected')}
                      size="md"
                      width="100%"
                      editable={false}
                      onPress={() => setStep(3)}
                      hideLabel={true}
                      hideValidationIcon={true}
                    />
                  )}

                  {formData.ceiling_height && (
                    <StandardInput
                      label={t('Height, m')}
                      value={formData.ceiling_height}
                      onChange={val => handleInputChange('ceiling_height', val)}
                      placeholder="2,5"
                      size="md"
                      width="100%"
                      mode="numeric"
                      hideLabel={false}
                      hideValidationIcon={true}
                    />
                  )}

                  {formData.total_area && (
                    <StandardInput
                      label={t('Area, sq.m.')}
                      value={formData.total_area}
                      onChange={val => handleInputChange('total_area', val)}
                      placeholder="450,5"
                      size="md"
                      width="100%"
                      mode="numeric"
                      hideLabel={false}
                      hideValidationIcon={true}
                    />
                  )}
                </View>
              </View>
            )}

            {/* Дата и время */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                gap: 12,
              }}>
              <Text style={{fontSize: 16, fontWeight: '600', color: '#000'}}>
                {t('Date and time')}
              </Text>

              <View style={{gap: 12}}>
                <DatePickerInput
                  value={formData.start_date || formData.work_date}
                  onChange={val =>
                    handleInputChange(
                      formData.date_type === 'period'
                        ? 'start_date'
                        : 'work_date',
                      val,
                    )
                  }
                  placeholder="18.08.2024"
                  size="md"
                  width="100%"
                  hideLabel={true}
                />

                <TimeInput
                  value={formData.start_time || formData.work_time}
                  onChange={val =>
                    handleInputChange(
                      formData.date_type === 'period'
                        ? 'start_time'
                        : 'work_time',
                      val,
                    )
                  }
                  placeholder="15:00"
                  size="md"
                  width="100%"
                  hideLabel={true}
                />

                <DatePickerInput
                  value={formData.end_date}
                  onChange={val => handleInputChange('end_date', val)}
                  placeholder="28.08.2024"
                  size="md"
                  width="100%"
                  hideLabel={true}
                />

                <TimeInput
                  value={formData.end_time}
                  onChange={val => handleInputChange('end_time', val)}
                  placeholder="12:00"
                  size="md"
                  width="100%"
                  hideLabel={true}
                />
              </View>
            </View>

            {/* Адрес */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                gap: 12,
              }}>
              <Text style={{fontSize: 16, fontWeight: '600', color: '#000'}}>
                {t('Step 7')}
              </Text>

              <StandardInput
                label={t('City')}
                value={formData.city}
                onChange={val => handleInputChange('city', val)}
                placeholder={t('Enter city name')}
                size="md"
                width="100%"
                hideLabel={false}
                hideValidationIcon={true}
                error={errors?.find(e => e.path === 'city')?.message || null}
              />

              <StandardInput
                label={t('Address')}
                value={formData.address}
                onChange={val => handleInputChange('address', val)}
                placeholder={t('Enter street address')}
                size="md"
                width="100%"
                hideLabel={false}
                hideValidationIcon={true}
                error={errors?.find(e => e.path === 'address')?.message || null}
              />

              <StandardInput
                label={t('Full address (optional)')}
                value={formData.full_address}
                onChange={val => handleInputChange('full_address', val)}
                placeholder={t('Full address with details')}
                size="md"
                width="100%"
                hideLabel={false}
                hideValidationIcon={true}
              />

              {/* Мини карта */}
              <View style={{height: 120, borderRadius: 8, overflow: 'hidden'}}>
                {hasMapApiKey ? (
                  <MapView
                    provider={PROVIDER_DEFAULT}
                    style={{flex: 1}}
                    initialRegion={{
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}>
                    <Marker
                      coordinate={{
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                      }}
                    />
                  </MapView>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#F5F5F5',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#E0E0E0',
                    }}>
                    <Text style={{fontSize: 14, color: '#8A94A0'}}>
                      {t('Map preview')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Комментарий для исполнителя */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                gap: 12,
              }}>
              <Text style={{fontSize: 16, fontWeight: '600', color: '#000'}}>
                {t('Comments for performer')}
              </Text>

              <View style={{gap: 4}}>
                <Text style={{fontSize: 12, color: '#8A94A0'}}>
                  {t('Comment')}
                </Text>
                <TextArea
                  value={formData.description}
                  onChange={val => handleInputChange('description', val)}
                  placeholder=""
                  size="md"
                  width="100%"
                  style={{minHeight: 80}}
                />
              </View>
            </View>
          </View>
        )}

        {step === 7 && (
          <View style={{width: '100%', rowGap: 16}}>
            {/* Заголовок */}
            <View style={{gap: 8, marginBottom: 24}}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: styles.colors.primary,
                  lineHeight: 27,
                }}>
                {t('Final details')}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '400',
                  color: '#8A94A0',
                  lineHeight: 24,
                }}>
                {t('Add a title and specify the location for your order')}
              </Text>
            </View>
            {console.log('🎯 Rendering step 7!')}
            <StandardInput
              value={formData.name}
              onChange={val => handleInputChange('name', val)}
              placeholder={t('Order Title')}
              size="md"
              width="100%"
              error={errors?.find(e => e.path === 'name')?.message || null}
            />

            <TextArea
              value={formData.description}
              onChange={val => handleInputChange('description', val)}
              placeholder={t('Description')}
              size="md"
              width="100%"
              error={
                errors?.find(e => e.path === 'description')?.message || null
              }
            />

            <StandardInput
              mode="numeric"
              value={formData.maximum_price}
              onChange={val => handleInputChange('maximum_price', val)}
              placeholder={t('Maximum price, AED')}
              size="md"
              width="100%"
              error={
                errors?.find(e => e.path === 'maximum_price')?.message || null
              }
            />

            {/* Список прикрепленных файлов */}
            <AttachmentsList
              attachments={safeAttachments}
              title={t('Attachments')}
              showAddButton={true}
              onAddPress={pickFile}
              onRemove={removeFile}
              onView={viewFile}
              onDownload={downloadFile}
              containerStyle={{marginVertical: 20}}
            />

            <StandardButton
              title={submitting ? t('Creating...') : t('Create order')}
              action={handleCreateOrder}
              style={{marginTop: 20}}
              disabled={submitting}
            />
          </View>
        )}
      </ScrollView>

      {/* Кнопка Далее для шагов выбора */}
      {(step === 1 && formData.category) ||
      (step === 2 && formData.subcategory) ||
      step === 3 ||
      step === 4 ||
      step === 5 ||
      step === 6 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: styles.colors.background,
            padding: styles.paddingHorizontal,
            paddingBottom: 40,
          }}>
          <StandardButton
            title={t('Next')}
            action={() => {
              if (step === 1) {
                setStep(2);
              } else if (step === 2) {
                setStep(3);
              } else if (step === 3) {
                setStep(4);
              } else if (step === 4) {
                // Валидация для шага Address
                if (!formData.city?.trim()) {
                  Alert.alert(t('Error'), t('City is required'));
                  return;
                }
                if (!formData.address?.trim()) {
                  Alert.alert(t('Error'), t('Address is required'));
                  return;
                }
                setStep(5);
              } else if (step === 5) {
                // Валидация для шага Date
                if (formData.date_type === 'single') {
                  // Для одиночной даты проверяем только work_date и work_time
                  if (!formData.work_date?.trim()) {
                    Alert.alert(t('Error'), t('Work date is required'));
                    return;
                  }
                  if (!formData.work_time?.trim()) {
                    Alert.alert(t('Error'), t('Work time is required'));
                    return;
                  }
                } else if (formData.date_type === 'period') {
                  // Для периода проверяем только start_date, start_time, end_date, end_time
                  if (!formData.start_date?.trim()) {
                    Alert.alert(t('Error'), t('Start date is required'));
                    return;
                  }
                  if (!formData.start_time?.trim()) {
                    Alert.alert(t('Error'), t('Start time is required'));
                    return;
                  }
                  if (!formData.end_date?.trim()) {
                    Alert.alert(t('Error'), t('End date is required'));
                    return;
                  }
                  if (!formData.end_time?.trim()) {
                    Alert.alert(t('Error'), t('End time is required'));
                    return;
                  }
                }
                setStep(6);
              } else if (step === 6) {
                setStep(7);
              }
            }}
          />
        </View>
      ) : null}

      {/* Модальный экран галереи */}
      <GalleryModal
        visible={isGalleryModalVisible}
        onClose={closeGalleryModal}
        onSelect={selectGalleryFiles}
        selectedFiles={selectedGalleryFiles}
        onFileToggle={toggleGalleryFile}
        attachments={galleryFiles}
        onAddFile={loadGalleryAndDocuments}
        hasRequiredFileTypes={hasRequiredFileTypes}
      />
    </View>
  );
}
