import {useState, useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {notifyError, notifySuccess} from '../services/notify';
import {useTranslation} from 'react-i18next';
import unifiedApi from '../services/unified-api';

const usePortfolio = executorId => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [myPortfolios, setMyPortfolios] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Получить профиль исполнителя с портфолио
  const fetchExecutorProfile = useCallback(
    async id => {
      try {
        setLoading(true);
        setError(null);
        const response = await unifiedApi.executors.executorsDetail(id);
        if (response.success) {
          setProfile(response.result);
          return response.result;
        } else {
          throw new Error(response.message || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching executor profile:', error);
        setError(error.message || 'Failed to load profile');
        // Не показываем уведомление об ошибке, так как будем показывать её в UI
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  // Получить своё портфолио
  const fetchMyPortfolio = useCallback(async () => {
    try {
      console.log('usePortfolio: fetchMyPortfolio started');
      setLoading(true);
      setError(null);
      const response = await unifiedApi.request({
        method: 'GET',
        url: '/portfolio',
      });
      console.log('usePortfolio: fetchMyPortfolio response', response);
      if (response.success) {
        console.log('usePortfolio: Setting myPortfolios', response.result);
        setMyPortfolios(response.result || []);
        return response.result;
      } else {
        throw new Error(response.message || 'Failed to load portfolio');
      }
    } catch (error) {
      console.error('Error fetching my portfolio:', error);
      notifyError(t('Error'), error.message || t('Failed to load data'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Создать новое портфолио
  const createPortfolio = async portfolioData => {
    try {
      setUploading(true);

      // Подготавливаем данные согласно API спецификации
      const apiData = {
        name: portfolioData.name,
        type: portfolioData.type,
      };

      // Добавляем описание если есть
      if (portfolioData.description) {
        apiData.description = portfolioData.description;
      }

      // Добавляем поля в зависимости от типа
      if (portfolioData.type === 'link') {
        apiData.external_url = portfolioData.external_url;
      } else if (portfolioData.type === 'media') {
        apiData.files = portfolioData.files;
      }

      const response = await unifiedApi.request({
        method: 'POST',
        url: '/portfolio',
        data: apiData,
      });

      if (response.success) {
        console.log(
          'usePortfolio: Portfolio created successfully',
          response.result,
        );
        // Всегда обновляем собственное портфолио после создания
        // так как создание всегда происходит для собственного портфолио
        console.log('usePortfolio: Refreshing portfolio data after creation');
        await fetchMyPortfolio();
        notifySuccess(t('Success'), t('Portfolio created'));
        return response.result;
      } else {
        throw new Error(response.message || 'Failed to create portfolio');
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      notifyError(t('Error'), error.message || t('Failed to create portfolio'));
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Обновить портфолио
  const updatePortfolio = async (portfolioId, portfolioData) => {
    try {
      setUploading(true);
      const response = await unifiedApi.request({
        method: 'PUT',
        url: `/portfolio/${portfolioId}`,
        data: portfolioData,
      });
      if (response.success) {
        // Обновляем список портфолио
        await fetchMyPortfolio();
        notifySuccess(t('Success'), t('Portfolio updated'));
        return response.result;
      } else {
        throw new Error(response.message || 'Failed to update portfolio');
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
      notifyError(t('Error'), error.message || t('Failed to update portfolio'));
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Удалить портфолио
  const deletePortfolio = async portfolioId => {
    try {
      setUploading(true);
      const response = await unifiedApi.request({
        method: 'DELETE',
        url: `/portfolio/${portfolioId}`,
      });
      if (response.success) {
        // Обновляем список портфолио
        await fetchMyPortfolio();
        notifySuccess(t('Success'), t('Portfolio deleted'));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete portfolio');
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      notifyError(t('Error'), error.message || t('Failed to delete portfolio'));
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Получить конкретное портфолио
  const fetchPortfolioDetails = async portfolioId => {
    try {
      setLoading(true);
      const response = await unifiedApi.request({
        method: 'GET',
        url: `/portfolio/${portfolioId}`,
      });
      if (response.success) {
        return response.result;
      } else {
        throw new Error(response.message || 'Failed to load portfolio');
      }
    } catch (error) {
      console.error('Error fetching portfolio details:', error);
      notifyError(t('Error'), error.message || t('Failed to load data'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Загрузить файл
  const uploadFile = async fileData => {
    try {
      setUploading(true);
      const formData = new FormData();

      // Правильно формируем данные файла для загрузки
      formData.append('file', {
        uri: fileData.uri,
        type: fileData.type,
        name: fileData.name,
      });

      const response = await unifiedApi.files.storeCreate(formData);

      if (response.success) {
        return response.result;
      } else {
        throw new Error(response.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      notifyError(
        t('Error'),
        error.message || t('Failed to upload file. Please try again.'),
      );
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Автоматически загружаем данные при монтировании компонента
  useEffect(() => {
    if (executorId) {
      fetchExecutorProfile(executorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executorId]);

  return {
    loading,
    uploading,
    profile,
    myPortfolios,
    error,

    // Методы для работы с API
    fetchExecutorProfile,
    fetchMyPortfolio,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    fetchPortfolioDetails,
    uploadFile,
  };
};

export default usePortfolio;
