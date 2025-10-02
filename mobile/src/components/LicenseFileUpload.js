import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {notifyError} from '../services/notify';
import DocumentPicker from 'react-native-document-picker';
import Text from './Text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';
import styles from '../styles';

const LicenseFileUpload = ({onFileSelect, selectedFile, error}) => {
  const {t} = useTranslation();
  const [selecting, setSelecting] = useState(false);

  const handleSelectDocument = async () => {
    try {
      setSelecting(true);
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

      onFileSelect(file);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // Пользователь отменил выбор
        return;
      }

      console.error('Error selecting document:', err);
      notifyError(t('Error'), t('Failed to select file'));
    } finally {
      setSelecting(false);
    }
  };

  const handleRemoveFile = () => {
    Alert.alert(
      t('Remove file'),
      t('Are you sure you want to remove the selected file?'),
      [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: t('Remove'),
          style: 'destructive',
          onPress: () => onFileSelect(null),
        },
      ],
    );
  };

  return (
    <View style={uploadStyles.container}>
      <View style={uploadStyles.labelContainer}>
        <Text style={uploadStyles.label}>{t('License file')}</Text>
        <Text style={uploadStyles.required}>*</Text>
      </View>

      {selectedFile ? (
        // Показываем выбранный файл
        <View
          style={[
            uploadStyles.fileContainer,
            error ? uploadStyles.fileContainerError : null,
          ]}>
          <View style={uploadStyles.fileInfo}>
            <MaterialIcons name="description" size={20} color="#3579F5" />
            <View style={uploadStyles.fileDetails}>
              <Text style={uploadStyles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={uploadStyles.fileSize}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={uploadStyles.removeButton}
            onPress={handleRemoveFile}>
            <MaterialIcons name="close" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ) : (
        // Показываем кнопку выбора файла
        <TouchableOpacity
          style={[
            uploadStyles.selectButton,
            error ? uploadStyles.selectButtonError : null,
          ]}
          onPress={handleSelectDocument}
          disabled={selecting}>
          {selecting ? (
            <ActivityIndicator size="small" color="#3579F5" />
          ) : (
            <>
              <MaterialIcons name="upload-file" size={24} color="#3579F5" />
              <Text style={uploadStyles.selectButtonText}>
                {t('Select license file')}
              </Text>
              <Text style={uploadStyles.selectButtonHint}>
                {t('Any file type (max 10MB)')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={uploadStyles.errorText}>{error}</Text>}
    </View>
  );
};

const uploadStyles = StyleSheet.create({
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
  required: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
    marginLeft: 2,
  },
  selectButton: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    minHeight: 120,
  },
  selectButtonError: {
    borderColor: '#FF3B30',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3579F5',
    marginTop: 8,
    textAlign: 'center',
  },
  selectButtonHint: {
    fontSize: 12,
    color: '#8A94A0',
    marginTop: 4,
    textAlign: 'center',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  fileContainerError: {
    borderColor: '#FF3B30',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#323232',
  },
  fileSize: {
    fontSize: 12,
    color: '#8A94A0',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});

export default LicenseFileUpload;
