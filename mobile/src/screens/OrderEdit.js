import React from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HeaderBack from '../headers/HeaderBack';
import TextArea from '../components/TextArea';
import StandardInput from '../components/StandardInput';
import Text from '../components/Text';

import DatePickerInput from '../components/DatePickerInput';
import AttachmentsList from '../components/AttachmentsList';
import useOrderEdit from '../hooks/useOrderEdit';

export default function OrderEdit({navigation, route}) {
  const {t} = useTranslation();
  const {orderId} = route.params || {};

  const {
    orderData,
    loading,
    submitting,
    attachments,
    errors,
    modalVisible,
    modalType,
    categories,
    subcategories,
    orderStatuses,
    getStatusColor,
    getCategoryName,
    getSubcategoryName,
    handleInputChange,
    pickFile,
    removeFile,
    handleSave,
    handleCancel,
    openModal,
    closeModal,
    selectItem,
    viewFile,
    downloadFile,
  } = useOrderEdit(navigation, orderId);

  const renderModal = () => (
    <Modal
      transparent
      visible={modalVisible}
      animationType="fade"
      onRequestClose={closeModal}>
      <TouchableOpacity
        activeOpacity={1}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={closeModal}>
        <TouchableOpacity
          activeOpacity={1} // Предотвращаем закрытие при нажатии внутри модалки
          style={{
            width: '80%',
            backgroundColor: styles.colors.white,
            borderRadius: 12,
            padding: 20,
            maxHeight: '80%',
          }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: styles.colors.black,
              marginBottom: 20,
              textAlign: 'center',
            }}>
            {modalType === 'category'
              ? t('Select category')
              : t('Select subcategory')}
          </Text>
          <ScrollView>
            {(modalType === 'category' ? categories : subcategories).map(
              (item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    borderColor: styles.colors.primary,
                    borderWidth: 1,
                    borderRadius: 8,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 30,
                    marginBottom: 10,
                  }}
                  onPress={() => selectItem(item)}>
                  <Text
                    style={{
                      color: styles.colors.black,
                      fontSize: 14,
                      fontWeight: '500',
                    }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
          <TouchableOpacity
            style={{
              marginTop: 20,
              padding: 10,
              backgroundColor: styles.colors.primary,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={closeModal}>
            <Text style={{color: styles.colors.white, fontWeight: 'bold'}}>
              {t('Close')}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>{t('Loading...')}</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: styles.colors.background}}>
      <HeaderBack
        action={() => navigation.goBack()}
        title={orderData.title || orderData.name}
      />
      <ScrollView
        style={{width: '100%'}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          rowGap: styles.paddingHorizontal,
          paddingHorizontal: styles.paddingHorizontal,
          paddingVertical: 20,
          paddingBottom: 100,
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

        <StandardInput
          value={orderData.title || ''}
          onChange={val => handleInputChange('title', val)}
          placeholder={`${t('Order Title')}`}
          size="md"
          width="100%"
          error={errors?.find(e => e.path === 'title')?.message || null}
        />

        <TouchableOpacity
          style={{
            width: '100%',
            padding: 10,
            backgroundColor: styles.colors.white,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: styles.colors.border,
          }}
          onPress={() => openModal('category')}>
          <Text style={{fontSize: 16, color: styles.colors.black}}>
            {t('Category')}:{' '}
            {getCategoryName(orderData.work_direction) || t('Not selected')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: '100%',
            padding: 10,
            backgroundColor: styles.colors.white,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: styles.colors.border,
          }}
          onPress={() => openModal('subcategory')}>
          <Text style={{fontSize: 16, color: styles.colors.black}}>
            {t('Subcategory')}:{' '}
            {getSubcategoryName(orderData.work_type) || t('Not selected')}
          </Text>
        </TouchableOpacity>

        <TextArea
          value={orderData.description || ''}
          onChange={val => handleInputChange('description', val)}
          placeholder={`${t('Description')}`}
          size="md"
          width="100%"
          error={errors?.find(e => e.path === 'description')?.message || null}
        />

        <AttachmentsList
          attachments={attachments}
          title={t('Attachments')}
          showAddButton={true}
          onAddPress={pickFile}
          onRemove={removeFile}
          onView={viewFile}
          onDownload={downloadFile}
          containerStyle={{marginVertical: 20}}
        />

        <StandardInput
          value={orderData.city || ''}
          onChange={val => handleInputChange('city', val.replace(/[0-9]/g, ''))}
          placeholder={`${t('City')}`}
          size="md"
          width="100%"
          error={errors?.find(e => e.path === 'city')?.message || null}
        />

        <StandardInput
          value={orderData.address || ''}
          onChange={val => handleInputChange('address', val)}
          placeholder={`${t('Address')}`}
          size="md"
          width="100%"
          error={errors?.find(e => e.path === 'address')?.message || null}
        />

        <StandardInput
          mode="numeric"
          value={orderData.max_amount ? String(orderData.max_amount) : ''}
          onChange={val => handleInputChange('max_amount', val)}
          placeholder={`${t('Maximum price')}`}
          size="md"
          width="100%"
          error={errors?.find(e => e.path === 'max_amount')?.message || null}
        />
      </ScrollView>

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
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
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
            onPress={handleCancel}>
            <Text style={{color: styles.colors.red, fontWeight: 'bold'}}>
              {t('Cancel')}
            </Text>
          </TouchableOpacity>
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
            onPress={handleSave}>
            <Text style={{color: styles.colors.white, fontWeight: 'bold'}}>
              {t('Save')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderModal()}
    </View>
  );
}
