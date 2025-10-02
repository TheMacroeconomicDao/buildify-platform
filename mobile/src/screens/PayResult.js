import React from 'react';
import {View, Image, Animated, TouchableOpacity} from 'react-native';
import styles from '../styles';
import Text from '../components/Text';
import usePayResult from '../hooks/usePayResult';
import StandardButton from '../components/StandardButton';

// Компонент для одного элемента конфетти
const ConfettiPiece = ({
  angle,
  distance,
  color,
  delay,
  rotation,
  createConfettiAnimation,
}) => {
  const {translateX, translateY, opacity, rotate} = createConfettiAnimation(
    angle,
    distance,
    delay,
    rotation,
  );

  return (
    <Animated.View
      style={{
        top: 220,
        position: 'absolute',
        zIndex: 9,
        width: 10, // Ширина прямоугольника
        height: 20, // Высота прямоугольника
        backgroundColor: color,
        borderRadius: 2, // Слегка закругленные углы
        transform: [
          {translateX},
          {translateY},
          {
            rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }),
          }, // Вращение
        ],
        opacity,
      }}
    />
  );
};

export default function PayResult(props) {
  const {
    isPaymentSuccessful,
    generateConfetti,
    createConfettiAnimation,
    handleGoToMain,
    handleTryAgain,
    t,
  } = usePayResult(props);

  // Отображение конфетти компонентов
  const renderConfetti = () => {
    const confettiData = generateConfetti();
    return confettiData.map(item => (
      <ConfettiPiece
        key={item.key}
        angle={item.angle}
        distance={item.distance}
        color={item.color}
        delay={item.delay}
        rotation={item.rotation}
        createConfettiAnimation={createConfettiAnimation}
      />
    ));
  };

  if (isPaymentSuccessful) {
    return (
      <View
        style={{
          borderRadius: 16,
          width: '100%',
          backgroundColor: styles.colors.background,
          padding: 16,
          gap: 25,
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {/* Конфетти */}
        {renderConfetti()}

        <Image source={require('../images/ok_hand.png')} />
        <Text
          style={{
            color: styles.colors.black,
            fontSize: styles.fonSize.g1,
            fontWeight: '1000',
            width: '100%',
            textAlign: 'center',
            lineHeight: 48,
          }}>
          {t('Thank you!').toUpperCase()}
        </Text>

        <Text
          style={{
            color: `${styles.colors.black}55`,
            fontSize: styles.fonSize.md,
            fontWeight: '500',
            width: '100%',
            textAlign: 'center',
          }}>
          {t('Subscription registration has been successfully completed.')}
        </Text>
        <Text
          style={{
            color: `${styles.colors.black}55`,
            fontSize: styles.fonSize.md,
            fontWeight: '500',
            width: '100%',
            textAlign: 'center',
            marginTop: 40,
          }}>
          {t('Now you can start using subscription features.')}
        </Text>

        <StandardButton title={t('Go to Main')} action={handleGoToMain} />
      </View>
    );
  }
  return (
    <View
      style={{
        borderRadius: 16,
        width: '100%',
        backgroundColor: styles.colors.background,
        padding: 16,
        gap: 30,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Image source={require('../images/ok_hand.png')} />
      <Text
        style={{
          color: styles.colors.black,
          fontSize: styles.fonSize.g1,
          fontWeight: '1000',
          width: '100%',
          textAlign: 'center',
        }}>
        {t('Thank you!').toUpperCase()}
      </Text>
      <Text
        style={{
          color: `${styles.colors.black}77`,
          fontSize: styles.fonSize.md,
          fontWeight: '500',
          width: '100%',
          textAlign: 'center',
        }}>
        {t('Subscription registration has been failed.')}
      </Text>
      <StandardButton title={t('Try Again')} action={handleTryAgain} />
    </View>
  );
}
