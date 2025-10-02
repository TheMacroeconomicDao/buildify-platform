import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import {notifyError, notifySuccess} from '../services/notify';
import DocumentPicker from 'react-native-document-picker';
import Text from './Text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {api, retryApiCall} from '../services/index';
import config from '../config';

const LicenseUpload = ({
  licenseFilePath,
  verificationStatus,
  verificationComment,
  verifiedAt,
  onUploadSuccess,
}) => {
  const {t} = useTranslation();
  const [uploading, setUploading] = useState(false);

  // Статусы верификации: 0 - Pending, 1 - Approved, 2 - Rejected, 3 - NotRequired
  const getStatusConfig = () => {
    switch (verificationStatus) {
      case 0:
        return {
          text: t('Under review'),
          color: '#FF9500',
          icon: 'clock',
          backgroundColor: '#FFF3E0',
        };
      case 1:
        return {
          text: t('Verified'),
          color: '#34C759',
          icon: 'check-circle',
          backgroundColor: '#E8F5E8',
        };
      case 2:
        return {
          text: t('Rejected'),
          color: '#FF3B30',
          icon: 'cancel',
          backgroundColor: '#FFEBEE',
        };
      case 3:
        return {
          text: t('Verified'),
          color: '#34C759',
          icon: 'check-circle',
          backgroundColor: '#E8F5E8',
        };
      default:
        return {
          text: t('License not uploaded'),
          color: '#8A94A0',
          icon: 'file-upload',
          backgroundColor: '#F5F5F5',
        };
    }
  };

  const handleSelectDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles], // Разрешаем любые типы файлов
        copyTo: 'documentDirectory',
      });

      const file = result[0];

      // Проверяем размер файла (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        notifyError(t('Error'), t('File size should not exceed 10MB'));
        return;
      }

      await uploadLicense(file);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // Пользователь отменил выбор
        return;
      }

      console.error('Error selecting document:', error);
      notifyError(t('Error'), t('Failed to select file'));
    }
  };

  const uploadLicense = async file => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('license_file', {
        uri: file.fileCopyUri || file.uri,
        type: file.type,
        name: file.name,
      });

      const response = await retryApiCall(() =>
        api.user.uploadLicense(formData),
      );

      if (response.success) {
        // Immediately refresh user data after successful upload
        if (onUploadSuccess) {
          try {
            onUploadSuccess(response.result);
          } catch (e) {
            console.warn('onUploadSuccess callback failed:', e);
          }
        }

        notifySuccess(
          t('Success'),
          t(
            'License uploaded successfully. It will be reviewed by administration.',
          ),
        );
      } else {
        notifyError(
          t('Error'),
          response.message || t('Failed to upload license'),
        );
      }
    } catch (error) {
      console.error('Error uploading license:', error);
      notifyError(t('Error'), t('Failed to upload license'));
    } finally {
      setUploading(false);
    }
  };

  const handleViewLicense = () => {
    if (licenseFilePath) {
      const url = config.siteUrl + licenseFilePath;
      Linking.openURL(url).catch(error => {
        console.error('Error opening license file:', error);
        notifyError(t('Error'), t('Failed to open file'));
      });
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{t('License verification')}</Text>
      </View>

      {/* Статус верификации */}
      <View
        style={[
          styles.statusContainer,
          {backgroundColor: statusConfig.backgroundColor},
        ]}>
        <MaterialIcons
          name={statusConfig.icon}
          size={20}
          color={statusConfig.color}
        />
        <Text style={[styles.statusText, {color: statusConfig.color}]}>
          {statusConfig.text}
        </Text>
      </View>

      {/* Комментарий администратора при отклонении */}
      {verificationStatus === 2 && verificationComment && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>{t('Admin comment')}:</Text>
          <Text style={styles.commentText}>{verificationComment}</Text>
        </View>
      )}

      {/* Дата верификации */}
      {verificationStatus === 1 && verifiedAt && (
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>{t('Verified at')}:</Text>
          <Text style={styles.dateText}>{verifiedAt}</Text>
        </View>
      )}

      {/* Кнопки действий */}
      <View style={styles.actionsContainer}>
        {/* Просмотр загруженного файла */}
        {licenseFilePath && (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={handleViewLicense}>
            <Ionicons name="eye" size={16} color="#3579F5" />
            <Text style={styles.viewButtonText}>{t('View file')}</Text>
          </TouchableOpacity>
        )}

        {/* Загрузка/Перезагрузка файла */}
        {(!licenseFilePath ||
          verificationStatus === 2 ||
          verificationStatus === 0) && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleSelectDocument}
            disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="upload" size={16} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>
                  {verificationStatus === 2
                    ? t('Re-upload')
                    : verificationStatus === 0 && licenseFilePath
                    ? t('Replace file')
                    : t('Upload license')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#323232',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  commentContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#FF3B30',
    lineHeight: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#8A94A0',
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#323232',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3579F5',
    backgroundColor: '#FFFFFF',
  },
  viewButtonText: {
    fontSize: 12,
    color: '#3579F5',
    fontWeight: '500',
    marginLeft: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#3579F5',
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default LicenseUpload;
