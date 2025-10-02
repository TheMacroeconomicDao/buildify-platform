import React from 'react';
import {
  TouchableHighlight,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import Text from '../components/Text';
import styles from '../styles';

const StandardButton = ({
  title = '',
  size = 'md',
  action = () => {},
  disabled = false,
  style = {},
  textStyle = {},
  loading = false,
}) => {
  return (
    <TouchableHighlight
      underlayColor={styles.colors.highlight}
      style={[
        buttonStyles.button,
        (disabled || loading) && buttonStyles.disabledButton,
        style,
      ]}
      onPress={() => !disabled && !loading && action()}>
      <View style={buttonStyles.buttonContent}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={styles.colors.primaryText}
            style={buttonStyles.loadingIndicator}
          />
        )}
        <Text
          style={[
            buttonStyles.buttonText,
            disabled && buttonStyles.disabledText,
            loading && buttonStyles.loadingText,
            textStyle,
          ]}>
          {title}
        </Text>
      </View>
    </TouchableHighlight>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    backgroundColor: styles.colors.primary,
    borderRadius: 16,
    width: '100%',
    alignContent: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    height: 50,
  },
  disabledButton: {
    backgroundColor: styles.colors.disabled,
  },
  buttonText: {
    fontSize: 14,
    color: styles.colors.primaryText,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: styles.colors.disabledText,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  loadingText: {
    opacity: 0.8,
  },
});

export default StandardButton;
