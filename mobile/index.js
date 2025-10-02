/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import './src/lang/i18n';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
