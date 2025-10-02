import React from 'react';
import {View, TouchableOpacity, Image, StyleSheet, Linking} from 'react-native';
import {notifyError} from '../services/notify';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import config from '../config';
import styles from '../styles';

const PortfolioItem = ({portfolio, onPress}) => {
  const {t} = useTranslation();

  // Превью карточки формируем как 2x2 сетку первых файлов

  const handleLinkPress = () => {
    if (portfolio.type === 'link' && portfolio.external_url) {
      Linking.openURL(portfolio.external_url).catch(() => {
        notifyError(t('Error'), t('Failed to open link'));
      });
    } else if (onPress) {
      onPress(portfolio);
    }
  };

  const getFileUrl = file => {
    if (!file) {
      return null;
    }
    if (file.path) {
      return `${config.siteUrl.replace(/\/$/, '')}${file.path}`;
    }
    return null;
  };

  // const getFileTypeIcon = file => {
  //   const extension = file.name?.split('.').pop()?.toLowerCase();
  //   if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
  //     return 'play-circle';
  //   }
  //   if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
  //     return 'image';
  //   }
  //   return 'document';
  // };

  if (portfolio.type === 'link') {
    return (
      <TouchableOpacity
        style={portfolioStyles.linkItem}
        onPress={handleLinkPress}
        activeOpacity={0.7}>
        <View style={portfolioStyles.linkIconContainer}>
          <MaterialCommunityIcons
            name="link"
            size={24}
            color={styles.colors.primary}
          />
        </View>
        <View style={portfolioStyles.linkContent}>
          <Text style={portfolioStyles.linkTitle}>{portfolio.name}</Text>
          <Text style={portfolioStyles.linkDescription}>
            {portfolio.description}
          </Text>
          <Text style={portfolioStyles.linkUrl}>{portfolio.external_url}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={styles.colors.actionGray}
        />
      </TouchableOpacity>
    );
  }

  const previews = (portfolio.files || []).slice(0, 4);

  return (
    <TouchableOpacity
      style={portfolioStyles.mediaItem}
      onPress={() => onPress && onPress(portfolio)}
      activeOpacity={0.7}>
      <View style={portfolioStyles.mediaPreview}>
        <View style={portfolioStyles.previewGrid}>
          {[0, 1, 2, 3].map(idx => {
            const file = previews[idx];
            return (
              <View
                key={file?.id || `ph_${idx}`}
                style={portfolioStyles.previewCell}>
                {file && getFileUrl(file) ? (
                  <Image
                    source={{uri: getFileUrl(file)}}
                    style={portfolioStyles.previewImage}
                  />
                ) : (
                  <View style={portfolioStyles.previewPlaceholder}>
                    <Ionicons
                      name="image"
                      size={18}
                      color={styles.colors.actionGray}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={portfolioStyles.mediaContent}>
        <Text style={portfolioStyles.mediaTitle} numberOfLines={2}>
          {portfolio.name}
        </Text>
        {Array.isArray(portfolio.files) && (
          <Text style={portfolioStyles.mediaCount}>
            {portfolio.files.length}{' '}
            {t('images', {defaultValue: 'изображений'})}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const portfolioStyles = StyleSheet.create({
  // Стили для ссылок
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: styles.colors.white,
    borderWidth: 1,
    borderColor: styles.colors.border,
    borderRadius: styles.borderR,
    marginBottom: 12,
    shadowColor: '#D5D5D5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  linkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: styles.colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkContent: {
    flex: 1,
    marginLeft: 12,
  },
  linkTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.regular,
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.primary,
  },

  // Стили для медиа портфолио
  mediaItem: {
    backgroundColor: styles.colors.white,
    borderWidth: 0,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
    width: '48%',
  },
  mediaPreview: {
    position: 'relative',
    height: 160,
    backgroundColor: styles.colors.grayLight,
  },
  previewGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
  },
  previewCell: {
    width: '50%',
    height: '50%',
    padding: 2,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewPlaceholder: {
    flex: 1,
    backgroundColor: styles.colors.grayLight,
  },
  previewPlaceholderFull: {
    flex: 1,
    backgroundColor: styles.colors.grayLight,
  },
  filesCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filesCountText: {
    fontSize: styles.fonSize.xs,
    color: styles.colors.white,
    fontWeight: '600',
  },
  fileTypeIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 16,
  },
  mediaContent: {
    padding: 12,
  },
  mediaTitle: {
    fontSize: styles.fonSize.smd,
    fontWeight: '600',
    color: styles.colors.titles,
    marginBottom: 6,
  },
  mediaCount: {
    fontSize: styles.fonSize.sm,
    color: styles.colors.actionGray,
  },
});

export default PortfolioItem;
