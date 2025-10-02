import {useNavigation} from '@react-navigation/native';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import * as yup from 'yup';
import YupPassword from 'yup-password';
import {api, retryApiCall, setApiToken} from '../services/index';
import {handleErrorResponse} from '../services/utils';
import {useSelector, useDispatch} from 'react-redux';

YupPassword(yup);

export function useChangePasswordByEmail() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const userData = useSelector(state => state.auth.userData);

  const [formData, setFormData] = useState({
    code: '',
    new_password: '',
    confirmed_password: '',
  });

  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(0); // 0: отправка кода, 1: ввод кода, 2: ввод пароля, 3: успех
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (target, value) => {
    setFormData({...formData, [target]: value});
  };

  const validate = async () => {
    let userSchema;
    switch (step) {
      case 0:
        // Нет валидации, используем email из профиля пользователя
        return true;
      case 1:
        userSchema = yup.object({
          code: yup
            .string()
            .required(t('Code is required'))
            .matches(/^[0-9]+$/, t('Code must contain only digits'))
            .min(4, t('Code must be at least 4 digits')),
        });
        return await userSchema.validate(formData, {abortEarly: false});
      case 2:
        userSchema = yup.object({
          new_password: yup
            .string()
            .min(8, t('Password must be at list 8 characters long'))
            .matches(/[0-9]/, t('Password requires a number'))
            .matches(/[a-z]/, t('Password requires a lowercase letter'))
            .matches(/[A-Z]/, t('Password requires an uppercase letter'))
            .matches(/[^\w]/, t('Password requires a symbol'))
            .matches(/^\S*$/, t('Password must not to contain blank spaces')),
          confirmed_password: yup
            .string()
            .oneOf([yup.ref('new_password'), null], t('Passwords must match')),
        });
        return await userSchema.validate(formData, {abortEarly: false});
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setErrors([]);
    setIsLoading(true);

    try {
      const isValid = await validate();

      if (!isValid) {
        setIsLoading(false);
        return;
      }

      switch (step) {
        case 0:
          // Отправляем код на email пользователя
          const response = await retryApiCall(() =>
            api.changePassword.sendCode({
              email: userData?.email,
            }),
          );

          if (response.success) {
            setStep(1);
          } else {
            handleErrorResponse(response, setErrors);
          }
          break;

        case 1:
          // Переходим к вводу пароля (код сохраняется)
          setStep(2);
          break;

        case 2:
          // Подтверждаем смену пароля
          const confirmResponse = await retryApiCall(() =>
            api.changePassword.confirm({
              code: formData.code,
              new_password: formData.new_password,
              confirmed_password: formData.confirmed_password,
            }),
          );

          if (confirmResponse.success) {
            setStep(3);
          } else {
            handleErrorResponse(confirmResponse, setErrors);
          }
          break;

        case 3:
          // Разлогиниваем пользователя и редиректим на онбординг
          setApiToken(null);
          dispatch({type: 'LOG_OUT'});
          navigation.reset({
            index: 0,
            routes: [{name: 'MainStack'}],
          });
          break;

        default:
          break;
      }
    } catch (error) {
      if (error.inner) {
        setErrors(error.inner.map(e => ({path: e.path, message: e.message})));
      } else {
        setErrors([{path: 'general', message: t('An error occurred')}]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUserEmail = () => {
    return userData?.email || '';
  };

  return {
    step,
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit,
    getUserEmail,
  };
}
