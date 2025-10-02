import React, {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';
import Text from './Text';
import ReportUserModal from '../Modals/ReportUserModal';
import styles from '../styles';

const ReportUserButton = ({
  reportedUser,
  orderId = null,
  style = {},
  iconSize = 16,
  showText = true,
  variant = 'default', // 'default', 'outline', 'text'
}) => {
  const {t} = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'outline':
        return {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12, // Spacing between elements: 12 units [[memory:5708671]]
          borderWidth: 1,
          borderColor: '#FF3B30',
          borderRadius: 8,
          backgroundColor: 'transparent',
          ...style,
        };
      case 'text':
        return {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 4,
          paddingHorizontal: 8,
          backgroundColor: 'transparent',
          ...style,
        };
      default:
        return {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12, // Spacing between elements: 12 units [[memory:5708671]]
          backgroundColor: '#FF3B30',
          borderRadius: 8,
          ...style,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return {
          color: '#FF3B30',
          fontSize: styles.fonSize.sm,
          fontWeight: '500',
          marginLeft: showText ? 6 : 0,
        };
      case 'text':
        return {
          color: '#FF3B30',
          fontSize: styles.fonSize.sm,
          fontWeight: '400',
          marginLeft: showText ? 6 : 0,
        };
      default:
        return {
          color: '#fff',
          fontSize: styles.fonSize.sm,
          fontWeight: '500',
          marginLeft: showText ? 6 : 0,
        };
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'outline':
      case 'text':
        return '#FF3B30';
      default:
        return '#fff';
    }
  };

  return (
    <View>
      <TouchableOpacity style={getButtonStyle()} onPress={handlePress}>
        <Icon name="flag" size={iconSize} color={getIconColor()} />
        {showText && <Text style={getTextStyle()}>{t('Report User')}</Text>}
      </TouchableOpacity>

      {modalVisible && (
        <ReportUserModal
          reportedUser={reportedUser}
          orderId={orderId}
          hide={hideModal}
        />
      )}
    </View>
  );
};

export default ReportUserButton;
