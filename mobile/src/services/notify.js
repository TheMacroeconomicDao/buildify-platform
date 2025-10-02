import {ALERT_TYPE, Dialog, Toast} from 'react-native-alert-notification';
import {Alert} from 'react-native';

const DEFAULT_DURATION = 2200;

export const notifySuccess = (title, message, options = {}) =>
  Toast.show({
    type: ALERT_TYPE.SUCCESS,
    title: title || 'Успешно',
    textBody: message || '',
    autoClose: options.autoClose ?? DEFAULT_DURATION,
    onPress: options.onPress,
  });

export const notifyError = (titleOrMessage, message, options = {}) => {
  const title = message ? titleOrMessage : 'Ошибка';
  const text = message ?? titleOrMessage ?? '';
  Toast.show({
    type: ALERT_TYPE.DANGER,
    title,
    textBody: text,
    autoClose: options.autoClose ?? DEFAULT_DURATION,
    onPress: options.onPress,
  });
};

export const notifyInfo = (title, message, options = {}) =>
  Toast.show({
    type: ALERT_TYPE.INFO,
    title: title || 'Информация',
    textBody: message || '',
    autoClose: options.autoClose ?? DEFAULT_DURATION,
    onPress: options.onPress,
  });

export const notifyWarning = (title, message, options = {}) =>
  Toast.show({
    type: ALERT_TYPE.WARNING,
    title: title || 'Внимание',
    textBody: message || '',
    autoClose: options.autoClose ?? DEFAULT_DURATION,
    onPress: options.onPress,
  });

export const showDialog = ({
  type = ALERT_TYPE.INFO,
  title,
  message,
  button = 'OK',
  onPress,
}) =>
  Dialog.show({
    type,
    title: title || '',
    textBody: message || '',
    button,
    onPress,
  });

export const showConfirm = ({
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) =>
  Alert.alert(title || '', message || '', [
    {text: cancelText, style: 'cancel', onPress: onCancel},
    {text: confirmText, onPress: onConfirm},
  ]);

export default {
  notifySuccess,
  notifyError,
  notifyInfo,
  notifyWarning,
  showDialog,
  showConfirm,
};
