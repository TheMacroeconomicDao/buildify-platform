import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {useDispatch} from 'react-redux';
import Text from '../components/Text';
import StandardButton from '../components/StandardButton';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import {useKeyboardVisible} from '../hooks/useKeyboardVisible';
import {apiService} from '../services/unified-api';
import Icon from 'react-native-vector-icons/Feather';

const COMPLAINT_REASONS = [
  {key: 'inappropriate_behavior', label: 'Inappropriate behavior'},
  {key: 'poor_quality_work', label: 'Poor quality work'},
  {key: 'non_payment', label: 'Non-payment'},
  {key: 'fraud', label: 'Fraud'},
  {key: 'spam', label: 'Spam'},
  {key: 'fake_profile', label: 'Fake profile'},
  {key: 'other', label: 'Other'},
];

export default ReportUserModal = ({
  reportedUser,
  orderId = null,
  hide = () => {},
}) => {
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const isKeyboardVisible = useKeyboardVisible();

  const [selectedReason, setSelectedReason] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert(t('Error'), t('Please select a reason'));
      return;
    }

    setIsSubmitting(true);

    try {
      const complaintData = {
        reported_user_id: reportedUser.id,
        reason: selectedReason,
        comment: comment.trim() || null,
        ...(orderId && {order_id: orderId}),
      };

      await apiService.createComplaint(complaintData);

      Alert.alert(t('Success'), t('Complaint submitted successfully'), [
        {
          text: t('OK'),
          onPress: hide,
        },
      ]);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      const errorMessage =
        error.response?.data?.message || t('Failed to submit complaint');
      Alert.alert(t('Error'), errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        zIndex: 9,
        width,
        height: '100%',
        backgroundColor: '#00000066',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
      <TouchableOpacity
        activeOpacity={1}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onPress={() => (!isKeyboardVisible ? hide() : Keyboard.dismiss())}
      />
      <View
        style={{
          width: '100%',
          maxHeight: '85%',
          backgroundColor: '#fff',
          alignItems: 'center',
          paddingHorizontal: styles.paddingHorizontal,
          paddingVertical: 24, // Spacing between blocks: 24 units [[memory:5708671]]
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -6},
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 20,
        }}>
        {/* Header */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24, // Spacing between blocks: 24 units [[memory:5708671]]
          }}>
          <Text
            style={{
              color: styles.colors.black,
              fontSize: styles.fonSize.h2,
              fontWeight: '600',
              flex: 1,
              lineHeight: 24,
            }}>
            {t('Report User')}
          </Text>
          <TouchableOpacity
            onPress={hide}
            style={{
              padding: 8,
              borderRadius: 8,
            }}>
            <Icon name="x" size={24} color={styles.colors.gray} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{width: '100%'}}
          showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View
            style={{
              backgroundColor: '#f8f9fa',
              padding: 16,
              borderRadius: 12,
              marginBottom: 24, // Spacing between blocks: 24 units [[memory:5708671]]
            }}>
            <Text
              style={{
                color: styles.colors.black,
                fontSize: styles.fonSize.md,
                fontWeight: '600',
                marginBottom: 4,
              }}>
              {t('Report this user')}:
            </Text>
            <Text
              style={{
                color: styles.colors.gray,
                fontSize: styles.fonSize.sm,
                fontWeight: '400',
              }}>
              {reportedUser.name}
            </Text>
          </View>

          {/* Description */}
          <Text
            style={{
              color: styles.colors.gray,
              fontSize: styles.fonSize.sm,
              fontWeight: '400',
              textAlign: 'left',
              marginBottom: 24, // Spacing between blocks: 24 units [[memory:5708671]]
              lineHeight: 20,
            }}>
            {t('Report inappropriate behavior or violation of platform rules')}
          </Text>

          {/* Reason Selection */}
          <Text
            style={{
              color: styles.colors.black,
              fontSize: styles.fonSize.md,
              fontWeight: '600',
              marginBottom: 12, // Spacing between elements: 12 units [[memory:5708671]]
            }}>
            {t('Reason for complaint')}
          </Text>

          {COMPLAINT_REASONS.map(reason => (
            <TouchableOpacity
              key={reason.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12, // Spacing between elements: 12 units [[memory:5708671]]
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor:
                  selectedReason === reason.key ? '#e3f2fd' : 'transparent',
                marginBottom: 8,
                borderWidth: selectedReason === reason.key ? 1 : 0,
                borderColor:
                  selectedReason === reason.key
                    ? styles.colors.primary
                    : 'transparent',
              }}
              onPress={() => setSelectedReason(reason.key)}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor:
                    selectedReason === reason.key
                      ? styles.colors.primary
                      : '#ccc',
                  backgroundColor:
                    selectedReason === reason.key
                      ? styles.colors.primary
                      : 'transparent',
                  marginRight: 12, // Spacing between elements: 12 units [[memory:5708671]]
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {selectedReason === reason.key && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#fff',
                    }}
                  />
                )}
              </View>
              <Text
                style={{
                  color: styles.colors.black,
                  fontSize: styles.fonSize.sm,
                  fontWeight: '400',
                  flex: 1,
                }}>
                {t(reason.label)}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Comment Input */}
          <Text
            style={{
              color: styles.colors.black,
              fontSize: styles.fonSize.md,
              fontWeight: '600',
              marginTop: 24, // Spacing between blocks: 24 units [[memory:5708671]]
              marginBottom: 12, // Spacing between elements: 12 units [[memory:5708671]]
            }}>
            {t('Additional comment')}
          </Text>

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 12,
              fontSize: styles.fonSize.sm,
              color: styles.colors.black,
              minHeight: 100,
              maxHeight: 150,
              textAlignVertical: 'top',
              marginBottom: 24, // Spacing between blocks: 24 units [[memory:5708671]]
            }}
            multiline
            placeholder={t(
              'Please provide additional details about the issue...',
            )}
            placeholderTextColor={styles.colors.gray}
            value={comment}
            onChangeText={setComment}
            maxLength={1000}
          />

          <Text
            style={{
              color: styles.colors.gray,
              fontSize: styles.fonSize.xs,
              textAlign: 'right',
              marginBottom: 24, // Spacing between blocks: 24 units [[memory:5708671]]
            }}>
            {comment.length}/1000
          </Text>
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            gap: 12, // Spacing between elements: 12 units [[memory:5708671]]
          }}>
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: styles.colors.gray,
              alignItems: 'center',
            }}
            onPress={hide}
            disabled={isSubmitting}>
            <Text>{t('Cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 2,
              padding: 12,
              borderRadius: 8,
              backgroundColor: isSubmitting ? '#ccc' : styles.colors.primary,
              alignItems: 'center',
            }}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            <Text
              style={{
                color: '#fff',
              }}>
              {isSubmitting
                ? t('Submitting complaint...')
                : t('Submit Complaint')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
