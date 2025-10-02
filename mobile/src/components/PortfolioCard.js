import React from 'react';
import {View, TouchableOpacity, Image, ScrollView} from 'react-native';
import Text from './Text';
import styles from '../styles';
import config from '../config';

const PortfolioCard = ({title, description, images, onPress}) => {
  return (
    <TouchableOpacity
      style={{
        width: '100%',
        backgroundColor: styles.colors.white,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: styles.colors.border,
        overflow: 'hidden',
      }}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Images section */}
      {images && images.length > 0 && (
        <View style={{height: 200, backgroundColor: '#F8F8F8'}}>
          {images.length === 1 ? (
            <Image
              source={{uri: config.siteUrl + images[0].file_path}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{flex: 1}}>
              {images.map((image, index) => (
                <Image
                  key={index}
                  source={{uri: config.siteUrl + image.file_path}}
                  style={{
                    width: 300, // Приблизительная ширина экрана
                    height: 200,
                    resizeMode: 'cover',
                  }}
                />
              ))}
            </ScrollView>
          )}

          {/* Индикатор количества фото */}
          {images.length > 1 && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.6)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
              <Text style={{color: '#fff', fontSize: 12}}>
                1 / {images.length}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Content section */}
      <View style={{padding: 16}}>
        {title && (
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: styles.colors.black,
              marginBottom: 8,
            }}>
            {title}
          </Text>
        )}

        {description && (
          <Text
            style={{
              fontSize: 14,
              color: styles.colors.gray,
              lineHeight: 20,
            }}
            numberOfLines={3}>
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default PortfolioCard;
