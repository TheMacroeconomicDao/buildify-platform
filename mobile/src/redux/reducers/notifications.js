const initialState = {
  modal_visible: false,
  unread_count: 0,
  new_responses_count: 0,
};

export const notifications = (state = initialState, action) => {
  switch (action.type) {
    case 'SHOW_MODAL':
      return {
        ...state,
        modal_visible: true,
      };
    case 'HIDE_MODAL':
      return {
        ...state,
        modal_visible: false,
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unread_count: action.payload || 0,
      };
    case 'SET_NEW_RESPONSES_COUNT':
      return {
        ...state,
        new_responses_count: action.payload || 0,
      };

    default:
      return state;
  }
};

// Action creators
export const setNewResponsesCount = count => ({
  type: 'SET_NEW_RESPONSES_COUNT',
  payload: count,
});

export const setUnreadCount = count => ({
  type: 'SET_UNREAD_COUNT',
  payload: count,
});
