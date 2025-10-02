import React, {useState, useRef} from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Linking,
} from 'react-native';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HeaderBack from '../headers/HeaderBack';
import Text from '../components/Text';
import TextField from '../components/TextField';
import TextArea from '../components/TextArea';
import AttachmentsList from '../components/AttachmentsList';
import ExecutorReviewModal from '../Modals/ExecutorReviewModal';
import useOrder from '../hooks/useOrder';
import {formatPrice} from '../utils/orderUtils';
import config, {getAvatarUrl} from '../config';
import {LoadingComponent} from './Loading';

export default function Order({navigation, route}) {
  const {orderId} = route.params || {};
  const {t} = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Функция для форматирования даты в YYYY-MM-DD
  const formatDate = dateString => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString; // Возвращаем исходную строку если не удалось распарсить
    }
  };

  const {
    orderData,
    activeTab,
    setActiveTab,
    loading,
    menuVisible,
    menuAnimation,
    reviewModalVisible,
    rating,
    setRating,
    reviewText,
    setReviewText,
    orderStatuses,
    getStatusColor,
    sendContacts,
    choosePerformer,
    rejectResponse,
    changePerformer,
    rejectPerformer,
    acceptOrder,
    rejectOrder,
    archiveOrderByCustomer,
    returnToSearch,
    completeOrderSuccess,
    completeOrderWithIssues,
    cancelOrder,
    completeOrderByCustomer,
    submitReview,
    closeReviewModal,
    executorReviewModalVisible,
    submitExecutorReview,
    closeExecutorReviewModal,
    showMenu,
    hideMenu,
    viewFile,
    downloadFile,
    canReviewExecutor,
  } = useOrder(navigation, orderId);

  const getStatusInfo = status => {
    // Определяем цвет и текст статуса (соответствует backend enum)
    switch (status) {
      case 0: // SearchExecutor
        return {
          color: '#34C759',
          backgroundColor: '#E8F5E8',
          text: t('Searching for performer'),
        };
      case 1: // Cancelled
        return {
          color: '#8E8E93',
          backgroundColor: '#F2F2F7',
          text: t('Cancelled'),
        };
      case 2: // SelectingExecutor
        return {
          color: '#FF9500',
          backgroundColor: '#FFF3E0',
          text: t('Selecting executor'),
        };
      case 3: // ExecutorSelected
        return {
          color: '#007AFF',
          backgroundColor: '#E3F2FD',
          text: t('Executor selected'),
        };
      case 4: // InWork
        return {
          color: '#5856D6',
          backgroundColor: '#F3F2FF',
          text: t('In work'),
        };
      case 5: // AwaitingConfirmation
        return {
          color: '#FF9500',
          backgroundColor: '#FFF3E0',
          text: t('Awaiting confirmation'),
        };
      case 6: // Rejected
        return {
          color: '#FF3B30',
          backgroundColor: '#FFEBEE',
          text: t('Rejected'),
        };
      case 7: // Closed
        return {
          color: '#34C759',
          backgroundColor: '#E8F5E8',
          text: t('Completed'),
        };
      case 8: // Completed (если используется)
        return {
          color: '#34C759',
          backgroundColor: '#E8F5E8',
          text: t('Completed'),
        };
      // Статусы посредника
      case 10: // MediatorStep1
        return {
          color: '#55A3FF',
          backgroundColor: '#E3F2FD',
          text: t('Mediator: Clarifying details'),
        };
      case 11: // MediatorStep2
        return {
          color: '#FD79A8',
          backgroundColor: '#FCE4EC',
          text: t('Mediator: Executor search'),
        };
      case 12: // MediatorStep3
        return {
          color: '#FDCB6E',
          backgroundColor: '#FFF8E1',
          text: t('Mediator: Project execution'),
        };
      case 13: // MediatorArchived
        return {
          color: '#636E72',
          backgroundColor: '#F5F5F5',
          text: t('Mediator: Archived'),
        };
      default:
        return {
          color: '#8E8E93',
          backgroundColor: '#F2F2F7',
          text: t('Unknown'),
        };
    }
  };

  const statusInfo = getStatusInfo(orderData?.status);

  // Получение ширины экрана
  const screenWidth = Dimensions.get('window').width;

  // Функция для определения, является ли файл изображением
  const isImageFile = file => {
    if (!file) return false;

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

    // Проверяем по расширению из path или name
    let extension = '';
    if (file.path) {
      extension = file.path.toLowerCase().split('.').pop()?.split('?')[0] || '';
    } else if (file.name) {
      extension = file.name.toLowerCase().split('.').pop() || '';
    }

    return imageExtensions.includes(extension);
  };

  // Получаем URL изображения с правильным базовым URL
  const getImageUrl = file => {
    if (!file) return null;

    if (file.uri) return file.uri;

    // Базовый URL backend без /api
    const backendUrl = config.baseUrl.replace('/api', '');

    if (file.url) {
      if (file.url.startsWith('http')) {
        return file.url;
      } else {
        // Добавляем backend URL к относительным путям
        return file.url.startsWith('/')
          ? `${backendUrl}${file.url}`
          : `${backendUrl}/${file.url}`;
      }
    }

    if (file.path) {
      // Для path тоже добавляем backend URL
      return `${backendUrl}/storage/${file.path}`;
    }

    return null;
  };

  // Фильтруем изображения
  const imageFiles = orderData?.files?.filter(isImageFile) || [];
  const documentFiles =
    orderData?.files?.filter(file => !isImageFile(file)) || [];

  // Компонент карусели изображений
  const renderImageCarousel = () => {
    if (imageFiles.length === 0) return null;

    const renderImageItem = ({item, index}) => {
      const imageUrl = getImageUrl(item);

      return (
        <View style={{width: screenWidth}}>
          <View style={{marginHorizontal: 16}}>
            <TouchableOpacity
              onPress={() => viewFile(imageUrl, item.name, 'image')}
              style={{
                height: 200,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
              }}>
              <Image
                source={{uri: imageUrl}}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}>
                <Text style={{color: 'white', fontSize: 12}} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    const renderPaginationDots = () => {
      if (imageFiles.length <= 1) return null;

      return (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 12,
            marginBottom: 8,
          }}>
          {imageFiles.map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  index === currentImageIndex ? '#3579F5' : '#E0E0E0',
                marginHorizontal: 3,
              }}
            />
          ))}
        </View>
      );
    };

    const onScroll = event => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / screenWidth);
      setCurrentImageIndex(index);
    };

    return (
      <View style={{marginBottom: 16}}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '500',
            color: '#1A1A1A',
            marginBottom: 12,
            paddingHorizontal: 16,
          }}>
          {t('Images')} ({imageFiles.length})
        </Text>
        <FlatList
          data={imageFiles}
          renderItem={renderImageItem}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={screenWidth}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
        />
        {renderPaginationDots()}
      </View>
    );
  };

  const renderDetails = () => (
    <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
      {/* Карусель изображений */}
      {renderImageCarousel()}

      <View style={{padding: 16, gap: 24}}>
        {/* Статус */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            paddingHorizontal: 20,
            gap: 12,
            backgroundColor: statusInfo.backgroundColor,
            borderRadius: 8,
          }}>
          <View
            style={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 7,
            }}>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                lineHeight: 16,
                color: '#323232',
              }}>
              {t('Status')}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 13,
                lineHeight: 13,
                color: statusInfo.color,
              }}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Стоимость работ */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text style={{color: '#323232', fontSize: 16, fontWeight: '500'}}>
            {t('Cost of work')}
          </Text>
          <Text style={{color: '#000000', fontSize: 16, fontWeight: '500'}}>
            {formatPrice(orderData?.max_amount)}
          </Text>
        </View>

        {/* Тип работ */}
        <View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: 16,
              lineHeight: 16,
              color: '#323232',
              marginBottom: 12,
            }}>
            {t('Work type')}
          </Text>

          {/* Type 1 - Horizontal tab по стилям Фигмы */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 11,
              paddingHorizontal: 20,
              gap: 8,
              width: '100%',
              height: 49,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#EBEBEB',
              borderRadius: 16,
              marginBottom: 12,
              position: 'relative',
            }}>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                lineHeight: 24,
                letterSpacing: -0.006,
                color: '#323232',
                flex: 1,
              }}>
              {orderData?.work_direction_label || orderData?.work_direction}
            </Text>

            {/* Type 1 Label */}
            <View
              style={{
                position: 'absolute',
                top: -10.5,
                left: 14,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 6,
                gap: 10,
                height: 24,
                backgroundColor: '#FFFFFF',
                borderRadius: 42,
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 11,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#8A94A0',
                }}>
                {t('Type')} 1
              </Text>
            </View>
          </View>

          {/* Type 2 */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 11,
              paddingHorizontal: 20,
              gap: 8,
              width: '100%',
              height: 49,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#EBEBEB',
              borderRadius: 16,
              marginBottom: 12,
              position: 'relative',
            }}>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                lineHeight: 24,
                letterSpacing: -0.006,
                color: '#323232',
                flex: 1,
              }}>
              {orderData?.work_type_label || orderData?.work_type}
            </Text>

            <View
              style={{
                position: 'absolute',
                top: -10.5,
                left: 14,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 6,
                gap: 10,
                height: 24,
                backgroundColor: '#FFFFFF',
                borderRadius: 42,
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 11,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#8A94A0',
                }}>
                {t('Type')} 2
              </Text>
            </View>
          </View>

          {orderData?.work_type !== orderData?.work_direction && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData?.work_type_label || orderData?.work_type}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Type')} 3
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Детали */}
        <View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: 16,
              lineHeight: 16,
              color: '#323232',
              marginBottom: 12,
            }}>
            {t('Details')}
          </Text>

          {orderData?.housing_type && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.housing_type_label || orderData.housing_type}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Housing type')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.housing_condition && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.housing_condition_label ||
                  orderData.housing_condition}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Housing condition')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.housing_preparation_level && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.housing_preparation_level_label ||
                  orderData.housing_preparation_level}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Preparation level')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.bathroom_type && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.bathroom_type_label || orderData.bathroom_type}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Bathroom type')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.ceiling_height && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.ceiling_height} м
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Ceiling height')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.total_area && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.total_area} {t('sq.m.')}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Total area')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Дата и время */}
        <View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: 16,
              lineHeight: 16,
              color: '#323232',
              marginBottom: 12,
            }}>
            {t('Date and time')}
          </Text>

          {(orderData?.work_date || orderData?.start_date) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.work_date
                  ? `${formatDate(orderData.work_date)}${
                      orderData.work_time ? `, ${t(orderData.work_time)}` : ''
                    }`
                  : orderData.start_date
                  ? `${formatDate(orderData.start_date)}${
                      orderData.start_time ? `, ${t(orderData.start_time)}` : ''
                    } - ${formatDate(orderData.end_date)}${
                      orderData.end_time ? `, ${t(orderData.end_time)}` : ''
                    }`
                  : ''}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Work date')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.work_time && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {t(orderData.work_time)}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Work time')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.start_date && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {formatDate(orderData.start_date)}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Start date')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.start_time && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {t(orderData.start_time)}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Start time')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.end_date && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {formatDate(orderData.end_date)}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('End date')}
                </Text>
              </View>
            </View>
          )}

          {orderData?.end_time && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                marginBottom: 12,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {t(orderData.end_time)}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('End time')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Адрес */}
        <View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: 16,
              lineHeight: 16,
              color: '#323232',
              marginBottom: 12,
            }}>
            {t('Address')}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 11,
              paddingHorizontal: 20,
              gap: 8,
              width: '100%',
              height: 49,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#EBEBEB',
              borderRadius: 16,
              marginBottom: 12,
              position: 'relative',
            }}>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                lineHeight: 24,
                letterSpacing: -0.006,
                color: '#323232',
                flex: 1,
              }}>
              {orderData?.address || orderData?.full_address}
            </Text>

            <View
              style={{
                position: 'absolute',
                top: -10.5,
                left: 14,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 6,
                gap: 10,
                height: 24,
                backgroundColor: '#FFFFFF',
                borderRadius: 42,
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 11,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#8A94A0',
                }}>
                {t('Address')}
              </Text>
            </View>
          </View>

          {/* Заглушка карты */}
          <View
            style={{
              height: 200,
              backgroundColor: '#F0F0F0',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Ionicons name="location" size={40} color="#8E8E93" />
            <Text style={{color: '#8E8E93', fontSize: 16, marginTop: 8}}>
              {t('Map')}
            </Text>
          </View>
        </View>

        {/* Комментарий для исполнителя */}
        {orderData?.description && (
          <View>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                lineHeight: 16,
                color: '#323232',
                marginBottom: 12,
              }}>
              {t('Comment for executor')}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 20,
                gap: 8,
                width: '100%',
                height: 94,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                position: 'relative',
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '500',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.006,
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.description}
              </Text>

              <View
                style={{
                  position: 'absolute',
                  top: -10.5,
                  left: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  gap: 10,
                  height: 24,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 42,
                }}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 11,
                    lineHeight: 24,
                    letterSpacing: -0.006,
                    color: '#8A94A0',
                  }}>
                  {t('Comment')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Блок с информацией об исполнителе */}
        {renderExecutorCard()}

        {/* Блок с контактами исполнителя */}
        {renderExecutorContactsBlock()}
      </View>
    </ScrollView>
  );

  const renderExecutorCard = () => {
    if (!orderData?.selectedPerformer) return null;

    const executor = orderData.selectedPerformer;
    const executorName = executor.name || t('Executor');

    return (
      <View>
        <Text
          style={{
            fontFamily: 'Inter',
            fontWeight: '500',
            fontSize: 16,
            color: '#323232',
            marginBottom: 12,
          }}>
          {t('Executor')}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#EBEBEB',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: 'rgba(213, 213, 213, 0.25)',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 1,
            shadowRadius: 16.9,
            elevation: 5,
          }}
          onPress={() => {
            if (executor.id) {
              navigation.navigate('WorkerProfile', {
                executorId: executor.id,
                fromOrder: true,
                orderId: orderId,
              });
            }
          }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#CCCCCC',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </View>

          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#000000',
                marginBottom: 4,
              }}>
              {executorName}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={{fontSize: 13, color: '#8A94A0'}}>
                  {executor.rating || '0'}
                </Text>
              </View>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <Ionicons name="people" size={14} color="#8A94A0" />
                <Text style={{fontSize: 13, color: '#8A94A0'}}>
                  {executor.reviews_count || '0'} {t('reviews')}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderExecutorContactsBlock = () => {
    if (!orderData?.selectedPerformer || orderData?.status < 3) return null;

    // Проверяем что контакты были отправлены заказчиком
    const selectedResponse = orderData?.responses?.find(
      response => response.executor?.id === orderData.selectedPerformer.id,
    );

    if (!selectedResponse || selectedResponse.status < 2) {
      return null; // Контакты еще не обменены
    }

    // Получаем контакты исполнителя из additional.executor_contacts
    const contacts = orderData?.additional?.executor_contacts;

    if (!contacts) return null;

    const contactsData = {
      phone: contacts?.phone || '',
      email: contacts?.email || '',
      telegram: contacts?.telegram || '',
      whatsapp: contacts?.whatsApp || '',
      facebook: contacts?.facebook || '',
      viber: contacts?.viber || '',
    };

    // Фильтруем только заполненные контакты
    const availableContacts = Object.entries(contactsData).filter(
      ([key, value]) => value && value.trim() !== '',
    );

    if (availableContacts.length === 0) return null;

    return (
      <View>
        <Text
          style={{
            fontFamily: 'Inter',
            fontWeight: '500',
            fontSize: 16,
            color: '#323232',
            marginBottom: 12,
          }}>
          {t('Executor contact')}
        </Text>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#EBEBEB',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 16,
            shadowColor: 'rgba(213, 213, 213, 0.25)',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 1,
            shadowRadius: 16.9,
            elevation: 5,
            gap: 12,
          }}>
          {availableContacts.map(([type, value]) => (
            <TouchableOpacity
              key={type}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
              }}
              onPress={() => openLink(type, value)}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F0F0F0',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Ionicons
                  name={
                    type === 'phone'
                      ? 'call'
                      : type === 'email'
                      ? 'mail'
                      : type === 'telegram'
                      ? 'send'
                      : type === 'whatsapp'
                      ? 'logo-whatsapp'
                      : type === 'facebook'
                      ? 'logo-facebook'
                      : type === 'viber'
                      ? 'chatbox'
                      : 'person'
                  }
                  size={20}
                  color={styles.colors.primary}
                />
              </View>
              <View style={{flex: 1}}>
                <Text
                  style={{fontSize: 14, fontWeight: '500', color: '#323232'}}>
                  {type === 'phone'
                    ? t('Phone')
                    : type === 'email'
                    ? t('Email')
                    : type === 'telegram'
                    ? t('Telegram')
                    : type === 'whatsapp'
                    ? t('WhatsApp')
                    : type === 'facebook'
                    ? t('Facebook')
                    : type === 'viber'
                    ? t('Viber')
                    : type}
                </Text>
                <Text style={{fontSize: 13, color: '#8A94A0'}}>{value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderResponses = () => {
    const responses = orderData?.responses || [];
    const orderStatus = orderData?.status;

    // Скрываем responses если заказ в работе, завершен или ожидает подтверждения
    // Статусы: 4 - InWork, 5 - AwaitingConfirmation, 7 - Closed, 8 - Completed
    const shouldHideResponses = [4, 5, 7, 8].includes(orderStatus);

    if (shouldHideResponses) {
      return null; // Не отображаем responses
    }

    // Фильтруем отклоненные отклики (статус 1) из счетчика
    const activeResponses = responses.filter(response => response.status !== 1);

    if (responses.length === 0) {
      return (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 20,
          }}>
          <Text style={{fontSize: 16, color: styles.colors.gray}}>
            {t('No responses yet')}
          </Text>
        </View>
      );
    }

    return (
      <View style={{width: '100%', rowGap: 20, paddingHorizontal: 16}}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '500',
            color: styles.colors.black,
          }}>
          {t('Responses')} ({activeResponses.length})
        </Text>
        {responses.map(response => renderResponseCard(response))}
      </View>
    );
  };

  const renderResponseCard = response => {
    const executor = response.executor || response.user || {};
    // Удалена переменная avatar, используем прямую проверку
    const name = executor.name || t('Unknown performer');
    const ordersCount = executor.orders_count || 0;
    const rating = executor.average_rating || executor.rating || 0;
    const reviewsCount = executor.reviews_count || 0;
    const userType = executor.type || 0; // 0 = executor, 2 = mediator

    // Определяем статус отклика
    // status: 0 - новый отклик, 1 - отклонен, 2 - заказчик отправил контакты, 3 - оба отправили контакты, 4 - исполнитель выбран
    const isRejected = response.status === 1; // Отклик отклонен
    const contactsSent = response.status >= 3 && !isRejected; // Теперь кнопка доступна только после обмена контактами и если не отклонен
    const performerSelected = response.status >= 4;

    return (
      <View
        key={response.id}
        style={{
          width: '100%',
          padding: 16,
          backgroundColor: styles.colors.white,
          borderRadius: 8,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: styles.colors.border,
        }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={() => {
            navigation.navigate('WorkerProfile', {
              executorId: executor.id,
              responseStatus: response.status,
              fromOrder: true,
              orderId: orderId,
              responseId: response.id,
            });
          }}
          activeOpacity={0.7}>
          {executor.avatar ? (
            <Image
              source={{uri: getAvatarUrl(executor.avatar)}}
              style={{width: 50, height: 50, borderRadius: 25, marginRight: 10}}
            />
          ) : (
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#CCCCCC',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <Ionicons name="person" size={24} color={styles.colors.white} />
            </View>
          )}
          <View style={{flex: 1}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: styles.colors.black,
                  flex: 1,
                }}>
                {name}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#8A94A0" />
            </View>
            <Text style={{fontSize: 14, color: styles.colors.gray}}>
              {t('Orders')}: {ordersCount}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.floor(rating) ? 'star' : 'star-outline'}
                  size={16}
                  color={styles.colors.yellow}
                />
              ))}
              <Text
                style={{
                  fontSize: 14,
                  color: styles.colors.gray,
                  marginLeft: 5,
                }}>
                ({reviewsCount})
              </Text>
            </View>

            {/* Отображение информации о посреднике */}
            {userType === 2 && (
              <View
                style={{
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 6,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}>
                  <Ionicons
                    name="business"
                    size={14}
                    color={styles.colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: styles.colors.primary,
                      marginLeft: 4,
                    }}>
                    {t('Mediator Services')}
                  </Text>
                </View>

                {executor.mediator_margin_percentage && (
                  <Text style={{fontSize: 12, color: '#666', marginBottom: 2}}>
                    {t('Commission')}: {executor.mediator_margin_percentage}%
                  </Text>
                )}

                {executor.mediator_fixed_fee && (
                  <Text style={{fontSize: 12, color: '#666', marginBottom: 2}}>
                    {t('Fixed Fee')}: ${executor.mediator_fixed_fee}
                  </Text>
                )}

                {executor.mediator_agreed_price && (
                  <Text style={{fontSize: 12, color: '#666'}}>
                    {t('Contract Price')}: {executor.mediator_agreed_price} AED
                  </Text>
                )}
              </View>
            )}
            {contactsSent && (
              <Text
                style={{
                  fontSize: 12,
                  color: styles.colors.green,
                  marginTop: 5,
                }}>
                {t('Contacts sent')}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {response.status === 0 ? (
          // Показываем кнопки для отправки контактов и отклонения
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity
              style={{
                width: '65%',
                padding: 10,
                backgroundColor: styles.colors.primary,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: styles.colors.primary,
              }}
              onPress={() => sendContacts(response.id)}>
              <Text style={{color: styles.colors.white, fontWeight: '500'}}>
                {t('Send contacts')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '30%',
                padding: 10,
                backgroundColor: styles.colors.white,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: styles.colors.red,
              }}
              onPress={() => rejectResponse(response.id)}>
              <Text style={{color: styles.colors.red, fontWeight: '500'}}>
                {t('Reject')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : response.status === 2 ? (
          // Заказчик отправил контакты, ждем контакты от исполнителя
          <View
            style={{
              backgroundColor: '#E3F2FD',
              borderRadius: 8,
              padding: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#2196F3',
            }}>
            <Text
              style={{
                fontSize: 14,
                color: '#1565C0',
                textAlign: 'center',
                fontWeight: '500',
              }}>
              {t('Waiting for executor to send their contacts')}
            </Text>
          </View>
        ) : !performerSelected && !isRejected ? (
          // Контакты отправлены, показываем кнопку выбора исполнителя (если не отклонен)
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity
              style={{
                width: '65%',
                padding: 10,
                backgroundColor: styles.colors.green,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: styles.colors.green,
              }}
              onPress={() => choosePerformer(response.id)}>
              <Text style={{color: styles.colors.white, fontWeight: '500'}}>
                {t('Choose performer')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '30%',
                padding: 10,
                backgroundColor: styles.colors.white,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: styles.colors.red,
              }}
              onPress={() => rejectResponse(response.id)}>
              <Text style={{color: styles.colors.red, fontWeight: '500'}}>
                {t('Reject')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isRejected ? (
          // Отклик отклонен
          <View style={{alignItems: 'center', paddingVertical: 10}}>
            <Text
              style={{
                fontSize: 14,
                color: styles.colors.red,
                fontWeight: '500',
              }}>
              {t('Response rejected')}
            </Text>
          </View>
        ) : (
          // Исполнитель выбран
          <View style={{alignItems: 'center', paddingVertical: 10}}>
            <Text
              style={{
                fontSize: 14,
                color: styles.colors.green,
                fontWeight: '500',
              }}>
              {t('Performer selected')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderMenu = () => (
    <Modal
      transparent
      visible={menuVisible}
      animationType="none"
      onRequestClose={hideMenu}>
      <TouchableOpacity
        activeOpacity={1}
        style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}}
        onPress={hideMenu}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 60,
            right: 15,
            backgroundColor: styles.colors.white,
            borderRadius: 8,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            transform: [
              {
                translateY: menuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: menuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
            opacity: menuAnimation,
          }}>
          <TouchableOpacity
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              opacity: orderData?.status > 2 ? 0.5 : 1,
            }}
            onPress={() => {
              if (
                orderData?.status === 0 ||
                orderData?.status === 1 ||
                orderData?.status === 2
              ) {
                hideMenu();
                navigation.navigate('OrderEdit', {orderId: orderData?.id});
              }
            }}>
            <Text style={{fontSize: 16, color: styles.colors.black}}>
              {t('Edit order')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              opacity:
                orderData?.status === 4 ||
                orderData?.status === 5 ||
                orderData?.status === 6 ||
                orderData?.status === 7
                  ? 0.5
                  : 1,
            }}
            onPress={() => {
              if (
                orderData?.status !== 4 &&
                orderData?.status !== 5 &&
                orderData?.status !== 6 &&
                orderData?.status !== 7
              ) {
                hideMenu();
                cancelOrder();
              }
            }}>
            <Text style={{fontSize: 16, color: styles.colors.red}}>
              {t('Cancel order')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  const renderExecutorContacts = () => {
    if (!orderData?.selectedPerformer || orderData?.status < 3) return null;

    // Проверяем что контакты были отправлены заказчиком (status >= 2 - ContactReceived)
    // и исполнитель отправил свои контакты (status >= 3 - ContactOpenedByExecutor)
    const selectedResponse = orderData?.responses?.find(
      response => response.executor_id === orderData.selectedPerformer.id,
    );

    if (!selectedResponse || selectedResponse.status < 3) {
      return null; // Исполнитель еще не отправил свои контакты
    }

    // Получаем контакты исполнителя из additional.executor_contacts
    const contacts = orderData?.additional?.executor_contacts;
    const performer = orderData.selectedPerformer;

    console.log('Order: renderExecutorContacts', {
      performer,
      contacts,
      status: orderData.status,
    });

    const contactsData = {
      phone: contacts?.phone || '',
      email: contacts?.email || '',
      telegram: contacts?.telegram || '',
      whatsapp: contacts?.whatsApp || '',
      facebook: contacts?.facebook || '',
      viber: contacts?.viber || '',
    };

    // Фильтруем только заполненные контакты
    const availableContacts = Object.entries(contactsData).filter(
      ([key, value]) => value && value.trim() !== '',
    );

    if (availableContacts.length === 0) return null;

    return (
      <View style={{paddingHorizontal: 16, paddingBottom: 100}}>
        <Text
          style={{
            fontFamily: 'Inter',
            fontWeight: '500',
            fontSize: 16,
            color: '#323232',
            marginBottom: 12,
          }}>
          {t('Executor contact')}
        </Text>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            padding: 16,
            shadowColor: '#D4D4D4',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.25,
            shadowRadius: 16.9,
            elevation: 8,
          }}>
          {availableContacts.map(([type, value]) => {
            let iconName = 'call';
            let onPress = () => {};

            switch (type) {
              case 'phone':
                iconName = 'call';
                onPress = () => Linking.openURL(`tel:${value}`);
                break;
              case 'email':
                iconName = 'mail';
                onPress = () => Linking.openURL(`mailto:${value}`);
                break;
              case 'telegram':
                iconName = 'paper-plane';
                onPress = () => {
                  const telegram = value.replace('@', '');
                  Linking.openURL(`https://t.me/${telegram}`);
                };
                break;
              case 'whatsapp':
                iconName = 'logo-whatsapp';
                onPress = () => {
                  const whatsapp = value.replace(/\D/g, '');
                  Linking.openURL(`https://wa.me/${whatsapp}`);
                };
                break;
              case 'facebook':
                iconName = 'logo-facebook';
                onPress = () => {
                  const facebook = value.startsWith('http')
                    ? value
                    : `https://facebook.com/${value}`;
                  Linking.openURL(facebook);
                };
                break;
              case 'viber':
                iconName = 'chatbubble';
                onPress = () => {
                  const viber = value.replace(/\D/g, '');
                  Linking.openURL(`viber://chat?number=${viber}`);
                };
                break;
            }

            return (
              <TouchableOpacity
                key={type}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth:
                    availableContacts[availableContacts.length - 1][0] === type
                      ? 0
                      : 1,
                  borderBottomColor: '#F0F0F0',
                }}
                onPress={onPress}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#E7EFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name={iconName} size={20} color="#3579F5" />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: '500',
                      fontSize: 14,
                      color: '#323232',
                      marginBottom: 2,
                    }}>
                    {t(type.charAt(0).toUpperCase() + type.slice(1))}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: '400',
                      fontSize: 14,
                      color: '#8A94A0',
                    }}>
                    {type === 'telegram' ? `@${value.replace('@', '')}` : value}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8A94A0" />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPerformerPanel = () => {
    const hasExecutor = orderData?.executor_id || orderData?.selectedPerformer;
    if (orderData?.status === 1 || orderData?.status === 0 || !hasExecutor)
      return null;

    return (
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: styles.colors.white,
          padding: 15,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -2},
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
        {orderData?.status === 2 && (
          <TouchableOpacity
            style={{
              width: '100%',
              padding: 10,
              backgroundColor: styles.colors.primary,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: styles.colors.primary,
            }}
            onPress={changePerformer}>
            <Text style={{color: styles.colors.white, fontWeight: '500'}}>
              {t('Choose another performer')}
            </Text>
          </TouchableOpacity>
        )}
        {orderData?.status === 3 && (
          <TouchableOpacity
            style={{
              width: '100%',
              padding: 10,
              backgroundColor: styles.colors.white,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: styles.colors.red,
            }}
            onPress={rejectPerformer}>
            <Text style={{color: styles.colors.red, fontWeight: '500'}}>
              {t('Reject performer')}
            </Text>
          </TouchableOpacity>
        )}

        {orderData?.status === 4 && (
          <View style={{gap: 12}}>
            <TouchableOpacity
              style={{
                width: '100%',
                padding: 12,
                backgroundColor: styles.colors.white,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: styles.colors.red,
              }}
              onPress={returnToSearch}>
              <Text style={{color: styles.colors.red, fontWeight: '500'}}>
                {t('Return to search')}
              </Text>
            </TouchableOpacity>

            <View style={{flexDirection: 'row', gap: 12}}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: styles.colors.green,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: styles.colors.green,
                }}
                onPress={completeOrderSuccess}>
                <Text style={{color: styles.colors.white, fontWeight: '500'}}>
                  {t('Complete order')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: styles.colors.white,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: styles.colors.warning,
                }}
                onPress={completeOrderWithIssues}>
                <Text style={{color: styles.colors.warning, fontWeight: '500'}}>
                  {t('Complete with issues')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {orderData?.status === 5 && (
          <View>
            {/* Если исполнитель завершил, а заказчик нет - показываем Accept/Reject */}
            {orderData?.completed_by_executor &&
              !orderData?.completed_by_customer && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <TouchableOpacity
                    style={{
                      width: '48%',
                      padding: 10,
                      backgroundColor: styles.colors.green,
                      borderRadius: 8,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: styles.colors.green,
                    }}
                    onPress={acceptOrder}>
                    <Text
                      style={{color: styles.colors.white, fontWeight: '500'}}>
                      {t('Accept')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      width: '48%',
                      padding: 10,
                      backgroundColor: styles.colors.white,
                      borderRadius: 8,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: styles.colors.red,
                    }}
                    onPress={rejectOrder}>
                    <Text style={{color: styles.colors.red, fontWeight: '500'}}>
                      {t('Reject')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* Если заказчик завершил, а исполнитель нет - показываем кнопку архивирования */}
            {orderData?.completed_by_customer &&
              !orderData?.completed_by_executor && (
                <View style={{alignItems: 'center'}}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: styles.colors.black,
                      textAlign: 'center',
                      marginBottom: 12,
                    }}>
                    {t('Waiting for executor confirmation')}
                  </Text>
                  {!orderData?.customer_archived && !canReviewExecutor && (
                    <TouchableOpacity
                      style={{
                        width: '100%',
                        padding: 10,
                        backgroundColor: 'transparent',
                        borderRadius: 8,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: styles.colors.gray,
                      }}
                      onPress={archiveOrderByCustomer}>
                      <Text
                        style={{
                          color: styles.colors.gray,
                          fontWeight: '500',
                          fontSize: 14,
                        }}>
                        {t('Move to Archive')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
          </View>
        )}
      </View>
    );
  };

  const renderReviewModal = () => {
    return (
      <Modal transparent visible={reviewModalVisible} animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={closeReviewModal}>
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: '90%',
              backgroundColor: styles.colors.white,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '500',
                color: styles.colors.black,
                marginBottom: 12,
                textAlign: 'center',
              }}>
              {t('Order successfully closed!')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: styles.colors.gray,
                marginBottom: 24,
                textAlign: 'center',
              }}>
              {t('Please rate the performer and leave a review')}
            </Text>

            {/* Карточка исполнителя */}
            <View
              style={{
                width: '100%',
                padding: 20,
                backgroundColor: styles.colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: styles.colors.border,
                marginBottom: 32,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {orderData?.selectedPerformer?.avatar ? (
                  <Image
                    source={{
                      uri: getAvatarUrl(orderData.selectedPerformer.avatar),
                    }}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      marginRight: 12,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: '#CCCCCC',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                    <Ionicons
                      name="person"
                      size={24}
                      color={styles.colors.white}
                    />
                  </View>
                )}
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: styles.colors.black,
                    }}>
                    {orderData?.selectedPerformer?.name ||
                      t('Loading performer data...')}
                  </Text>
                  <Text style={{fontSize: 14, color: styles.colors.gray}}>
                    {t('Orders')}: {orderData?.selectedPerformer?.orders || 0}
                  </Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={
                          i <
                          Math.floor(orderData?.selectedPerformer?.rating || 0)
                            ? 'star'
                            : 'star-outline'
                        }
                        size={16}
                        color={styles.colors.yellow}
                      />
                    ))}
                    <Text
                      style={{
                        fontSize: 14,
                        color: styles.colors.gray,
                        marginLeft: 5,
                      }}>
                      ({orderData?.selectedPerformer?.reviews_count || 0})
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Оценка звездами */}
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 32,
                justifyContent: 'center',
              }}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i + 1)}
                  style={{padding: 8}}>
                  <Ionicons
                    name={i < rating ? 'star' : 'star-outline'}
                    size={32}
                    color={styles.colors.yellow}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Поле ввода отзыва */}
            <TextArea
              value={reviewText}
              onChange={setReviewText}
              placeholder={t('Your review')}
              size="md"
              width="100%"
            />

            <View style={{height: 16}} />

            {/* Кнопка отправить */}
            <TouchableOpacity
              style={{
                width: '100%',
                paddingVertical: 18,
                paddingHorizontal: 24,
                backgroundColor:
                  rating > 0 ? styles.colors.primary : styles.colors.gray,
                borderRadius: 12,
                alignItems: 'center',
                opacity: rating > 0 ? 1 : 0.6,
              }}
              onPress={submitReview}
              disabled={rating === 0}>
              <Text
                style={{
                  color: styles.colors.white,
                  fontWeight: '600',
                  fontSize: 16,
                }}>
                {t('Submit')}
              </Text>
            </TouchableOpacity>

            {/* Подсказка об обязательности рейтинга */}
            {rating === 0 && (
              <Text
                style={{
                  fontSize: 12,
                  color: styles.colors.gray,
                  textAlign: 'center',
                  marginTop: 16,
                }}>
                {t('Please rate the performer to continue')}
              </Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading || !orderData) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>{t('Loading...')}</Text>
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
      <HeaderBack
        action={() => navigation.goBack()}
        title={orderData?.title || t('Order Details')}
        menu
        menuAction={showMenu}
      />
      <ScrollView
        style={{width: '100%', height: '100%'}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 300,
        }}>
        {/* Tabs - Button group согласно стилям Фигмы */}
        <View
          style={{
            marginTop: 16,
            marginBottom: 20,
            paddingHorizontal: 16,
          }}>
          {(() => {
            // Проверяем, нужно ли скрывать responses
            const orderStatus = orderData?.status;
            const shouldHideResponses = [4, 5, 7, 8].includes(orderStatus);

            // Если responses скрыты, показываем только Details
            if (shouldHideResponses) {
              return;
            }

            // Показываем обычные вкладки
            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  padding: 2,
                  width: '100%',
                  height: 44,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#F1F1F1',
                  borderRadius: 36,
                }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 10,
                    paddingHorizontal: 16,
                    gap: 8,
                    height: 40,
                    backgroundColor:
                      activeTab === 'details' ? '#3579F5' : '#FFFFFF',
                    borderRadius: activeTab === 'details' ? 50 : 6,
                    flex: 1,
                  }}
                  onPress={() => setActiveTab('details')}>
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: '500',
                      fontSize: 14,
                      lineHeight: 20,
                      color: activeTab === 'details' ? '#FFFFFF' : '#343434',
                    }}>
                    {t('Details')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 10,
                    paddingHorizontal: 16,
                    gap: 8,
                    height: 40,
                    backgroundColor:
                      activeTab === 'responses' ? '#3579F5' : '#FFFFFF',
                    borderRadius: activeTab === 'responses' ? 50 : 6,
                    flex: 1,
                  }}
                  onPress={() => setActiveTab('responses')}>
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: '500',
                      fontSize: 14,
                      lineHeight: 20,
                      color: activeTab === 'responses' ? '#FFFFFF' : '#343434',
                    }}>
                    {t('Responses')} (
                    {orderData?.responses?.filter(
                      response => response.status !== 1,
                    ).length || 0}
                    )
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
        {(() => {
          const orderStatus = orderData?.status;
          const shouldHideResponses = [4, 5, 7, 8].includes(orderStatus);

          // Если responses скрыты, всегда показываем Details
          if (shouldHideResponses) {
            return renderDetails();
          }

          // Обычная логика вкладок
          return activeTab === 'details' ? renderDetails() : renderResponses();
        })()}

        {/* Контакты исполнителя в конце экрана */}
      </ScrollView>
      {renderMenu()}
      {renderPerformerPanel()}
      {renderReviewModal()}

      {/* Модальное окно для отзыва об исполнителе */}
      <ExecutorReviewModal
        visible={executorReviewModalVisible}
        onClose={closeExecutorReviewModal}
        executorData={orderData?.executor}
        orderData={orderData}
        onSubmit={submitExecutorReview}
      />
    </View>
  );
}
