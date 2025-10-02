import React, {useState} from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {notifyError} from '../services/notify';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import config from '../config';
import HeaderBack from '../headers/HeaderBack';
import StandardInput from '../components/StandardInput';
import TextArea from '../components/TextArea';
import StandardButton from '../components/StandardButton';
import AttachmentsList from '../components/AttachmentsList';
import Text from '../components/Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import usePortfolio from '../hooks/usePortfolio';
import DocumentPicker from 'react-native-document-picker';
import {LoadingComponent} from './Loading';

export default function CreatePortfolio({navigation, route}) {
  const {t} = useTranslation();
  const {executorId} = route?.params || {};
  const {createPortfolio, uploadFile, uploading} = usePortfolio(executorId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    files: [],
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: null}));
    }
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      });

      const fileData = {
        uri: res.uri,
        name: res.name,
        type: res.type,
        size: res.size,
      };

      const uploadResult = await uploadFile(fileData);

      if (uploadResult && (uploadResult.file_id || uploadResult.file?.id)) {
        const fileId = uploadResult.file_id || uploadResult.file?.id;
        const fileInfo = uploadResult.file || {};

        const newAttachment = {
          id: fileId,
          name: fileInfo.name || res.name,
          size: fileInfo.size || res.size,
          type: res.type,
          url: fileInfo.path
            ? `${config.siteUrl.replace(/\/$/, '')}${fileInfo.path}`
            : res.uri,
        };

        setAttachments(prev => {
          const updated = [...prev, newAttachment];
          return updated;
        });
        setFormData(prev => ({
          ...prev,
          files: [...prev.files, fileId],
        }));
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled selection
      } else {
        console.error('Error picking file:', err);
        notifyError(t('Error'), t('Failed to select file'));
      }
    }
  };

  const removeFile = fileId => {
    setAttachments(prev => prev.filter(att => att.id !== fileId));
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter(id => id !== fileId),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = t('Name is required');
    } else if (formData.name.length > 255) {
      newErrors.name = t('Name must not exceed 255 characters');
    }

    // Validate description
    if (formData.description.length > 2000) {
      newErrors.description = t('Description must not exceed 2000 characters');
    }

    // Validate files
    if (formData.files.length === 0) {
      newErrors.files = t('At least one file is required');
    } else if (formData.files.length > 10) {
      newErrors.files = t('Maximum 10 files');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const portfolioData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: 'media',
        files: formData.files,
      };

      await createPortfolio(portfolioData);

      // Go back to portfolio screen
      navigation.goBack();
    } catch (error) {
      console.error('Error creating portfolio:', error);
      notifyError(t('Error'), error.message || t('Failed to create portfolio'));
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <View style={createPortfolioStyles.container}>
      <HeaderBack title={t('Add to portfolio')} action={goBack} center={true} />

      <ScrollView
        style={createPortfolioStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={createPortfolioStyles.scrollContent}>
        {/* Name */}
        <StandardInput
          placeholder={t('Portfolio name')}
          value={formData.name}
          onChange={value => handleInputChange('name', value)}
          error={errors.name}
          maxLength={255}
        />

        {/* Description */}
        <TextArea
          placeholder={t('Description (optional)')}
          value={formData.description}
          onChange={value => handleInputChange('description', value)}
          error={errors.description}
          maxLength={2000}
        />

        {/* File upload */}
        <View style={createPortfolioStyles.filesSection}>
          <AttachmentsList
            attachments={attachments}
            title={t('Attached files')}
            showAddButton={true}
            onAddPress={pickFile}
            onRemove={removeFile}
            addButtonText={t('Add file')}
          />
          {errors.files && (
            <Text style={createPortfolioStyles.errorText}>{errors.files}</Text>
          )}
        </View>

        {/* Create button */}
        <StandardButton
          title={submitting ? t('Creating...') : t('Create')}
          action={handleSubmit}
          disabled={submitting || uploading}
          style={createPortfolioStyles.submitButton}
        />

        {submitting && (
          <View style={createPortfolioStyles.loadingOverlay}>
            <LoadingComponent text={t('Saving...')} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createPortfolioStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styles.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 20,
  },
  sectionTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 12,
  },

  filesSection: {},
  errorText: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.red,
    marginTop: 4,
  },
  submitButton: {},
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
