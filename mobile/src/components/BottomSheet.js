import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import Text from './Text';

const {height: screenHeight} = Dimensions.get('window');

const BottomSheet = ({
  visible,
  title,
  subtitle,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      dragY.setValue(0); // Сброс dragY при открытии
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY, dragY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Активировать только при вертикальном свайпе вниз
        return Math.abs(gestureState.dy) > 10 && gestureState.dy > 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Ограничиваем движение только вниз
        const dy = Math.max(0, gestureState.dy);
        dragY.setValue(dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const {dy, vy} = gestureState;

        // Закрыть если протянули больше 100px или быстрый свайп вниз
        if (dy > 100 || vy > 1) {
          onCancel();
        } else {
          // Вернуть на место
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 30,
          }).start();
        }
      },
    }),
  ).current;

  const handleDragDown = () => {
    // Простая функция для закрытия по нажатию на drag handle
    onCancel();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{translateY: Animated.add(translateY, dragY)}],
            },
          ]}>
          {/* Drag Handle with Pan Responder */}
          <Animated.View style={styles.dragArea} {...panResponder.panHandlers}>
            <TouchableOpacity
              style={styles.dragHandle}
              onPress={handleDragDown}
            />
          </Animated.View>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.disabledButton]}
                onPress={loading ? null : onConfirm}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#989898" />
                ) : (
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, loading && styles.disabledButton]}
                onPress={loading ? null : onCancel}
                disabled={loading}>
                <Text
                  style={[
                    styles.cancelButtonText,
                    loading && styles.disabledText,
                  ]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area для iPhone
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  dragArea: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#323232',
    marginBottom: 16,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8A94A0',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    height: 49,
    backgroundColor: '#1111110F',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    lineHeight: 24,
    letterSpacing: -0.006,
  },
  cancelButton: {
    flex: 1,
    height: 49,
    backgroundColor: '#3579F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: -0.006,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.6,
  },
});

export default BottomSheet;
