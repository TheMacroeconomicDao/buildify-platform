import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  PanResponder,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from '../styles';

const {width} = Dimensions.get('window');
const itemSize = (width - 48 - 20) / 3; // 3 колонки с отступами

const GalleryModal = ({
  visible,
  onClose,
  onSelect,
  selectedFiles = [],
  onFileToggle,
  attachments = [],
  onAddFile,
  hasRequiredFileTypes = () => true,
}) => {
  const {t} = useTranslation();
  const [activeTab, setActiveTab] = useState('images'); // 'images' или 'documents'

  // PanResponder для обработки свайпа вниз
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Активируем при любом движении вниз больше 5 пикселей
      return gestureState.dy > 5;
    },
    onPanResponderGrant: () => {
      // Начало жеста
    },
    onPanResponderMove: (evt, gestureState) => {
      // Можно добавить визуальную обратную связь здесь
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Если свайп вниз достаточно большой или быстрый, закрываем модалку
      const {dy, vy} = gestureState;
      if (dy > 50 || vy > 0.5) {
        onClose();
      }
    },
    onPanResponderTerminate: () => {
      // Жест был прерван
    },
  });

  // Фильтруем файлы по типу
  const images = attachments.filter(
    file =>
      file.type === 'image' ||
      (file.type && file.type.startsWith('image/')) ||
      (file.uri &&
        (file.uri.includes('.jpg') ||
          file.uri.includes('.png') ||
          file.uri.includes('.jpeg'))),
  );

  const documents = attachments.filter(
    file =>
      file.type === 'document' ||
      (file.type && !file.type.startsWith('image/')) ||
      (file.name &&
        (file.name.includes('.pdf') ||
          file.name.includes('.doc') ||
          file.name.includes('.docx') ||
          file.name.includes('.xls') ||
          file.name.includes('.xlsx') ||
          file.name.includes('.ppt') ||
          file.name.includes('.pptx') ||
          file.name.includes('.txt') ||
          file.name.includes('.zip') ||
          file.name.includes('.rar'))),
  );

  const currentData = activeTab === 'images' ? images : documents;
  const selectedCount = selectedFiles.length;
  const canProceed = selectedCount > 0 && hasRequiredFileTypes(selectedFiles);

  const renderAddButton = () => (
    <TouchableOpacity
      style={{
        width: itemSize,
        height: itemSize,
        marginRight: 10,
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        borderWidth: 2,
        borderColor: '#CCCCCC',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={onAddFile}>
      <Ionicons name="add" size={40} color="#CCCCCC" />
      <Text
        style={{
          fontSize: 12,
          color: '#999',
          marginTop: 4,
          textAlign: 'center',
        }}>
        {t('Add')}
      </Text>
    </TouchableOpacity>
  );

  const renderFileItem = ({item, index}) => {
    const isSelected = selectedFiles.some(file => file.id === item.id);

    if (
      item.type === 'image' ||
      (item.type && item.type.startsWith('image/')) ||
      (item.uri &&
        (item.uri.includes('.jpg') ||
          item.uri.includes('.png') ||
          item.uri.includes('.jpeg')))
    ) {
      return (
        <TouchableOpacity
          style={{
            width: itemSize,
            height: itemSize,
            marginRight: index % 3 !== 2 ? 10 : 0,
            marginBottom: 10,
            borderRadius: 8,
            overflow: 'hidden',
            borderWidth: isSelected ? 3 : 0,
            borderColor: styles.colors.primary,
          }}
          onPress={() => onFileToggle(item)}>
          <Image
            source={{uri: item.uri}}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
            }}
            resizeMode="cover"
          />
          {isSelected && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: styles.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={{
          width: itemSize,
          height: itemSize,
          marginRight: index % 3 !== 2 ? 10 : 0,
          marginBottom: 10,
          borderRadius: 8,
          backgroundColor: '#f0f0f0',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: isSelected ? 3 : 0,
          borderColor: styles.colors.primary,
        }}
        onPress={() => onFileToggle(item)}>
        <Ionicons name="document" size={40} color="#999" />
        <Text
          style={{
            fontSize: 12,
            color: '#666',
            marginTop: 4,
            textAlign: 'center',
          }}>
          {item.name}
        </Text>
        {isSelected && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: styles.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      {/* Затемненный фон */}
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
        activeOpacity={1}
        onPress={onClose}>
        {/* Bottom Sheet */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}} // Предотвращаем закрытие при нажатии на содержимое
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '80%',
            minHeight: '60%',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: -6},
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 20,
          }}>
          {/* Полоска для свайпа */}
          <View
            {...panResponder.panHandlers}
            style={{
              alignItems: 'center',
              paddingTop: 8,
              paddingBottom: 16,
              paddingHorizontal: 50, // Увеличиваем область для тача
            }}>
            <View
              style={{
                width: 34,
                height: 4,
                backgroundColor: '#CCCCCC',
                borderRadius: 2,
              }}
            />
          </View>

          {/* Хедер */}
          <View
            {...panResponder.panHandlers}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '500',
                color: '#000',
                marginLeft: 12,
              }}>
              {t('Gallery')}
            </Text>
          </View>

          {/* Подзаголовок */}
          <View style={{paddingHorizontal: 16, paddingVertical: 16}}>
            <Text
              style={{
                fontSize: 16,
                color: '#8A94A0',
                lineHeight: 24,
              }}>
              {t('Select the necessary photo or drawing')}
            </Text>
          </View>

          {/* Переключатель типов файлов */}
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 16,
              marginBottom: 20,
            }}>
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 20,
                backgroundColor:
                  activeTab === 'images' ? styles.colors.primary : '#f0f0f0',
                marginRight: 16,
              }}
              onPress={() => setActiveTab('images')}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: activeTab === 'images' ? 'white' : '#666',
                }}>
                {t('Images')} ({images.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 20,
                backgroundColor:
                  activeTab === 'documents' ? styles.colors.primary : '#f0f0f0',
              }}
              onPress={() => setActiveTab('documents')}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: activeTab === 'documents' ? 'white' : '#666',
                }}>
                {t('Documents')} ({documents.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Сетка файлов */}
          <View style={{flex: 1, paddingHorizontal: 16}}>
            <FlatList
              data={[{id: 'add-button', type: 'add-button'}, ...currentData]}
              renderItem={({item, index}) => {
                if (item.type === 'add-button') {
                  return renderAddButton();
                }
                return renderFileItem({item, index: index - 1});
              }}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 20}}
            />
          </View>

          {/* Кнопки действий */}
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 16,
              paddingVertical: 20,
              paddingBottom: 40,
              gap: 12,
            }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: 25,
                backgroundColor: '#f0f0f0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={onClose}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#666',
                }}>
                {t('Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: 25,
                backgroundColor: canProceed ? styles.colors.primary : '#cccccc',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={canProceed ? onSelect : null}
              disabled={!canProceed}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: canProceed ? 'white' : '#999',
                }}>
                {canProceed ? t('Continue') : t('Select')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default GalleryModal;
