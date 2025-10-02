import React from 'react';
import {View, TouchableOpacity, Dimensions, Keyboard} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Text from '../components/Text';
import StandardButton from '../components/StandardButton';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import {useChangePassword} from '../hooks/useChangePassword';
import {useKeyboardVisible} from '../hooks/useKeyboardVisible';
import StandardButtonOutline from '../components/StandardButtonOutline';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ChangeLanguage = ({handleChange = language => {}, hide = () => {}}) => {
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const dispatch = useDispatch();
  const userData = useSelector(state => state.auth).userData;
  const {t} = useTranslation();
  const languages = [
    {key: 'en-US', value: 'English'}, // English (United States)
    {key: 'ar-SA', value: 'العربية'}, // Arabic (Saudi Arabia)
  ];
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{
        position: 'absolute',
        zIndex: 9,
        width,
        height: '100%',
        backgroundColor: '#ffffffaa',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
      onPress={() => hide()}>
      <View
        style={{
          width: '100%',
          maxHeight: '60%',
          backgroundColor: '#fff',
          alignItems: 'center',
          padding: styles.paddingHorizontal,
          justifyContent: 'space-around',
          gap: 10,
          paddingVertical: 20,
        }}>
        <Text
          style={{
            color: styles.colors.black,
            fontSize: styles.fonSize.h1,
            fontWeight: '1000',
            width: '100%',
          }}>
          {t('Language settings').toUpperCase()}
        </Text>
        {languages.map((item, index) => (
          <TouchableOpacity
            style={{
              width: '100%',
              padding: 10,
              backgroundColor:
                userData?.localization == item.key ? '#ECF4F4' : '',
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
            onPress={() => {
              handleChange(item.key);
            }}
            key={index}>
            <Text style={{fontWeight: '500', fontSize: 18, color: '#222222'}}>
              {item.value}
            </Text>
            {userData?.localization == item.key && (
              <Ionicons
                name="checkmark"
                size={22}
                color={styles.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export default ChangeLanguage;
