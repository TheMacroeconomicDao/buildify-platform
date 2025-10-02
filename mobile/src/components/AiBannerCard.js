import React from 'react';
import {View, Text, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import appStyles from '../styles';
import {useTranslation} from 'react-i18next';
import { useNavigation } from '@react-navigation/native';


const AiBannerCard = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.tariffCard} onPress={()=>navigation.navigate('DesignGeneration')}>
      <Text style={styles.tariffTitle}>{t('AI text generation')}</Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  tariffCard: {
    width: Dimensions.get('window').width - appStyles.paddingHorizontal * 2,
    padding: 16,
    paddingVertical:30,
    backgroundColor: appStyles.colors.primary,
    borderRadius: 8,
    marginVertical: 16,
    justifyContent:'center',
    alignItems:'center',
  },
  tariffTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appStyles.colors.primaryText
  },
});

export default AiBannerCard;
