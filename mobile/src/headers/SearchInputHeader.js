import React from 'react';
import { View } from 'react-native';
import styles from '../styles';
import SearchInput from '../components/SearchInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
export default SearchHeader = ({query = '', setQuery = () => {}}) => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  return (
    <View
      underlayColor={styles.colors.highlight}
      style={{
        marginTop: insets.top + 3,
        backgroundColor: styles.colors.background,
        borderBottomLeftRadius: styles.borderR,
        borderBottomRightRadius: styles.borderR,
        width: '100%',
        alignContent: 'center',
        justifyContent: 'center',
      }}>
      <SearchInput
        autoFocus={false}
        value={query}
        onChange={setQuery}
        placeholder={t('Search by name')}
      />
    </View>
  );
};
