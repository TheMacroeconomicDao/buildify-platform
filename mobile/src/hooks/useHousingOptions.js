import {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {api, retryApiCall} from '../services/index';

export const useHousingOptions = () => {
  const {i18n} = useTranslation();
  const [housingOptions, setHousingOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHousingOptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await retryApiCall(() =>
        api.request({
          method: 'GET',
          url: '/housing-options',
        }),
      );

      if (response.success && response.result) {
        // Преобразуем данные для использования в компоненте
        const options = {};
        const currentLang = i18n.language || 'en';

        Object.keys(response.result).forEach(type => {
          options[type] = response.result[type].map(option => ({
            key: option.key,
            value: currentLang === 'ar' ? option.label_ar : option.label_en,
          }));
        });

        setHousingOptions(options);
      } else {
        throw new Error(response.message || 'Failed to load housing options');
      }
    } catch (error) {
      console.error('Error loading housing options:', error);
      setError(error.message);
      // Fallback к хардкоду при ошибке
      setHousingOptions(getDefaultOptions());
    } finally {
      setLoading(false);
    }
  };

  // Дефолтные опции как fallback (без переводов)
  const getDefaultOptions = () => {
    return {
      housing_type: [
        {key: 'apartment', value: 'Apartment'},
        {key: 'house', value: 'House / villa'},
        {key: 'commercial', value: 'Commercial property'},
      ],
      housing_condition: [
        {key: 'new', value: 'New housing'},
        {key: 'secondary', value: 'Secondary housing'},
      ],
      housing_preparation_level: [
        {key: 'without_walls', value: 'Without walls'},
        {key: 'rough_finish', value: 'Rough finish'},
        {key: 'finish_finish', value: 'Finish finish'},
      ],
      bathroom_type: [
        {key: 'separate', value: 'Separate'},
        {key: 'combined', value: 'Combined'},
      ],
    };
  };

  useEffect(() => {
    fetchHousingOptions();
  }, [i18n.language]); // Перезагружаем при смене языка

  return {
    housingOptions,
    loading,
    error,
    refetch: fetchHousingOptions,
  };
};

export default useHousingOptions;
