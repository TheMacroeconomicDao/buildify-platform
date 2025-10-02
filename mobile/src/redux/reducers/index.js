import {combineReducers} from 'redux';
import {auth} from './auth';
import {notifications} from './notifications';
import {subscriptions} from './subscriptions';
import {websocket} from './websocket';

const appReducer = combineReducers({
  auth,
  notifications,
  subscriptions,
  websocket,
});

const rootReducer = (state, action) => {
  return appReducer(state, action);
};

export default rootReducer;
