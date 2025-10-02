import {api, retryApiCall} from '../services/index';
import {useDispatch} from 'react-redux';
import {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import * as yup from 'yup';
import YupPassword from 'yup-password';
import {handleErrorResponse} from '../services/utils';
import {innerToArray} from './useRegistration';
YupPassword(yup);

export function useChangePassword() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    password: '',
    new_password: '',
    confirmed_password: '',
  });
  const [errors, setErrors] = useState([]);
  const handleInputChange = (target, value) => {
    setFormData({...formData, [target]: value});
  };
  const [status, setStatus] = useState('');

  const validate = async () => {
    let userSchema = yup.object({
      password: yup
        .string()
        .min(8, 'Password must be at list 8 characters long')
        .matches(/[0-9]/, 'Password requires a number')
        .matches(/[a-z]/, 'Password requires a lowercase letter')
        .matches(/[A-Z]/, 'Password requires an uppercase letter')
        .matches(/[^\w]/, 'Password requires a symbol')
        .matches(/^\S*$/, 'Password must not to contain blank spaces'),
      new_password: yup
        .string()
        .min(8, 'Password must be at list 8 characters long')
        .matches(/[0-9]/, 'Password requires a number')
        .matches(/[a-z]/, 'Password requires a lowercase letter')
        .matches(/[A-Z]/, 'Password requires an uppercase letter')
        .matches(/[^\w]/, 'Password requires a symbol')
        .matches(/^\S*$/, 'Password must not to contain blank spaces'),
      confirmed_password: yup
        .string()
        .oneOf([yup.ref('new_password'), null], 'Passwords must match'),
    });
    return await userSchema.validate(formData, {abortEarly: false});
  };

  const handleSubmit = () => {
    setErrors([]);
    validate()
      .then(() => {
        retryApiCall(() =>
          api.user.apiUserChangePassword({
            password: formData.password,
            new_password: formData.new_password,
          }),
        )
          .then(response => {
            if (response.success) {
              setStatus(response.result);
            } else if (response.success === false) {
              handleErrorResponse(response, setErrors);
            }
          })
          .catch(e =>
            handleErrorResponse(e, setErrors, {
              showNotification: true,
            }),
          );
      })
      .catch(e => setErrors(innerToArray(e.inner)));
  };
  return {formData, errors, handleInputChange, handleSubmit, status};
}
