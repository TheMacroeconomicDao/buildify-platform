import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Text from './Text';
import {useTranslation} from 'react-i18next';
import {notifyError} from '../services/notify';
import {unifiedApi} from '../services/unified-api';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const WorkTypeSelector = ({
  currentWorkSettings = [],
  onWorkSettingsChange,
  isEdit = false,
  editData = {},
  onEditDataChange,
  loading: externalLoading = false,
}) => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [selectedWorks, setSelectedWorks] = useState({});

  useEffect(() => {
    // Загружаем все доступные типы работ только в режиме редактирования
    if (isEdit) {
      loadAppSettings();
    }
  }, [isEdit]);

  useEffect(() => {
    // В режиме редактирования используем editData, иначе currentWorkSettings
    const workSettingsToUse =
      isEdit && editData.workSettings
        ? editData.workSettings
        : currentWorkSettings;

    const selected = {};
    workSettingsToUse.forEach(setting => {
      setting.types.forEach(type => {
        const key = `${setting.direction}.${type}`;
        selected[key] = true;
      });
    });

    setSelectedWorks(selected);
  }, [currentWorkSettings, isEdit, editData.workSettings]);

  const loadAppSettings = async () => {
    setLoading(true);
    try {
      const response = await unifiedApi.user.getAppSettings();
      if (response.success) {
        const directionsData = response.result.direction_work || [];
        const typesData = response.result.types_work || [];

        // Преобразуем данные в нужный формат
        const formattedDirections = Array.isArray(directionsData)
          ? directionsData
          : Object.values(directionsData);

        // Типы работ могут приходить как объект (сгруппированный) или массив
        let formattedTypes = [];
        if (Array.isArray(typesData)) {
          formattedTypes = typesData.flat(); // Сплющиваем массив массивов
        } else if (typeof typesData === 'object' && typesData !== null) {
          // Если объект - извлекаем все массивы и сплющиваем
          formattedTypes = Object.values(typesData).flat();
        }

        setDirections(formattedDirections);
        setWorkTypes(formattedTypes);
      } else {
        notifyError(t('Error'), t('Failed to load work settings'));
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
      notifyError(t('Error'), t('Failed to load work settings'));
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkType = (direction, type) => {
    if (!isEdit) return;

    const key = `${direction}.${type}`;
    const newSelectedWorks = {
      ...selectedWorks,
      [key]: !selectedWorks[key],
    };
    setSelectedWorks(newSelectedWorks);

    // Преобразуем в формат для API и сохраняем в editData
    const workSettings = convertToApiFormat(newSelectedWorks);
    if (onEditDataChange) {
      onEditDataChange('workSettings', workSettings);
    }
  };

  const convertToApiFormat = selectedWorks => {
    const grouped = {};

    Object.keys(selectedWorks).forEach(key => {
      if (selectedWorks[key]) {
        const [direction, type] = key.split('.');
        if (!grouped[direction]) {
          grouped[direction] = [];
        }
        grouped[direction].push(type);
      }
    });

    return Object.keys(grouped).map(direction => ({
      direction,
      types: grouped[direction],
    }));
  };

  const getDirectionName = directionKey => {
    const direction = directions.find(d => d.key === directionKey);
    if (!direction) return directionKey;

    // Проверяем разные форматы данных
    if (typeof direction.name === 'object') {
      return direction.name?.ru || direction.name?.en || direction.name;
    }
    return direction.name || directionKey;
  };

  const getTypeName = typeKey => {
    const type = workTypes.find(t => t.key === typeKey);
    if (!type) return typeKey;

    // Проверяем разные форматы данных
    if (typeof type.name === 'object') {
      return type.name?.ru || type.name?.en || type.name;
    }
    return type.name || typeKey;
  };

  const getTypesForDirection = directionKey => {
    if (!Array.isArray(workTypes)) {
      console.warn('workTypes is not an array:', workTypes);
      return [];
    }

    // Ищем по work_direction_id, сопоставляя с direction.id
    const direction = directions.find(d => d.key === directionKey);
    if (!direction) {
      console.warn('Direction not found:', directionKey);
      return [];
    }

    return workTypes.filter(type => {
      // Проверяем разные возможные поля для связи
      return (
        type.work_direction_id === direction.id ||
        type.work_direction_key === directionKey ||
        type.direction === directionKey
      );
    });
  };

  const selectedWorkKeys = Object.keys(selectedWorks).filter(
    key => selectedWorks[key],
  );
  const hasSelectedWorks = selectedWorkKeys.length > 0;

  if (loading || externalLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.fieldLabelContainer}>
          <Text style={styles.fieldLabel}>{t('Work Types')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3579F5" />
          <Text style={styles.loadingText}>{t('Loading...')}</Text>
        </View>
      </View>
    );
  }

  // В режиме просмотра показываем только выбранные пользователем типы работ
  if (!isEdit) {
    if (!currentWorkSettings || currentWorkSettings.length === 0) {
      return (
        <View style={styles.container}>
          <View style={styles.fieldLabelContainer}>
            <Text style={styles.fieldLabel}>{t('Work Types')}</Text>
          </View>
          <Text style={styles.emptyText}>{t('No work types selected')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.fieldLabelContainer}>
          <Text style={styles.fieldLabel}>{t('Work Types')}</Text>
        </View>
        <View style={styles.selectedTypesContainer}>
          {currentWorkSettings.map((setting, settingIndex) =>
            setting.types.map((type, typeIndex) => (
              <View
                key={`${settingIndex}-${typeIndex}`}
                style={styles.selectedTypeChip}>
                <Text style={styles.selectedTypeText}>{type}</Text>
              </View>
            )),
          )}
        </View>
      </View>
    );
  }

  // В режиме редактирования показываем все доступные типы

  return (
    <View style={styles.container}>
      <View style={styles.fieldLabelContainer}>
        <Text style={styles.fieldLabel}>{t('Work Types')}</Text>
      </View>
      <ScrollView
        style={styles.editContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}>
        {directions.map(direction => {
          const directionTypes = getTypesForDirection(direction.key);

          if (directionTypes.length === 0) return null;

          return (
            <View key={direction.key} style={styles.directionSection}>
              <Text style={styles.directionTitle}>
                {getDirectionName(direction.key)}
              </Text>

              <View style={styles.typesGrid}>
                {directionTypes.map(type => {
                  const key = `${direction.key}.${type.key}`;
                  const isSelected = selectedWorks[key];

                  return (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeChip,
                        isSelected && styles.typeChipSelected,
                      ]}
                      onPress={() => toggleWorkType(direction.key, type.key)}>
                      <Text
                        style={[
                          styles.typeChipText,
                          isSelected && styles.typeChipTextSelected,
                        ]}>
                        {getTypeName(type.key)}
                      </Text>
                      {isSelected && (
                        <MaterialIcons
                          name="check"
                          size={14}
                          color="#3579F5"
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#323232',
  },
  scrollHint: {
    fontSize: 12,
    color: '#8A94A0',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8A94A0',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8A94A0',
    lineHeight: 24,
    letterSpacing: -0.006,
    textAlign: 'center',
    paddingVertical: 8,
  },
  selectedTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTypeChip: {
    backgroundColor: '#E7EFFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectedTypeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3579F5',
    lineHeight: 18,
  },
  editContainer: {
    maxHeight: 300, // Ограничиваем высоту
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  directionSection: {
    marginBottom: 24,
  },
  directionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 22,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeChip: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  typeChipSelected: {
    backgroundColor: '#E7EFFF',
    borderColor: '#3579F5',
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    lineHeight: 18,
  },
  typeChipTextSelected: {
    color: '#3579F5',
  },
  checkIcon: {
    marginLeft: 4,
  },
});

export default WorkTypeSelector;
