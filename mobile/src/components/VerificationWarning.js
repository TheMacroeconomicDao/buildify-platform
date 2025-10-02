import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import Text from './Text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';

const VerificationWarning = ({
  title,
  message,
  type = 'warning',
  onActionPress,
  actionText,
  style,
}) => {
  const {t} = useTranslation();

  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9500',
          iconColor: '#FF9500',
          textColor: '#E65100',
          icon: 'warning',
        };
      case 'info':
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          iconColor: '#2196F3',
          textColor: '#0D47A1',
          icon: 'info',
        };
      case 'error':
        return {
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          iconColor: '#F44336',
          textColor: '#C62828',
          icon: 'error',
        };
      default:
        return {
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9500',
          iconColor: '#FF9500',
          textColor: '#E65100',
          icon: 'warning',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}>
      <View style={styles.contentContainer}>
        <MaterialIcons
          name={config.icon}
          size={24}
          color={config.iconColor}
          style={styles.icon}
        />

        <View style={styles.textContainer}>
          <Text style={[styles.title, {color: config.textColor}]}>{title}</Text>

          <Text style={[styles.message, {color: config.textColor}]}>
            {message}
          </Text>
        </View>
      </View>

      {onActionPress && actionText && (
        <TouchableOpacity
          style={[styles.actionButton, {borderColor: config.borderColor}]}
          onPress={onActionPress}>
          <Text style={[styles.actionButtonText, {color: config.iconColor}]}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    margin: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VerificationWarning;
