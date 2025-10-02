import React, {useState, useEffect} from 'react';
import {ActivityIndicator, Dimensions, View} from 'react-native';
import {useSelector} from 'react-redux';
import HeaderBack from '../headers/HeaderBack';
import styles from '../styles';
import {LoadingComponent} from './Loading';
import WebView from 'react-native-webview';
import config from '../config';

export default function WebPage({navigation, route}) {
  const auth = useSelector(state => state.auth);
  const [logged, setLogged] = useState(auth.logged);

  useEffect(() => {
    if (auth.logged !== logged) {
      navigation.pop();
    }
  }, [auth]);
  const uri = route.params.url;
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: styles.colors.background,
      }}>
      <HeaderBack action={() => navigation.pop()} />
      <WebView
        startInLoadingState={true}
        source={{uri}}
        renderLoading={() => (
          <LoadingComponent text="Loading page..." />
        )}
        style={{
          height: '100%',
          width: Dimensions.get('window').width,
          flex: 1,
          alignItems: 'center',
          backgroundColor: styles.colors.background,
        }}
      />
    </View>
  );
}
