import React, {useState} from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
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

import AttachmentsList from '../components/AttachmentsList';
import CustomerReviewModal from '../Modals/CustomerReviewModal';

import useOrderWorker from '../hooks/useOrderWorker';
import config from '../config';
import {formatPrice} from '../utils/orderUtils';
import {LoadingComponent} from './Loading';

export default function OrderPerformer({navigation, route}) {
  const {t} = useTranslation();
  const {orderId} = route.params || {};
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const screenWidth = Dimensions.get('window').width;

  const {
    orderData,
    loading,
    error,
    menuVisible,
    menuAnimation,
    contactsViewed,
    processingAction,
    orderStatuses,
    getStatusColor,
    respondToOrder,
    withdrawResponse,
    sendExecutorContacts,
    takeOrder,
    rejectOrder,
    completeOrder,
    refuseOrder,
    archiveOrder,
    viewContacts,
    showMenu,
    hideMenu,
    openLink,
    retry,
    viewFile,
    downloadFile,
    customerReviewModalVisible,
    submitCustomerReview,
    openCustomerReviewModal,
    closeCustomerReviewModal,
    canReviewCustomer,
  } = useOrderWorker(navigation, orderId);

  // Функция для форматирования даты в YYYY-MM-DD
  const formatDate = dateString => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString;
    }
  };

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

  // Фильтруем изображения и документы
  const imageFiles = orderData?.files?.filter(isImageFile) || [];
  const documentFiles =
    orderData?.files?.filter(file => !isImageFile(file)) || [];

  // Компонент карусели изображений
  const renderImageCarousel = () => {
    if (imageFiles.length === 0) return null;

    const renderImageItem = ({item, index}) => {
      const imageUrl = getImageUrl(item);

      return (
        <View key={index} style={{width: screenWidth}}>
          <TouchableOpacity
            style={{
              width: '100%',
              height: 200,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#F5F5F5',
            }}
            onPress={() => viewFile(item)}>
            {imageUrl ? (
              <Image
                source={{uri: imageUrl}}
                style={{
                  width: '100%',
                  height: '100%',
                  resizeMode: 'cover',
                }}
                onError={error => {
                  console.log('Image load error:', error.nativeEvent.error);
                }}
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#F5F5F5',
                }}>
                <Ionicons name="image-outline" size={40} color="#CCCCCC" />
              </View>
            )}
          </TouchableOpacity>
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
      <View style={{marginBottom: 16, width: '100%'}}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '500',
            color: '#1A1A1A',
            marginBottom: 12,
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

  const renderDetailsContent = () => (
    <View style={{gap: 24, width: '100%'}}>
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
          {orderData?.max_amount
            ? formatPrice(orderData.max_amount)
            : t('Not specified')}
        </Text>
      </View>

      {/* Тип работ */}
      <View>
        <Text
          style={{
            fontFamily: 'Inter',
            fontWeight: '500',
            fontSize: 16,
            color: '#323232',
            marginBottom: 12,
          }}>
          {t('Work type')}
        </Text>

        {orderData?.work_direction_label && (
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
                color: '#323232',
                flex: 1,
              }}>
              {orderData.work_direction_label}
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
                  color: '#8A94A0',
                }}>
                {t('Type')} 1
              </Text>
            </View>
          </View>
        )}

        {orderData?.work_type_label &&
          orderData?.work_type_label !== orderData?.work_direction_label && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                paddingHorizontal: 16,
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
                  color: '#323232',
                  flex: 1,
                }}>
                {orderData.work_type_label}
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
                    color: '#8A94A0',
                  }}>
                  {t('Type')} 2
                </Text>
              </View>
            </View>
          )}
      </View>

      {/* Дата и время */}
      {(orderData?.work_date || orderData?.start_date) && (
        <View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: 16,
              color: '#323232',
              marginBottom: 12,
            }}>
            {t('Date and time')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 11,
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
                  color: '#8A94A0',
                }}>
                {t('Work date')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Адрес */}
      {orderData?.address && (
        <View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: 16,
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
              paddingHorizontal: 16,
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
                color: '#323232',
                flex: 1,
              }}>
              {orderData.address}
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
                  color: '#8A94A0',
                }}>
                {t('Address')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Комментарий для исполнителя */}
      {orderData?.description && (
        <View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: 16,
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
              paddingHorizontal: 16,
              gap: 8,
              width: '100%',
              minHeight: 49,
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
                  color: '#8A94A0',
                }}>
                {t('Comment')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Документы */}
      {documentFiles.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#1A1A1A',
              marginBottom: 12,
            }}>
            {t('Documents')} ({documentFiles.length})
          </Text>
          <AttachmentsList
            attachments={documentFiles}
            onView={viewFile}
            onDownload={downloadFile}
            showBorder={true}
          />
        </View>
      )}

      {/* Карточка заказчика */}
      {renderCustomerCard()}

      {/* Контакты заказчика или кнопка отправки контактов */}
      {renderContactsSection()}
    </View>
  );

  const renderCustomerCard = () => {
    if (!orderData?.author) return null;

    const author = orderData.author;
    const customerName = author.name || t('Customer');
    const customerAvatar = author.avatar;

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
          {t('Customer')}
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
            console.log('Customer card pressed');
            console.log('orderData.author:', orderData?.author);
            console.log('orderData.author.id:', orderData?.author?.id);
            if (orderData?.author?.id) {
              console.log(
                'OrderWorker: Navigating to CustomerProfile with customerId:',
                orderData.author.id,
              );
              console.log('OrderWorker: Customer contacts from order:', {
                phone: orderData.author.phone,
                email: orderData.author.email,
                telegram: orderData.author.telegram,
                whatsApp: orderData.author.whatsApp,
                facebook: orderData.author.facebook,
                viber: orderData.author.viber,
              });
              navigation.navigate('CustomerProfile', {
                customerId: orderData.author.id,
                customerContacts: {
                  phone: orderData.author.phone,
                  email: orderData.author.email,
                  telegram: orderData.author.telegram,
                  whatsApp: orderData.author.whatsApp,
                  facebook: orderData.author.facebook,
                  viber: orderData.author.viber,
                },
                // Передаем информацию о том, откликнулся ли исполнитель
                hasResponded: orderData.hasResponded,
                contactsAvailable: orderData.contacts_available,
                // Передаем статус отклика для проверки доступности контактов
                responseStatus: orderData?.additional?.response?.status || 0,
              });
            } else {
              console.log('No author ID found');
            }
          }}>
          {customerAvatar ? (
            <Image
              source={{
                uri: `${config.baseUrl}${customerAvatar}`.replace('//', '/'),
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
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
          )}

          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#000000',
                marginBottom: 4,
              }}>
              {customerName}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text
                style={{
                  marginLeft: 4,
                  fontSize: 14,
                  color: '#000000',
                  marginRight: 12,
                }}>
                {author.customer_rating &&
                typeof author.customer_rating === 'number'
                  ? author.customer_rating.toFixed(0)
                  : '0'}
              </Text>

              <Ionicons name="people" size={16} color="#8A94A0" />
              <Text
                style={{
                  marginLeft: 4,
                  fontSize: 14,
                  color: '#8A94A0',
                }}>
                {author.customer_reviews_count || 0} {t('reviews')}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#8A94A0" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCustomerContacts = () => {
    if (!orderData?.author) return null;

    const author = orderData.author;
    const contacts = {
      phone: author.phone || '',
      email: author.email || '',
      telegram: author.telegram || '',
      whatsapp: author.whatsApp || '',
      facebook: author.facebook || '',
      viber: author.viber || '',
    };

    // Фильтруем только заполненные контакты
    const availableContacts = Object.entries(contacts).filter(
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
          {t('Customer contact')}
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
                paddingVertical: 8,
              }}
              onPress={() => {
                if (type === 'phone') {
                  Linking.openURL(`tel:${value}`);
                } else if (type === 'email') {
                  Linking.openURL(`mailto:${value}`);
                } else if (type === 'telegram') {
                  Linking.openURL(`https://t.me/${value.replace('@', '')}`);
                } else if (type === 'whatsapp') {
                  Linking.openURL(
                    `https://wa.me/${value.replace(/[^0-9]/g, '')}`,
                  );
                } else if (type === 'facebook') {
                  Linking.openURL(`https://facebook.com/${value}`);
                } else if (type === 'viber') {
                  Linking.openURL(`viber://chat?number=${value}`);
                }
              }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F0F0F0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
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
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#323232',
                    marginBottom: 2,
                  }}>
                  {type === 'phone'
                    ? t('Phone')
                    : type === 'email'
                    ? t('Email')
                    : type === 'telegram'
                    ? 'Telegram'
                    : type === 'whatsapp'
                    ? 'WhatsApp'
                    : type === 'facebook'
                    ? 'Facebook'
                    : type === 'viber'
                    ? 'Viber'
                    : type}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#8A94A0',
                  }}>
                  {value}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#8A94A0" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderContactsSection = () => {
    if (!orderData?.author) return null;

    // Получаем информацию о текущем отклике исполнителя из additional.response
    const currentResponse = orderData?.additional?.response;

    if (!currentResponse) return null;

    const responseStatus = currentResponse.status;

    // Если заказчик еще не отправил контакты (status < 2)
    if (responseStatus < 2) {
      return (
        <View style={{marginTop: 16}}>
          <View
            style={{
              backgroundColor: '#FFF3CD',
              borderRadius: 8,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#FFC107',
            }}>
            <Text
              style={{
                fontSize: 14,
                color: '#856404',
                fontWeight: '500',
              }}>
              {t('Waiting for customer contacts')}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#856404',
                marginTop: 4,
              }}>
              {t('Customer needs to send their contacts first')}
            </Text>
          </View>
        </View>
      );
    }

    // Если заказчик отправил контакты, но исполнитель еще не отправил свои (status === 2)
    if (responseStatus === 2) {
      return (
        <View style={{marginTop: 16}}>
          {/* Кнопка для отправки своих контактов */}
          <TouchableOpacity
            style={{
              backgroundColor: styles.colors.primary,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={() => sendExecutorContacts()}>
            <Text
              style={{
                color: styles.colors.white,
                fontSize: 16,
                fontWeight: '600',
              }}>
              {t('Send my contacts')}
            </Text>
          </TouchableOpacity>

          {/* Сообщение о том, что контакты будут видны после обмена */}
          <View
            style={{
              backgroundColor: '#E3F2FD',
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#2196F3',
            }}>
            <Text
              style={{
                fontSize: 13,
                color: '#1565C0',
                textAlign: 'center',
              }}>
              {t(
                'Contacts will be visible after both parties exchange contacts',
              )}
            </Text>
          </View>
        </View>
      );
    }

    // Если контакты обменены (status >= 3), показываем контакты заказчика
    if (responseStatus >= 3) {
      return renderCustomerContacts();
    }

    return null;
  };

  const renderPerformerPanel = () => {
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
        {/* Статус 0 - Поиск исполнителя */}
        {orderData.status === 0 && (
          <View>
            {!orderData?.hasResponded ? (
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
                onPress={() => respondToOrder()}>
                <Text
                  style={{
                    color: styles.colors.white,
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}>
                  {t('Respond')}
                </Text>
              </TouchableOpacity>
            ) : // Проверяем статус отклика для правильного отображения кнопки
            orderData?.additional?.response?.status === 3 ? (
              // Контакты обменены, но заказчик еще не выбрал исполнителя
              <View
                style={{
                  width: '100%',
                  padding: 10,
                  backgroundColor: '#FFF3CD',
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#FFC107',
                }}>
                <Text
                  style={{
                    color: '#856404',
                    fontWeight: '500',
                    fontSize: 16,
                    textAlign: 'center',
                  }}>
                  {t('Waiting for customer to select you')}
                </Text>
              </View>
            ) : (
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
                onPress={() => withdrawResponse()}>
                <Text
                  style={{
                    color: styles.colors.red,
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}>
                  {t('Withdraw response')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Статус 3 - Исполнитель выбран, можно взять в работу */}
        {orderData.status === 3 && orderData?.hasResponded && (
          <TouchableOpacity
            style={{
              width: '100%',
              padding: 15,
              backgroundColor: styles.colors.primary,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: styles.colors.primary,
            }}
            onPress={() => takeOrder()}>
            <Text
              style={{
                color: styles.colors.white,
                fontWeight: 'bold',
                fontSize: 16,
              }}>
              {t('Take order')}
            </Text>
          </TouchableOpacity>
        )}

        {orderData.status === 2 && (
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity
              style={{
                width: '48%',
                padding: 10,
                backgroundColor: styles.colors.primary,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: styles.colors.primary,
              }}
              onPress={() => takeOrder()}>
              <Text
                style={{
                  color: styles.colors.white,
                  fontSize: 14,
                  fontWeight: 'bold',
                }}>
                {t('Take to work')}
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
              onPress={() => rejectOrder()}>
              <Text
                style={{
                  color: styles.colors.red,
                  fontSize: 14,
                  fontWeight: 'bold',
                }}>
                {t('Reject')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {orderData.status === 4 && (
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 10,
                backgroundColor: styles.colors.primary,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: styles.colors.primary,
              }}
              onPress={() => completeOrder()}>
              <Text
                style={{
                  color: styles.colors.white,
                  fontWeight: 'bold',
                  fontSize: 14,
                }}>
                {t('Complete')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                padding: 10,
                backgroundColor: 'transparent',
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: styles.colors.red,
              }}
              onPress={() => refuseOrder()}>
              <Text
                style={{
                  color: styles.colors.red,
                  fontWeight: 'bold',
                  fontSize: 14,
                }}>
                {t('Refuse')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {orderData.status === 5 && (
          <View style={{gap: 12, alignItems: 'center'}}>
            <Text
              style={{
                fontSize: 14,
                color: styles.colors.black,
                textAlign: 'center',
              }}>
              {t('Order completed awaiting confirmation')}
            </Text>

            <View style={{flexDirection: 'row', gap: 12, width: '100%'}}>
              {canReviewCustomer && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: styles.colors.primary,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: styles.colors.primary,
                  }}
                  onPress={() => openCustomerReviewModal()}>
                  <Text
                    style={{
                      color: styles.colors.white,
                      fontWeight: '500',
                      fontSize: 14,
                    }}>
                    {t('Rate customer')}
                  </Text>
                </TouchableOpacity>
              )}

              {!orderData?.executor_archived && !canReviewCustomer && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: 'transparent',
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: styles.colors.gray,
                  }}
                  onPress={() => archiveOrder()}>
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
          </View>
        )}

        {/* Статус 7 - Заказ закрыт, можно оставить отзыв о заказчике */}
        {orderData.status === 7 && (
          <View style={{gap: 12}}>
            <Text
              style={{
                fontSize: 14,
                color: styles.colors.green,
                textAlign: 'center',
                fontWeight: '500',
              }}>
              {t('Order completed successfully')}
            </Text>

            {canReviewCustomer && (
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
                onPress={() => openCustomerReviewModal()}>
                <Text
                  style={{
                    color: styles.colors.white,
                    fontWeight: '500',
                    fontSize: 14,
                  }}>
                  {t('Rate customer')}
                </Text>
              </TouchableOpacity>
            )}
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
            style={{paddingVertical: 10, paddingHorizontal: 20}}
            onPress={() => {
              hideMenu();
              navigation.navigate('Support');
            }}>
            <Text style={{fontSize: 16, color: styles.colors.black}}>
              {t('Help')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

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

  if (!orderData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: styles.colors.background,
          padding: 20,
        }}>
        <Ionicons
          name="document-outline"
          size={50}
          color={styles.colors.gray}
        />
        <Text
          style={{
            marginTop: 10,
            color: styles.colors.black,
            textAlign: 'center',
          }}>
          {t('No order data available')}
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: styles.colors.primary,
            borderRadius: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: styles.colors.primary,
          }}
          onPress={retry}>
          <Text style={{color: styles.colors.white, fontWeight: 'bold'}}>
            {t('Try again')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: styles.colors.background,
          padding: 20,
        }}>
        <Ionicons
          name="alert-circle-outline"
          size={50}
          color={styles.colors.red}
        />
        <Text
          style={{
            marginTop: 10,
            color: styles.colors.black,
            textAlign: 'center',
            marginBottom: 20,
          }}>
          {error}
        </Text>
        <TouchableOpacity
          style={{
            padding: 10,
            backgroundColor: styles.colors.primary,
            borderRadius: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: styles.colors.primary,
          }}
          onPress={retry}>
          <Text style={{color: styles.colors.white, fontWeight: 'bold'}}>
            {t('Try again')}
          </Text>
        </TouchableOpacity>
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
        title={orderData.title || t('Order details')}
        menu
        menuAction={showMenu}
      />
      <ScrollView
        style={{width: '100%', height: '100%'}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          rowGap: styles.paddingHorizontal,
          paddingHorizontal: styles.paddingHorizontal,
          paddingBottom: 150,
        }}>
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text style={{fontSize: 16, color: styles.colors.black}}>
            № {orderData.id}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: getStatusColor(orderData.status),
              fontWeight: 'bold',
            }}>
            {orderStatuses[orderData.status]}
          </Text>
        </View>

        <View style={{width: '100%', flex: 1}}>
          {renderImageCarousel()}
          {renderDetailsContent()}
        </View>
      </ScrollView>

      {renderMenu()}
      {orderData && renderPerformerPanel()}

      {/* Модальное окно для отзыва о заказчике */}
      <CustomerReviewModal
        visible={customerReviewModalVisible}
        onClose={closeCustomerReviewModal}
        customerData={orderData?.author}
        orderData={orderData}
        onSubmit={submitCustomerReview}
      />
    </View>
  );
}
