import {useEffect} from 'react';
import {useSelector} from 'react-redux';

export const useLoading = navigation => {
  const auth = useSelector(state => state.auth);

  // Убираем автоматическое перенаправление для тестирования онбординга
  // useEffect(() => {
  //   if (auth.logged) {
  //     navigation.replace('MainStack');
  //   } else {
  //     navigation.replace('Auth');
  //   }
  // }, [auth, navigation]);

  return {
    auth,
  };
};

export default useLoading;
