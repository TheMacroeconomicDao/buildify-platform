import React from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import styles from '../styles';
import {LoadingComponent} from './Loading';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HeaderBack from '../headers/HeaderBack';
import TextArea from '../components/TextArea';
import TextField from '../components/TextField';
import Text from '../components/Text';
import useDesignGeneration from '../hooks/useDesignGeneration';

export default function DesignGeneration({navigation}) {
  const {t} = useTranslation();
  const {
    description,
    setDescription,
    attachments,
    generationStatus,
    generatedDesign,
    errorMessage,
    isPolling,
    isLoading,
    pickFile,
    removeFile,
    generateDesign,
    createOrderWithDesign,
    regenerateDesign,
    downloadFile,
    viewFile,
  } = useDesignGeneration(navigation);

  const renderAttachments = () => (
    <View style={{width: '100%', rowGap: 8}}>
      {attachments.map(file => (
        <View
          key={file.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 5,
            borderBottomWidth: 1,
            borderBottomColor: styles.colors.border,
          }}>
          {file.type.startsWith('image/') ? (
            <Image
              source={{uri: file.uri}}
              style={{width: 50, height: 50, borderRadius: 4, marginRight: 10}}
            />
          ) : (
            <Ionicons
              name="document-outline"
              size={50}
              color={styles.colors.white}
              style={{
                width: 50,
                height: 50,
                borderRadius: 4,
                marginRight: 10,
                backgroundColor: styles.colors.highlight,
              }}
            />
          )}
          <Text
            style={{flex: 1, fontSize: 14, color: styles.colors.black}}
            numberOfLines={1}>
            {file.name}
          </Text>
          <TouchableOpacity onPress={() => removeFile(file.id)}>
            <Ionicons name="close" size={24} color={styles.colors.red} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        onPress={pickFile}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 5,
          borderBottomWidth: 1,
          borderBottomColor: styles.colors.border,
          gap: 20,
        }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderWidth: 1,
            borderColor: styles.colors.primary,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="add" size={30} color={styles.colors.primary} />
        </View>
        <Text
          style={{flex: 1, fontSize: 18, color: styles.colors.primary}}
          numberOfLines={1}>
          {t('Add file')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderResultSection = () => {
    if (generationStatus === null) {
      return (
        <View style={{alignItems: 'center', marginTop: 20}}>
          <Text
            style={{fontSize: 16, color: styles.colors.gray, marginBottom: 20}}>
            {t('The result will appear here')}
          </Text>
        </View>
      );
    }

    if (generationStatus === 'pending' || isPolling) {
      return (
        <View style={{alignItems: 'center', marginTop: 20}}>
          <LoadingComponent text={t('Loading...')} />
          <Text
            style={{fontSize: 16, color: styles.colors.gray, marginTop: 10}}>
            {t('Generating design...')}
          </Text>
        </View>
      );
    }

    if (generationStatus === 'failed') {
      return (
        <View style={{alignItems: 'center', marginTop: 20}}>
          <Ionicons name="alert-circle" size={50} color={styles.colors.red} />
          <Text
            style={{
              fontSize: 16,
              color: styles.colors.red,
              marginTop: 10,
              textAlign: 'center',
            }}>
            {errorMessage || t('Failed to generate design')}
          </Text>
        </View>
      );
    }

    // Результаты теперь отображаются на отдельном экране
    if (generationStatus === 'complete') {
      return (
        <View
          style={{
            padding: 20,
            alignItems: 'center',
            backgroundColor: '#E8F5E8',
            borderRadius: 12,
            marginVertical: 10,
          }}>
          <Ionicons
            name="checkmark-circle"
            size={40}
            color={styles.colors.primary}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: styles.colors.black,
              textAlign: 'center',
              marginTop: 10,
            }}>
            {t('Design generated successfully!')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: styles.colors.gray,
              textAlign: 'center',
              marginTop: 5,
            }}>
            {t('You have been redirected to view the results')}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: styles.colors.background}}>
      <HeaderBack
        action={() => navigation.goBack()}
        title={t('Design generation')}
        center
      />

      {isLoading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <LoadingComponent text={t('Loading...')} />
          <Text
            style={{marginTop: 20, fontSize: 16, color: styles.colors.gray}}>
            {t('Loading your designs...')}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={{width: '100%'}}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: 'center',
              rowGap: 20,
              paddingHorizontal: styles.paddingHorizontal,
              paddingVertical: 20,
              paddingBottom: 100, // Дополнительный отступ для кнопок внизу
            }}>
            <TextArea
              value={description}
              onChange={setDescription}
              placeholder={t('Describe the task')}
              size="md"
              width="100%"
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: styles.colors.black,
                alignSelf: 'flex-start',
              }}>
              {t('Upload examples')}{' '}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: styles.colors.regular || '#8A94A0',
                  fontStyle: 'italic',
                }}>
                ({t('Optional')})
              </Text>
            </Text>
            {renderAttachments()}
            {renderResultSection()}
            {generationStatus === 'complete' && (
              <TouchableOpacity
                style={{
                  padding: 15,
                  backgroundColor: styles.colors.primary,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: '100%',
                }}
                onPress={createOrderWithDesign}>
                <Text
                  style={{
                    color: styles.colors.white,
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}>
                  {t('Create order with these materials')}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Кнопка "Сгенерировать/Перегенерировать" внизу */}
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
                padding: 15,
                backgroundColor:
                  generationStatus === 'pending' ||
                  isPolling ||
                  (!description &&
                    !attachments.length &&
                    generationStatus !== 'complete')
                    ? styles.colors.disabled
                    : styles.colors.primary,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 15,
              }}
              onPress={
                generationStatus === 'complete'
                  ? regenerateDesign
                  : generateDesign
              }
              disabled={
                generationStatus === 'pending' ||
                isPolling ||
                (!description &&
                  !attachments.length &&
                  generationStatus !== 'complete')
              }>
              <Text
                style={{
                  color: styles.colors.white,
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>
                {generationStatus === 'pending' || isPolling
                  ? t('Generating...')
                  : generationStatus === 'complete'
                  ? t('Regenerate')
                  : t('Generate')}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
