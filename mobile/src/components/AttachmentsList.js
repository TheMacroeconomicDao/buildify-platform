import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import AttachmentRenderer from './AttachmentRenderer';
import styles from '../styles';

/**
 * Компонент для отображения списка файлов/вложений
 */
const AttachmentsList = ({
  attachments = [],
  title = null,
  showAddButton = false,
  onAddPress = null,
  onRemove = null,
  onFilePress = null,
  onView = null,
  onDownload = null,
  size = 'medium',
  containerStyle = {},
  addButtonText = null,
  showBorder = true,
  maxDisplayCount = null
}) => {
  const { t } = useTranslation();
  
  const safeAttachments = Array.isArray(attachments) ? attachments : [];
  const displayAttachments = maxDisplayCount 
    ? safeAttachments.slice(0, maxDisplayCount)
    : safeAttachments;
  const hiddenCount = maxDisplayCount && safeAttachments.length > maxDisplayCount 
    ? safeAttachments.length - maxDisplayCount 
    : 0;
  
  if (safeAttachments.length === 0 && !showAddButton) {
    return null;
  }
  
  return (
    <View style={[{ width: '100%' }, containerStyle]}>
      {/* Заголовок */}
      {title && (
        <Text style={{
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 10,
          color: styles.colors.black
        }}>
          {title}
          {safeAttachments.length > 0 && ` (${safeAttachments.length})`}
        </Text>
      )}
      
      {/* Список файлов */}
      {displayAttachments.map((file, index) => (
        <View
          key={file.id || index}
          style={{
            borderBottomWidth: showBorder && index < displayAttachments.length - 1 ? 1 : 0,
            borderBottomColor: styles.colors.border,
          }}>
          <AttachmentRenderer
            file={file}
            size={size}
            showName={true}
            showRemove={!!onRemove}
            onRemove={onRemove}
            onPress={onFilePress}
            onView={onView}
            onDownload={onDownload}
          />
        </View>
      ))}
      
      {/* Показать скрытые файлы */}
      {hiddenCount > 0 && (
        <View style={{
          paddingVertical: 8,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 14,
            color: styles.colors.gray,
            fontStyle: 'italic'
          }}>
            {t('and {{count}} more files', { count: hiddenCount })}
          </Text>
        </View>
      )}
      
      {/* Кнопка добавления файла */}
      {showAddButton && onAddPress && (
        <TouchableOpacity
          onPress={onAddPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            gap: 20,
            marginTop: safeAttachments.length > 0 ? 16 : 0,
            backgroundColor: styles.colors.grayLight,
            borderRadius: 8,
            padding: 12,
          }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderWidth: 1,
              borderColor: styles.colors.primary,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'flex-start',
              backgroundColor: styles.colors.white,
            }}>
            <Ionicons
              name="add"
              size={24}
              color={styles.colors.primary}
            />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 16,
              color: styles.colors.primary,
            }}
            numberOfLines={1}>
            {addButtonText || t('Add file')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AttachmentsList; 