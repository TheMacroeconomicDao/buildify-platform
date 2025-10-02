import React from 'react';
import {ScrollView, View, TouchableOpacity} from 'react-native';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import HeaderBack from '../headers/HeaderBack';
import StandardButton from '../components/StandardButton';
import Text from '../components/Text';
import useSelectDirection from '../hooks/useSelectDirection';

export default function SelectDirection({navigation}) {
  const {t} = useTranslation();
  const {
    categories,
    subcategories,
    step,
    formData,
    titleByStep,
    toggleCategory,
    toggleSubcategory,
    handleNextOrSave,
    handleBackAction,
    isNextButtonDisabled,
    getSubcategoriesForCategory,
    route,
  } = useSelectDirection();

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: styles.colors.background,
      }}>
      <HeaderBack
        action={handleBackAction}
        no_back={step === 0 && route?.params?.fromReg}
        title={titleByStep(step)}
      />
      <ScrollView
        style={{
          width: '100%',
          flex: 1,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          rowGap: styles.paddingHorizontal,
          padding: styles.paddingHorizontal,
          paddingBottom: 70,
        }}>
        {step === 0 &&
          categories.map((item, index) => (
            <TouchableOpacity
              style={{
                borderColor: formData.categories.some(cat => cat.id === item.id)
                  ? styles.colors.primary
                  : styles.colors.grayLight,
                borderWidth: 2,
                borderRadius: 8,
                width: '100%',
                alignContent: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                paddingHorizontal: 30,
                height: 50,
                backgroundColor: formData.categories.some(
                  cat => cat.id === item.id,
                )
                  ? styles.colors.primaryLight
                  : 'transparent',
              }}
              onPress={() => toggleCategory(item)}
              key={index}>
              <Text
                style={{
                  color: styles.colors.black,
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        {step === 1 &&
          formData.categories.map(category => (
            <View key={category.id} style={{width: '100%', marginBottom: 20}}>
              <Text
                style={{
                  color: styles.colors.black,
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 10,
                }}>
                {category.name}
              </Text>
              {getSubcategoriesForCategory(category.id).map((item, index) => (
                <TouchableOpacity
                  style={{
                    borderColor: (
                      formData.subcategoriesByCategory[category.id] || []
                    ).some(sub => sub.id === item.id)
                      ? styles.colors.primary
                      : styles.colors.grayLight,
                    borderWidth: 2,
                    borderRadius: 8,
                    width: '100%',
                    alignContent: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 30,
                    height: 50,
                    backgroundColor: (
                      formData.subcategoriesByCategory[category.id] || []
                    ).some(sub => sub.id === item.id)
                      ? styles.colors.primaryLight
                      : 'transparent',
                    marginBottom: 10,
                  }}
                  onPress={() => toggleSubcategory(category.id, item)}
                  key={index}>
                  <Text
                    style={{
                      color: styles.colors.black,
                      fontSize: 14,
                      fontWeight: '500',
                    }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </ScrollView>
      <View
        style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          paddingHorizontal: styles.paddingHorizontal,
        }}>
        <StandardButton
          title={step === 0 ? t('Next') : t('Save')}
          action={handleNextOrSave}
          disabled={isNextButtonDisabled()}
        />
      </View>
    </View>
  );
}
