import React, {useState, useEffect} from 'react';
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
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HeaderBack from '../headers/HeaderBack';
import Text from '../components/Text';
import AttachmentsList from '../components/AttachmentsList';
import config from '../config';
import {formatPrice} from '../utils/orderUtils';
import {api, retryApiCall} from '../services';
import {notifyError, notifySuccess} from '../services/notify';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {LoadingComponent} from './Loading';

export default function MediatorOrderPreview({navigation, route}) {
  const {t} = useTranslation();
  const {orderId, orderData: initialOrderData} = route.params || {};
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [takingOrder, setTakingOrder] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(0));

  const screenWidth = Dimensions.get('window').width;

  const orderStatuses = {
    0: t('Searching for performer'),
    1: t('Cancelled'),
    2: t('Selecting executor'),
    3: t('Contacts sent'),
    4: t('In work'),
    5: t('Awaiting confirmation'),
    6: t('Rejected'),
    7: t('Closed'),
    8: t('Completed'),
  };

  const getStatusColor = status => {
    switch (status) {
      case 0:
        return styles.colors.primary;
      case 1:
        return styles.colors.red;
      case 2:
        return styles.colors.warning;
      case 3:
        return styles.colors.info;
      case 4:
        return styles.colors.success;
      case 5:
        return styles.colors.warning;
      case 6:
        return styles.colors.red;
      case 7:
        return styles.colors.gray;
      case 8:
        return styles.colors.green;
      default:
        return styles.colors.gray;
    }
  };

  // Всегда загружаем свежие детали заказа с сервера
  const loadOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await retryApiCall(() =>
        api.orders.ordersDetail(orderId),
      );
      if (response.success) {
        setOrderData(response.result);
      } else {
        notifyError(t('Error'), t('Failed to load order details'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      notifyError(t('Error'), t('Failed to load order details'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  // Взять заказ в работу как посредник
  const takeOrder = async () => {
    setTakingOrder(true);
    try {
      const response = await api.mediator.takeOrder(orderId);
      if (response.success) {
        notifySuccess(t('Order taken successfully'));
        navigation.replace('MediatorOrderSteps', {orderId});
      } else {
        notifyError(t('Error'), response.message || t('Failed to take order'));
      }
    } catch (error) {
      console.error('Error taking order:', error);
      notifyError(t('Error'), t('Failed to take order'));
    } finally {
      setTakingOrder(false);
    }
  };

  const confirmTakeOrder = () => {
    Alert.alert(
      t('Take Order'),
      t('Are you sure you want to take this order as mediator?') +
        `\n\n${t('Potential Commission')}: ${formatPrice(
          orderData.potential_commission || 0,
        )}`,
      [
        {text: t('Cancel'), style: 'cancel'},
        {text: t('Take'), onPress: takeOrder},
      ],
    );
  };

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
      // Если URL уже полный (содержит http), используем как есть
      if (file.url.startsWith('http')) {
        return file.url;
      } else {
        // Если URL относительный, добавляем базовый URL
        return file.url.startsWith('/')
          ? `${backendUrl}${file.url}`
          : `${backendUrl}/${file.url}`;
      }
    }

    if (file.path) {
      // Для path добавляем backend URL
      return `${backendUrl}/storage/${file.path}`;
    }

    return null;
  };

  // Функции для работы с файлами
  const getFileTypeFromUrl = url => {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      svg: 'image/svg+xml',
    };
    return {
      mimeType: mimeTypes[extension] || 'image/jpeg',
      ext: mimeTypes[extension] ? extension : 'jpg',
    };
  };

  const viewFile = async (fileUri, fileName) => {
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

  const showMenu = () => {
    setMenuVisible(true);
    Animated.timing(menuAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const renderImageCarousel = () => {
    if (!orderData?.files) return null;

    const imageFiles = orderData.files.filter(isImageFile);

    if (imageFiles.length === 0) return null;

    return (
      <View
        style={{
          width: '100%',
          height: 200,
          backgroundColor: '#F5F5F5',
          borderRadius: 16,
          marginBottom: 16,
          overflow: 'hidden',
        }}>
        <FlatList
          data={imageFiles}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={event => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / screenWidth,
            );
            setCurrentImageIndex(index);
          }}
          renderItem={({item: file}) => (
            <TouchableOpacity
              style={{
                width: screenWidth - 32,
                height: 200,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => viewFile(getImageUrl(file), file.name)}>
              <Image
                source={{uri: getImageUrl(file)}}
                style={{width: '100%', height: '100%'}}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
        />

        {imageFiles.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}>
            {imageFiles.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    index === currentImageIndex
                      ? styles.colors.white
                      : 'rgba(255, 255, 255, 0.5)',
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDetailsContent = () => {
    if (!orderData) return null;

    return (
      <View style={{gap: 16}}>
        {/* Описание */}
        {orderData.description && (
          <View>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                color: '#323232',
                marginBottom: 12,
              }}>
              {t('Description')}
            </Text>
            <View
              style={{
                padding: 16,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
              }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontWeight: '400',
                  fontSize: 16,
                  lineHeight: 24,
                  color: '#323232',
                }}>
                {orderData.description}
              </Text>
            </View>
          </View>
        )}

        {/* Стоимость работ */}
        <View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: 16,
              color: '#323232',
              marginBottom: 12,
            }}>
            {t('Cost of work')}
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
              {formatPrice(orderData.max_amount)}
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
                {t('Budget')}
              </Text>
            </View>
          </View>
        </View>

        {/* Комиссия посредника */}
        {orderData.potential_commission && (
          <View>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                color: '#323232',
                marginBottom: 12,
              }}>
              {t('Potential Commission')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 11,
                gap: 8,
                width: '100%',
                height: 49,
                backgroundColor: '#E8F5E8',
                borderWidth: 1,
                borderColor: '#4CAF50',
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
                  color: '#4CAF50',
                  flex: 1,
                }}>
                {formatPrice(orderData.potential_commission)}
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
                  {t('Your Commission')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Дата работы */}
        {(orderData.work_date || orderData.start_date) && (
          <View>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                color: '#323232',
                marginBottom: 12,
              }}>
              {t('Work date')}
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
        {(orderData.address || orderData.full_address) && (
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
                {orderData.full_address || orderData.address}
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

        {/* Детали жилья */}
        {(orderData.housing_type ||
          orderData.housing_condition ||
          orderData.total_area ||
          orderData.ceiling_height) && (
          <View>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: 16,
                color: '#323232',
                marginBottom: 12,
              }}>
              {t('Housing Details')}
            </Text>
            <View
              style={{
                padding: 16,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                gap: 12,
              }}>
              {orderData.housing_type && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#8A94A0', fontSize: 14}}>
                    {t('Housing Type')}
                  </Text>
                  <Text
                    style={{color: '#323232', fontSize: 14, fontWeight: '500'}}>
                    {orderData.housing_type_label || orderData.housing_type}
                  </Text>
                </View>
              )}
              {orderData.housing_condition && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#8A94A0', fontSize: 14}}>
                    {t('Condition')}
                  </Text>
                  <Text
                    style={{color: '#323232', fontSize: 14, fontWeight: '500'}}>
                    {orderData.housing_condition_label ||
                      orderData.housing_condition}
                  </Text>
                </View>
              )}
              {orderData.housing_preparation_level && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#8A94A0', fontSize: 14}}>
                    {t('Preparation')}
                  </Text>
                  <Text
                    style={{color: '#323232', fontSize: 14, fontWeight: '500'}}>
                    {orderData.housing_preparation_level_label ||
                      orderData.housing_preparation_level}
                  </Text>
                </View>
              )}
              {orderData.bathroom_type && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#8A94A0', fontSize: 14}}>
                    {t('Bathroom')}
                  </Text>
                  <Text
                    style={{color: '#323232', fontSize: 14, fontWeight: '500'}}>
                    {orderData.bathroom_type_label || orderData.bathroom_type}
                  </Text>
                </View>
              )}
              {orderData.total_area && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#8A94A0', fontSize: 14}}>
                    {t('Area')}
                  </Text>
                  <Text
                    style={{color: '#323232', fontSize: 14, fontWeight: '500'}}>
                    {orderData.total_area} {t('sq.m')}
                  </Text>
                </View>
              )}
              {orderData.ceiling_height && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{color: '#8A94A0', fontSize: 14}}>
                    {t('Ceiling Height')}
                  </Text>
                  <Text
                    style={{color: '#323232', fontSize: 14, fontWeight: '500'}}>
                    {orderData.ceiling_height}m
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Информация о заказчике */}
        {orderData.author && (
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EBEBEB',
                borderRadius: 16,
                gap: 12,
              }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: styles.colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}>
                {orderData.author.avatar ? (
                  <Image
                    source={{
                      uri:
                        config.baseUrl.replace('/api', '') +
                        orderData.author.avatar,
                    }}
                    style={{width: 50, height: 50}}
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={24}
                    color={styles.colors.white}
                  />
                )}
              </View>
              <View style={{flex: 1}}>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize: 16,
                    color: '#323232',
                    marginBottom: 4,
                  }}>
                  {orderData.author.name}
                </Text>
                {orderData.author.customer_rating && (
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Ionicons
                      name="star"
                      size={14}
                      color={styles.colors.warning}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#8A94A0',
                        marginLeft: 4,
                      }}>
                      {orderData.author.customer_rating} (
                      {orderData.author.customer_reviews_count || 0}{' '}
                      {t('reviews')})
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Файлы */}
        {orderData.files && orderData.files.length > 0 && (
          <View>
            <AttachmentsList
              files={orderData.files}
              onFilePress={file => {
                const fileUrl = getImageUrl(file);
                if (fileUrl) {
                  viewFile(fileUrl, file.name);
                }
              }}
            />
          </View>
        )}
      </View>
    );
  };

  const renderMediatorPanel = () => {
    if (!orderData) return null;

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
        <TouchableOpacity
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: styles.colors.primary,
            borderRadius: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: styles.colors.primary,
          }}
          onPress={confirmTakeOrder}
          disabled={takingOrder}>
          {takingOrder ? (
            <ActivityIndicator color={styles.colors.white} />
          ) : (
            <Text
              style={{
                color: styles.colors.white,
                fontWeight: '500',
                fontSize: 16,
              }}>
              {t('Take Order as Mediator')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{flex: 1, backgroundColor: styles.colors.background}}>
        <HeaderBack
          title={t('Order Details')}
          action={() => navigation.goBack()}
        />
        <LoadingComponent text={t('Loading...')} />
      </View>
    );
  }

  if (!orderData) {
    return (
      <View style={{flex: 1, backgroundColor: styles.colors.background}}>
        <HeaderBack
          title={t('Order Details')}
          action={() => navigation.goBack()}
        />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: styles.colors.red}}>{t('Order not found')}</Text>
        </View>
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

      {renderMediatorPanel()}
    </View>
  );
}
