import React from 'react';
import {Text} from 'react-native';

/**
 * Компонент для отображения иконок категорий
 */
const CategoryIcon = ({icon, size = 20, style = {}}) => {
  const iconMap = {
    // Work Directions
    construction: '🏗️',
    home: '🏠',
    repair: '🔨',
    design: '📐',
    cleaning: '🧹',
    gardening: '🌱',
    moving: '📦',
    security: '🔒',
    technology: '💻',
    automotive: '🚗',
    beauty: '💅',
    education: '📚',
    health: '⚕️',
    business: '💼',
    entertainment: '🎭',

    // Work Types
    plumbing: '🔧',
    electrical: '⚡',
    painting: '🎨',
    renovation: '🏘️',
    bathroom: '🛁',
    kitchen: '🍳',
    flooring: '🪟',
    roofing: '🏠',
    hvac: '🌡️',
    furniture: '🪑',
    lighting: '💡',
    windows: '🪟',
    doors: '🚪',
    tiles: '🧱',
    wallpaper: '🖼️',
    carpet: '🪚',
    marble: '⚪',
    wood: '🌳',
    metal: '⚙️',
    glass: '🔍',
    stone: '🪨',
  };

  const displayIcon = iconMap[icon] || icon;

  if (!displayIcon) {
    return null;
  }

  return (
    <Text
      style={[
        {
          fontSize: size,
          lineHeight: size + 4,
          textAlign: 'center',
        },
        style,
      ]}>
      {displayIcon}
    </Text>
  );
};

export default CategoryIcon;
