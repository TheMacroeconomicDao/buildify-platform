import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text from './Text';
import styles from '../styles';

export default CheckboxInput = ({title = '', checked, onChange}) => {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems:'center',
        width: '100%',
        gap: 10,
        backgroundColor:'#E2EFFB',
        padding:6,
        borderRadius:4
      }}
      onPress={onChange}>
      <View
        style={{
          height:20,
          width:20,
          justifyContent:'center',
          alignItems:'center',
          borderWidth: 1.2,
          borderColor: styles.colors.primary,
          backgroundColor:styles.colors.white,
          borderRadius: 4,
        }}>
        <View
          style={{
            height: 8,
            width: 8,
            borderRadius: 4,
            backgroundColor: checked?styles.colors.primary:'transparent',
          }}
        />
      </View>

      <Text
        style={{
          fontSize: styles.fonSize['smd'],
          color: styles.colors.black,
          textAlign: 'left',
          width:'90%'
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
