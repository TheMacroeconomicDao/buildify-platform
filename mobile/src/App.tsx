import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {PersistGate} from 'redux-persist/integration/react';
import {Provider, useSelector} from 'react-redux';
import {store, persistor} from './redux/store/dev';
import {StatusBar, View, ActivityIndicator, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styles from './styles';
import {AlertNotificationRoot} from 'react-native-alert-notification';
import {navigationRef} from './services/RootNavigation';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomTabBar from './components/CustomTabBar';

import WebPage from './screens/WebPage';
import Auth from './screens/Auth';
import PasswordRecovery from './screens/PasswordRecovery';
import Main from './screens/Main';
import Registration from './screens/Registration';
import Loading, {LoadingComponent} from './screens/Loading';
// import Menu from './screens/Menu'; // Заменен на WorkerProfile
import PersonalData from './screens/PersonalData';
import Notifications from './screens/Notifications';
import {useTranslation} from 'react-i18next';
import PayResult from './screens/PayResult';
import Support from './screens/Support';
import Language from './screens/Language';
import AboutApp from './screens/AboutApp';
import ErrorBoundary from 'react-native-error-boundary';
import ErrorFallback from './components/ErrorFallBack';
import WebSocketProvider from './components/WebSocketProvider';
import WebPagePay from './screens/WebPagePay';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import CreateOrder from './screens/CreateOrder';
import Order from './screens/Order';
import OrderWorker from './screens/OrderWorker';
import WebSocketTest from './screens/WebSocketTest';
import MainWorker from './screens/MainWorker';
import MainMediator from './screens/MainMediator';
import SelectDirection from './screens/SelectDirection';
import SearchOrders from './screens/SearchOrders';
import OrderEdit from './screens/OrderEdit';
import ChatGPTDesignGeneration from './screens/ChatGPTDesignGeneration';
import DesignResult from './screens/DesignResult';
import Subscription from './screens/Subscription';
import Wallet from './screens/Wallet';
import WorkerProfile from './screens/WorkerProfile';
import ChangePasswordByEmail from './screens/ChangePasswordByEmail';
import Portfolio from './screens/Portfolio';
import CreatePortfolio from './screens/CreatePortfolio';
import PortfolioDetails from './screens/PortfolioDetails';
import FAQ from './screens/FAQ';
import RatingAndReviews from './screens/RatingAndReviews';
import AllReviews from './screens/AllReviews';
import OnboardingModal from './components/OnboardingModal';
import useOnboarding from './hooks/useOnboarding';
import OrdersList from './screens/OrdersList';
import ArchivedOrders from './screens/ArchivedOrders';
import CustomerProfile from './screens/CustomerProfile';
import Executors from './screens/Executors';
import MediatorDeals from './screens/MediatorDeals';
import MediatorFinances from './screens/MediatorFinances';
import MediatorOrderSteps from './screens/MediatorOrderSteps';
import MediatorExecutorSearch from './screens/MediatorExecutorSearch';
import MediatorOrderPreview from './screens/MediatorOrderPreview';
import MediatorComments from './screens/MediatorComments';
import Referrals from './screens/Referrals';

const Tab = createBottomTabNavigator();
const AppStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const CreateOrderStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const SearchOrderStack = createNativeStackNavigator();

function MainStackScreen() {
  const auth = useSelector((state: any) => state.auth);
  const user_type = auth?.userData?.type || 0; // 0 - исполнитель, 1 - заказчик, 2 - посредник

  console.log('MainStackScreen: Auth state:', auth);
  console.log('MainStackScreen: User type:', user_type);
  console.log('MainStackScreen: User data:', auth?.userData);

  let initialRoute = 'Main'; // По умолчанию заказчик
  if (user_type == '0') {
    initialRoute = 'MainWorker';
    console.log('MainStackScreen: Routing to MainWorker (Executor)');
  } else if (user_type == '2') {
    initialRoute = 'MainMediator';
    console.log('MainStackScreen: Routing to MainMediator (Mediator)');
  } else {
    console.log('MainStackScreen: Routing to Main (Customer)');
  }

  return (
    <MainStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        navigationBarColor: styles.colors.background,
        animation: 'fade_from_bottom',
      }}>
      <MainStack.Screen name="Main" component={Main} />
      <MainStack.Screen name="MainWorker" component={MainWorker} />
      <MainStack.Screen name="MainMediator" component={MainMediator} />
    </MainStack.Navigator>
  );
}

function CreateOrderStackScreen() {
  return (
    <CreateOrderStack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: styles.colors.background,
        animation: 'fade_from_bottom',
      }}>
      <CreateOrderStack.Screen name="CreateOrder" component={CreateOrder} />
    </CreateOrderStack.Navigator>
  );
}

function SearchOrderStackScreen() {
  return (
    <SearchOrderStack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: styles.colors.background,
        animation: 'fade_from_bottom',
      }}>
      <SearchOrderStack.Screen name="SearchOrder" component={SearchOrders} />
    </SearchOrderStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: styles.colors.background,
        animation: 'fade_from_bottom',
      }}>
      <ProfileStack.Screen name="ProfileScreen" component={WorkerProfile} />
    </ProfileStack.Navigator>
  );
}

