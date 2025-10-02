const initialState = {
  logged: false,
  token: null,
  refreshToken: null,
  userData: null,
  categories: [],
};

export const auth = (state = initialState, action) => {
  switch (action.type) {
    case 'LOG_IN':
      return {
        ...state,
        logged: true,
        token: action.payload.token,
        userData: action.payload.userData,
      };

    case 'LOG_OUT':
      return {
        ...initialState,
      };

    case 'SET_USERDATA':
      console.log('=== REDUX SET_USERDATA ===');
      console.log(
        'Current state.userData:',
        JSON.stringify(state.userData, null, 2),
      );
      console.log('action.payload:', JSON.stringify(action.payload, null, 2));
      const newUserData = {...state.userData, ...action.payload};
      console.log(
        'New userData after merge:',
        JSON.stringify(newUserData, null, 2),
      );
      return {
        ...state,
        userData: newUserData,
      };

    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };
    default:
      return state;
  }
};
