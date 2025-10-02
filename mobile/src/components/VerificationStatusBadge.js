import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useVerificationStatus} from '../hooks/useVerificationStatus';
import {useTranslation} from 'react-i18next';

const VerificationStatusBadge = ({style, showLabel = true}) => {
  const {t} = useTranslation();
  const {
    verificationStatus,
    getVerificationStatusLabel,
    getVerificationStatusColor,
    isVerificationPending,
    isVerificationApproved,
    isVerificationRejected,
  } = useVerificationStatus();

  // Не показываем бейдж если статус не определен или не требуется
  if (verificationStatus === null || verificationStatus === 3) {
    return null;
  }

  const statusColor = getVerificationStatusColor();
  const statusLabel = getVerificationStatusLabel();

  // Получаем иконку в зависимости от статуса
  const getStatusIcon = () => {
    if (isVerificationApproved()) return '✓';
    if (isVerificationRejected()) return '✗';
    if (isVerificationPending()) return '⏳';
    return '?';
  };

  return (
    <View
      style={[styles.container, {backgroundColor: statusColor + '20'}, style]}>
      <View style={[styles.indicator, {backgroundColor: statusColor}]} />
      <Text style={[styles.icon, {color: statusColor}]}>{getStatusIcon()}</Text>
      {showLabel && (
        <Text style={[styles.label, {color: statusColor}]}>{statusLabel}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  icon: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default VerificationStatusBadge;
