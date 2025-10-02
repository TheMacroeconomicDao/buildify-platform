import {api, retryApiCall} from '../services/index';
import {useDispatch} from 'react-redux';
import {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import * as yup from 'yup';
import YupPassword from 'yup-password';
import {handleErrorResponse} from '../services/utils';
YupPassword(yup);

export function usePasswordRecovery() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    password: '',
    confirmed_password: '',
  });
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(0);
  const handleInputChange = (target, value) => {
    setFormData({...formData, [target]: value});
  };

  const validate = async () => {
    let userSchema;
    switch (step) {
      case 0:
        userSchema = yup.object({
          email: yup.string().required().email(),
        });
        return await userSchema.validate(formData, {abortEarly: false});
      case 1:
        userSchema = yup.object({
          email: yup
            .string()
            .email('Email is not valid')
            .required('Email is required'),
          code: yup
            .string()
            .required('Code is required')
            .matches(/^[0-9]+$/, 'Code must contain only digits')
            .min(4, 'Code must be exactly 4 digits'),
          password: yup
            .string()
            .min(8, 'Password must be at list 8 characters long')
            .matches(/[0-9]/, 'Password requires a number')
            .matches(/[a-z]/, 'Password requires a lowercase letter')
            .matches(/[A-Z]/, 'Password requires an uppercase letter')
            .matches(/[^\w]/, 'Password requires a symbol')
            .matches(/^\S*$/, 'Password must not to contain blank spaces'),
          confirmed_password: yup
            .string()
            .oneOf([yup.ref('password'), null], 'Passwords must match'),
        });
        return await userSchema.validate(formData, {abortEarly: false});
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    setErrors([]);
    validate()
      .then(() => {
        switch (step) {
          case 0:
            // ✅ Приводим email к нижнему регистру перед отправкой
            return retryApiCall(() =>
              api.passwordRecovery.apiPasswordRecovery({
                email: formData.email.toLowerCase(),
              }),
            )
              .then(response => {
                if (response.success) {
                  setStep(step + 1);
                } else if (response.success === false) {
                  handleErrorResponse(response, setErrors);
                }
              })
              .catch(e =>
                handleErrorResponse(e, setErrors, {
                  showNotification: true,
                }),
              );
          case 1:
            // ✅ Исправлено: используем правильный endpoint для восстановления пароля
            // ✅ Приводим email к нижнему регистру перед отправкой
            return retryApiCall(() =>
              api.changePassword.apiChangePassword({
                email: formData.email.toLowerCase(),
                password: formData.password,
                confirmed_password: formData.confirmed_password,
                code: formData.code,
              }),
            )
              .then(response => {
                if (response.success) {
                  navigation.pop();
                } else if (response.success === false) {
                  handleErrorResponse(response, setErrors);
                }
              })
              .catch(e =>
                handleErrorResponse(e, setErrors, {
                  showNotification: true,
                }),
              );
          default:
            return;
        }
      })
      .catch(e => setErrors(innerToArray(e.inner)));
  };

  const innerToArray = inner => {
    return inner.map(e => ({path: e.path, message: e.message}));
  };

  return {step, formData, errors, handleInputChange, handleSubmit};
}
