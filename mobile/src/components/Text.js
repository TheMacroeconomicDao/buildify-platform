// CustomText.js
import React from 'react';
import {Platform, StyleSheet, Text} from 'react-native';
import i18n from 'i18next';
import styles from '../styles'; // Импортируем глобальные стили

function getFamily(weight) {
  switch (weight) {
    case '100':
      return 'Inter-ExtraLight';
    case '200':
      return 'Inter-Light';
    case '300':
      return 'Inter-Light';
    case '400':
      return 'Inter-Regular';
    case '500':
      return 'Inter-Semibold';
    case '600':
      return 'Inter-Bold';
    case '700':
      return 'Inter-Extrabold';
    case '800':
      return 'Inter-Black';
    case '900':
      return 'Inter-Black';
    default:
      return 'Inter-Regular';
  }
}

export default function CustomText(props) {
  const hasCustomColor = props.style && 
    (props.style.color || 
     (Array.isArray(props.style) && props.style.some(s => s && s.color)));

  return (
    <Text
      numberOfLines={props.numberOfLines}
      style={[
        stylesLocal.defaultStyle,
        !hasCustomColor && { color: styles.colors.regular }, // Цвет по умолчанию
        props.style,
        {
          fontFamily: getFamily(props?.style?.fontWeight || '400'),
          fontVariant: ['no-common-ligatures'],
        },
      ]}>
      {props.children}
    </Text>
  );
}

const stylesLocal = StyleSheet.create({
  defaultStyle: {
    fontSize: styles.fonSize.sm,
    lineHeight: styles.fonSize.sm * 1.4,
  },
});