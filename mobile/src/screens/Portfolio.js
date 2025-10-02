import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Text from '../components/Text';
import PortfolioItem from '../components/PortfolioItem';
import ContactsBlock from '../components/ContactsBlock';
import HeaderBack from '../headers/HeaderBack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import usePortfolio from '../hooks/usePortfolio';
import styles from '../styles';
import {LoadingComponent} from './Loading';

export default function Portfolio({navigation, route}) {
  const {t} = useTranslation();
  const {executorId} = route?.params || {};
  const logged = useSelector(state => state.auth.logged);
  const userData = useSelector(state => state.auth.userData);

  // Определяем, это собственное портфолио или чужое
  const isOwnPortfolio =
    !executorId ||
    (executorId &&
      userData?.id &&
      executorId.toString() === userData.id.toString());

  console.log('Portfolio: isOwnPortfolio calculation', {
    executorId,
    userDataId: userData?.id,
    executorIdStr: executorId?.toString(),
    userDataIdStr: userData?.id?.toString(),
    isOwnPortfolio,
  });

  const {
    loading,
    profile,
    myPortfolios,
    error,
    fetchExecutorProfile,
    fetchMyPortfolio,
  } = usePortfolio(executorId);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (isOwnPortfolio) {
        await fetchMyPortfolio();
      } else if (executorId) {
        await fetchExecutorProfile(executorId);
      }
    } finally {
      setRefreshing(false);
    }
  }, [executorId, isOwnPortfolio, fetchExecutorProfile, fetchMyPortfolio]);

  const handlePortfolioPress = portfolio => {
    navigation.navigate('PortfolioDetails', {portfolio});
  };

  const handleAddPortfolio = () => {
    navigation.navigate('CreatePortfolio', {executorId});
  };

  const goBack = () => {
    navigation.goBack();
  };

  // Обновляем данные портфолио при фокусе на экран
  useFocusEffect(
    React.useCallback(() => {
      console.log('Portfolio: useFocusEffect triggered', {
        isOwnPortfolio,
        executorId,
        logged,
      });

      // Для собственного портфолио проверяем авторизацию
      if (isOwnPortfolio) {
        if (!logged) {
          console.log(
            'Portfolio: User not logged in, skipping my portfolio load',
          );
          return;
        }
        console.log('Portfolio: Loading my portfolio');
        fetchMyPortfolio();
        return;
      }

      // Для просмотра чужого портфолио авторизация не нужна
      if (executorId) {
        console.log('Portfolio: Loading executor profile', executorId);
        fetchExecutorProfile(executorId);
      }
    }, [
      logged,
      executorId,
      isOwnPortfolio,
      fetchExecutorProfile,
      fetchMyPortfolio,
    ]),
  );

  // Показываем загрузку если данные еще не загружены
  if (loading || (executorId && !profile && !error)) {
    return <LoadingComponent text={t('Loading...')} />;
  }

  // Показываем ошибку если профиль не найден
  if (executorId && !profile && error) {
    return (
      <View style={portfolioStyles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={styles.colors.red} />
        <Text style={portfolioStyles.errorText}>{t('Profile not found')}</Text>
        <TouchableOpacity style={portfolioStyles.backButton} onPress={goBack}>
          <Text style={portfolioStyles.backButtonText}>{t('Back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={portfolioStyles.container}>
      {/* HEADER */}
      <HeaderBack title={t('Portfolio')} action={goBack} center={true} />

      <ScrollView
        style={portfolioStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* CONTACTS только для экрана исполнителя */}
        {executorId && <ContactsBlock profile={profile} />}

        {/* PORTFOLIO SECTION */}
        <View style={portfolioStyles.portfolioSection}>
          {(() => {
            const portfolios = isOwnPortfolio
              ? myPortfolios
              : profile?.portfolios;
            console.log('Portfolio: Rendering portfolios', {
              executorId,
              isOwnPortfolio,
              portfolios: portfolios?.length || 0,
              myPortfolios: myPortfolios?.length || 0,
              profilePortfolios: profile?.portfolios?.length || 0,
            });
            return (
              portfolios &&
              portfolios.length > 0 && (
                <View style={portfolioStyles.portfolioList}>
                  {portfolios.map(portfolio => (
                    <PortfolioItem
                      key={portfolio.id}
                      portfolio={portfolio}
                      onPress={handlePortfolioPress}
                    />
                  ))}
                </View>
              )
            );
          })()}
        </View>

        {/* Пустое состояние для портфолио */}
        {!(isOwnPortfolio ? myPortfolios : profile?.portfolios)?.length && (
          <View style={portfolioStyles.emptyPortfolio}>
            <Ionicons
              name="images"
              size={48}
              color={styles.colors.actionGray}
            />
            <Text style={portfolioStyles.emptyPortfolioText}>
              {t('Portfolio is empty')}
            </Text>
            {/* Кнопка добавить для пустого портфолио (только для собственного портфолио) */}
            {isOwnPortfolio && (
              <TouchableOpacity
                style={portfolioStyles.emptyAddButton}
                onPress={handleAddPortfolio}
                activeOpacity={0.7}>
                <Text style={portfolioStyles.emptyAddButtonText}>
                  {t('Add folder')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Кнопка добавить для непустого портфолио (только для собственного портфолио) */}
        {isOwnPortfolio &&
          (isOwnPortfolio ? myPortfolios : profile?.portfolios)?.length > 0 && (
            <View style={portfolioStyles.bottomCreateWrap}>
              <TouchableOpacity
                style={portfolioStyles.createButton}
                onPress={handleAddPortfolio}
                activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={styles.colors.white} />
                <Text style={portfolioStyles.createButtonText}>
                  {t('Add folder')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        {/* Отступ снизу */}
        <View style={portfolioStyles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const portfolioStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: styles.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: styles.borderR,
  },
  backButtonText: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.white,
    textAlign: 'center',
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },

  // Portfolio section
  portfolioSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: styles.fonSize.lg,
    fontWeight: '600',
    color: styles.colors.titles,
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: styles.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: styles.colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  portfolioList: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Empty portfolio
  emptyPortfolio: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyPortfolioText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: styles.fonSize.smd,
    color: styles.colors.actionGray,
    textAlign: 'center',
  },
  emptyAddButton: {
    backgroundColor: styles.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: styles.borderR,
    shadowColor: styles.colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyAddButtonText: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.white,
    textAlign: 'center',
  },

  // Bottom create button
  bottomCreateWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: styles.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  createButtonText: {
    color: styles.colors.white,
    fontWeight: '600',
    fontSize: styles.fonSize.smd,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 40,
  },
});