function TabStack() {
  const {t} = useTranslation();
  const auth = useSelector((state: any) => state.auth);
  const user_type = auth?.userData?.type || 0; // 0 - исполнитель, 1 - заказчик

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Home" component={MainStackScreen} />
      <Tab.Screen name="OrdersList" component={OrdersList} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

// Компонент с онбордингом
function TabStackWithOnboarding() {
  const {showOnboarding, isLoading, userType, completeOnboarding} =
    useOnboarding();

  if (isLoading) {
    return null; // Или показать загрузку
  }

  return (
    <>
      <TabStack />
      <OnboardingModal
        visible={showOnboarding}
        userType={userType}
        onComplete={completeOnboarding}
      />
    </>
  );
}

// Компонент загрузки для PersistGate
function LoadingScreen() {
  return <LoadingComponent showText={false} />;
}

function App() {
  return (
    <Provider store={store}>
      <StatusBar
        animated={true}
        hidden={false}
        backgroundColor={styles.colors.background}
        barStyle={'dark-content'}
      />
      <SafeAreaProvider>
        <SafeAreaView
          edges={['top']}
          style={{
            flex: 1,
          }}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <PersistGateApp />
          </ErrorBoundary>
        </SafeAreaView>
      </SafeAreaProvider>
    </Provider>
  );
}

function PersistGateApp() {
  try {
    return (
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <WebSocketProvider>
          <AlertNotificationRoot theme="light">
            <NavigationContainer ref={navigationRef}>
              <AppStack.Navigator
                initialRouteName={'Loading'}
                screenOptions={{
                  headerShown: false,
                  navigationBarColor: styles.colors.white,
                  animation: 'slide_from_right',
                  orientation: 'portrait',
                }}>
                <AppStack.Screen name="Loading" component={Loading} />
                <AppStack.Screen name="Auth" component={Auth} />
                <AppStack.Screen
                  name="PasswordRecovery"
                  component={PasswordRecovery}
                />
                <AppStack.Screen name="Register" component={Registration} />
                <AppStack.Screen
                  name="MainStack"
                  component={TabStackWithOnboarding}
                />
                <AppStack.Screen name="WebPage" component={WebPage} />
                <AppStack.Screen
                  name="SelectDirection"
                  component={SelectDirection}
                />
                <AppStack.Screen name="WebPagePay" component={WebPagePay} />
                <AppStack.Screen name="Wallet" component={Wallet} />
                <AppStack.Screen name="PersonalData" component={PersonalData} />
                <AppStack.Screen
                  name="Notifications"
                  component={Notifications}
                />
                <AppStack.Screen name="PayResult" component={PayResult} />
                <AppStack.Screen name="Support" component={Support} />
                <AppStack.Screen name="Language" component={Language} />
                <AppStack.Screen name="AboutApp" component={AboutApp} />
                <AppStack.Screen name="Order" component={Order} />
                <AppStack.Screen name="OrderEdit" component={OrderEdit} />
                <AppStack.Screen
                  name="ArchivedOrders"
                  component={ArchivedOrders}
                />
                <AppStack.Screen name="OrderWorker" component={OrderWorker} />
                <AppStack.Screen
                  name="DesignGeneration"
                  component={ChatGPTDesignGeneration}
                />
                <AppStack.Screen name="DesignResult" component={DesignResult} />
                <AppStack.Screen name="Subscription" component={Subscription} />
                <AppStack.Screen name="Portfolio" component={Portfolio} />
                <AppStack.Screen
                  name="CreatePortfolio"
                  component={CreatePortfolio}
                />
                <AppStack.Screen
                  name="PortfolioDetails"
                  component={PortfolioDetails}
                />
                <AppStack.Screen
                  name="WorkerProfile"
                  component={WorkerProfile}
                />
                <AppStack.Screen
                  name="ChangePasswordByEmail"
                  component={ChangePasswordByEmail}
                />
                <AppStack.Screen name="FAQ" component={FAQ} />
                <AppStack.Screen
                  name="RatingAndReviews"
                  component={RatingAndReviews}
                />
                <AppStack.Screen name="AllReviews" component={AllReviews} />
                <AppStack.Screen
                  name="CustomerProfile"
                  component={CustomerProfile}
                />
                <AppStack.Screen name="Executors" component={Executors} />
                <AppStack.Screen
                  name="MediatorDeals"
                  component={MediatorDeals}
                />
                <AppStack.Screen
                  name="MediatorFinances"
                  component={MediatorFinances}
                />
                <AppStack.Screen
                  name="MediatorOrderSteps"
                  component={MediatorOrderSteps}
                />
                <AppStack.Screen
                  name="MediatorExecutorSearch"
                  component={MediatorExecutorSearch}
                />
                <AppStack.Screen
                  name="MediatorOrderPreview"
                  component={MediatorOrderPreview}
                />
                <AppStack.Screen
                  name="MediatorComments"
                  component={MediatorComments}
                />
                <AppStack.Screen name="CreateOrder" component={CreateOrder} />
                <AppStack.Screen
                  name="WebSocketTest"
                  component={WebSocketTest}
                />
                <AppStack.Screen name="Referrals" component={Referrals} />
              </AppStack.Navigator>
            </NavigationContainer>
          </AlertNotificationRoot>
        </WebSocketProvider>
      </PersistGate>
    );
  } catch (err) {
    console.error(err);
  }
}

export default App;
