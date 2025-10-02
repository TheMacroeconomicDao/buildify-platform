import React from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  Image,
  ScrollView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import Text from '../components/Text';
import StandardButton from '../components/StandardButton';
import styles from '../styles';
import {useTranslation} from 'react-i18next';
import {useChangePassword} from '../hooks/useChangePassword';
import {useKeyboardVisible} from '../hooks/useKeyboardVisible';
import Icon from 'react-native-vector-icons/Feather';

export default PayRequestModal = ({navigation, hide = () => {}}) => {
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const dispatch = useDispatch();
  const {t} = useTranslation();
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
        onPress={hide}
      />
      <View
        style={{
          width: '100%',
          maxHeight: '90%',
          backgroundColor: '#fff',
          borderTopLeftRadius: styles.borderR,
          borderTopRightRadius: styles.borderR,
        }}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{
            alignItems: 'center',
            padding: styles.paddingHorizontal,
            gap: 5,
            paddingVertical: 20,
          }}>
          <Image
            source={require('../images/payimg.png')}
            style={{width: width - 16, borderRadius: 16}}
          />
          <Text
            style={{
              color: styles.colors.black,
              fontSize: styles.fonSize.icon,
              fontWeight: '1000',
              width: '100%',
              textAlign: 'left',
            }}>
            {t('Unlock\nThousands of Tennis,\nand\nmeditation classes').toUpperCase()}
          </Text>
          <Text
            style={{
              color: styles.colors.black,
              fontSize: styles.fonSize.md,
              fontWeight: '500',
              width: '100%',
              textAlign: 'left',
            }}>
            {t('Your wellness journey starts here.')}
          </Text>
          <Text
            style={{
              color: styles.colors.black,
              fontSize: styles.fonSize.md,
              fontWeight: '200',
              width: '100%',
              textAlign: 'left',
            }}>
            {t('Try Free & Subscribe')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              gap: 30,
              paddingVertical: 10,
              marginTop: 20,
            }}>
            <Image
              source={require('../images/tv.png')}
              style={{width: 24, height: 24}}
            />
            <View>
              <Text
                style={{
                  color: styles.colors.black,
                  fontSize: styles.fonSize.lg,
                  fontWeight: '500',
                  width: '100%',
                  textAlign: 'left',
                }}>
                {t('1500 classes')}
              </Text>
              <Text
                style={{
                  color: styles.colors.regular,
                  fontSize: styles.fonSize.md,
                  fontWeight: '200',
                  width: '100%',
                  textAlign: 'left',
                }}>
                {t('Full access to all videos')}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              gap: 30,
              paddingVertical: 10,
              borderBottomWidth: 0.5,
              borderTopWidth: 0.5,
              borderColor: '#CCECEC',
            }}>
            <Image
              source={require('../images/lotus.png')}
              style={{width: 24, height: 24}}
            />
            <View>
              <Text
                style={{
                  color: styles.colors.black,
                  fontSize: styles.fonSize.lg,
                  fontWeight: '500',
                  width: '100%',
                  textAlign: 'left',
                }}>
                {t('Mental health')}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  color: styles.colors.regular,
                  fontSize: styles.fonSize.md,
                  fontWeight: '200',
                  width: '100%',
                  textAlign: 'left',
                }}>
                {t("Access to the author's meditation\ncourses")}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              gap: 30,
              paddingVertical: 10,
              marginBottom: 20,
            }}>
            <Image
              source={require('../images/tv.png')}
              style={{width: 24, height: 24}}
            />
            <View>
              <Text
                style={{
                  color: styles.colors.black,
                  fontSize: styles.fonSize.lg,
                  fontWeight: '500',
                  width: '100%',
                  textAlign: 'left',
                }}>
                {'World-class'}
              </Text>
              <Text
                style={{
                  color: styles.colors.regular,
                  fontSize: styles.fonSize.md,
                  fontWeight: '200',
                  width: '100%',
                  textAlign: 'left',
                }}>
                {t('Practice anytime with over 60\ninstructors')}
              </Text>
            </View>
          </View>
          <StandardButton
            title={t("Subscribe now")}
            action={() => {
              navigation.push('Subscriptions');
              //navigation.push('PayResult',{success:true});
              hide();
            }}
          />
        </ScrollView>
      </View>
    </View>
  );
};
