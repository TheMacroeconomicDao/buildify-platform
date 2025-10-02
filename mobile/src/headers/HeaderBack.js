import React from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HeaderBack = ({
  title = '',
  action = () => {},
  no_back = false,
  menu = false,
  menuAction = () => {},
  center = false,
}) => {
  return (
    <View
      style={[
        headerStyles.container,
        no_back && !menu && headerStyles.containerNoPadding,
      ]}>
      {/* Левая область для кнопки назад */}
      {!no_back ? (
        <View style={headerStyles.sideContainer}>
          <TouchableOpacity style={headerStyles.iconButton} onPress={action}>
            <Ionicons
              name="arrow-back"
              size={styles.fonSize.md}
              color={'#323232'}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Центральная область для заголовка */}
      <View
        style={[
          headerStyles.titleContainer,
          center || menu
            ? headerStyles.centeredTitleContainer
            : headerStyles.leftTitleContainer,
        ]}>
        <Text
          style={[
            headerStyles.titleText,
            (center || menu) && headerStyles.centeredText,
          ]}>
          {title}
        </Text>
      </View>

      {/* Правая область для меню или свободного пространства */}
      {menu ? (
        <View style={headerStyles.sideContainer}>
          <TouchableOpacity
            style={headerStyles.iconButton}
            onPress={menuAction}>
            <Ionicons
              name="ellipsis-horizontal"
              size={styles.fonSize.md}
              color={'#323232'}
            />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: styles.colors.background,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: styles.colors.border,
    paddingTop: 15,
    paddingBottom: 8,
    paddingHorizontal: 15,
  },
  containerNoPadding: {
    paddingLeft: 15,
    paddingRight: 0,
  },
  sideContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    justifyContent: 'center',
  },
  centeredTitleContainer: {
    alignItems: 'center',
  },
  leftTitleContainer: {
    alignItems: 'flex-start',
  },
  titleText: {
    fontSize: 20,
    color: styles.colors.black,
    fontWeight: '500',
    textAlign: 'left',
    flexShrink: 1,
  },
  centeredText: {
    textAlign: 'center',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    width: 30,
    borderRadius: 30,
    backgroundColor: styles.colors.disabled,
  },
});

export default HeaderBack;
