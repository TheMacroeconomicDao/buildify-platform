import React from 'react';
import {ActivityIndicator, Dimensions, View} from 'react-native';
import HeaderBack from '../headers/HeaderBack';
import styles from '../styles';
import {LoadingComponent} from './Loading';import WebView from 'react-native-webview';
import useWebPagePay from '../hooks/useWebPagePay';

export default function WebPagePay({navigation, route}) {
  const {uri, handleNavigationStateChange} = useWebPagePay({
    paymentUrl: route.params.url,
    context: route.params?.context,
  });

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
          <View style={{height: '100%', justifyContent: 'center'}}>
            <LoadingComponent text={t('Loading...')} />
          </View>
        )}
        style={{
          height: '100%',
          width: Dimensions.get('window').width,
          flex: 1,
          alignItems: 'center',
          backgroundColor: styles.colors.background,
        }}
        onNavigationStateChange={handleNavigationStateChange} // Отслеживаем изменения URL
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        allowsFullscreenVideo={false}
        allowsBackForwardNavigationGestures={false}
        cacheEnabled={true}
        onError={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        onHttpError={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.error('WebView HTTP error: ', nativeEvent);
        }}
        onLoadStart={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.log('WebView load start: ', nativeEvent.url);
        }}
        onLoadEnd={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.log('WebView load end: ', nativeEvent.url);
        }}
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile; rv:81.0) Gecko/81.0 Firefox/81.0"
      />
    </View>
  );
}
