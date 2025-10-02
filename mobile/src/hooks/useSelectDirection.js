import {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import {set_categories} from '../actions/auth';
import {api, retryApiCall} from '../services/index';

export const useSelectDirection = () => {
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const auth = useSelector(state => state.auth);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    categories: [],
    subcategoriesByCategory: {},
  });

  // Загрузка категорий и подкатегорий с сервера
  useEffect(() => {
    const fetchAppSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await retryApiCall(() => api.user.getAppSettings());

        if (response.success && response.result) {
          const result = response.result;

          if (result.direction_work) {
            const mappedCategories = result.direction_work.map(dir => ({
              id: dir.key,
              name: dir.name,
            }));
            setCategories(mappedCategories);
          }

          if (result.types_work) {
            const subcategoriesByCategory = {};

            Object.keys(result.types_work).forEach(categoryKey => {
              const categoryTypes = result.types_work[categoryKey];
              if (Array.isArray(categoryTypes)) {
                subcategoriesByCategory[categoryKey] = categoryTypes.map(
                  type => ({
                    id: type.key,
                    name: type.name,
                    categoryId: categoryKey,
                  }),
                );
              } else {
                console.warn(
                  `types_work[${categoryKey}] is not an array:`,
                  categoryTypes,
                );
                subcategoriesByCategory[categoryKey] = [];
              }
            });

            setSubcategories(subcategoriesByCategory);
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке настроек:', error);
        setError(error.message || 'Произошла ошибка при загрузке настроек');
      } finally {
        setLoading(false);
      }
    };

    fetchAppSettings();
  }, []);

  const toggleCategory = category => {
    const isSelected = formData.categories.some(
      item => item.id === category.id,
    );
    if (isSelected) {
      const newCategories = formData.categories.filter(
        item => item.id !== category.id,
      );
      const newSubcategoriesByCategory = {...formData.subcategoriesByCategory};
      delete newSubcategoriesByCategory[category.id];
      setFormData({
        ...formData,
        categories: newCategories,
        subcategoriesByCategory: newSubcategoriesByCategory,
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
        subcategoriesByCategory: {
          ...formData.subcategoriesByCategory,
          [category.id]: [],
        },
      });
    }
  };

  const toggleSubcategory = (categoryId, subcategory) => {
    const currentSubcategories =
      formData.subcategoriesByCategory[categoryId] || [];
    const isSelected = currentSubcategories.some(
      item => item.id === subcategory.id,
    );
    if (isSelected) {
      setFormData({
        ...formData,
        subcategoriesByCategory: {
          ...formData.subcategoriesByCategory,
          [categoryId]: currentSubcategories.filter(
            item => item.id !== subcategory.id,
          ),
        },
      });
    } else {
      setFormData({
        ...formData,
        subcategoriesByCategory: {
          ...formData.subcategoriesByCategory,
          [categoryId]: [...currentSubcategories, subcategory],
        },
      });
    }
  };

  const stepBack = () => {
    if (step === 1) {
      setStep(0);
    }
  };

  const hasSelectedSubcategories = () => {
    return Object.values(formData.subcategoriesByCategory).some(
      subcats => subcats.length > 0,
    );
  };

  const titleByStep = step => {
    return t('Select the categories in which you provide services');
  };

  const handleSave = async () => {
    const formattedCategories = formData.categories.map(category => ({
      id: category.id,
      name: category.name,
      subcategories: formData.subcategoriesByCategory[category.id] || [],
    }));

    // ✅ Сохраняем категории в Redux
    dispatch(set_categories(formattedCategories));

    // ✅ Отправляем рабочие настройки на сервер для workers
    if (auth.userData?.type == 0) {
      // Если это worker/executor
      setSubmitting(true);
      try {
        const workSettings = {
          'work-settings': formattedCategories.map(cat => ({
            direction: cat.id,
            types: (formData.subcategoriesByCategory[cat.id] || []).map(
              sub => sub.id,
            ),
          })),
        };

        await retryApiCall(() => api.user.setWorkSettings(workSettings));
        console.log('Рабочие настройки успешно сохранены на сервере');
      } catch (error) {
        console.error('Ошибка при сохранении рабочих настроек:', error);
        // Не показываем ошибку пользователю, продолжаем навигацию
      } finally {
        setSubmitting(false);
      }
    }

    route?.params?.fromReg
      ? navigation.reset({
          index: 0,
          routes: [{name: 'MainStack'}],
        })
      : navigation.pop();
  };

  const handleNextOrSave = () => {
    if (step === 0) {
      setStep(1);
    } else {
      handleSave();
    }
  };

  const handleBackAction = () => {
    if (step === 1) {
      stepBack();
    } else {
      navigation.pop();
    }
  };

  const isNextButtonDisabled = () => {
    return step === 0
      ? formData.categories.length === 0
      : !hasSelectedSubcategories();
  };

  const isSelectedCategory = categoryId => {
    return formData.categories.some(cat => cat.id === categoryId);
  };

  const isSelectedSubcategory = (categoryId, subcategoryId) => {
    return (formData.subcategoriesByCategory[categoryId] || []).some(
      sub => sub.id === subcategoryId,
    );
  };

  const getSubcategoriesForCategory = categoryId => {
    return subcategories[categoryId] || [];
  };

  return {
    categories,
    subcategories,
    loading,
    error,
    submitting,
    step,
    formData,
    titleByStep,
    toggleCategory,
    toggleSubcategory,
    handleNextOrSave,
    handleBackAction,
    isNextButtonDisabled,
    isSelectedCategory,
    isSelectedSubcategory,
    getSubcategoriesForCategory,
    route,
  };
};

export default useSelectDirection;
