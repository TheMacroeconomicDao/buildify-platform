const config = {
  baseUrl: 'https://buildlify.site/api', // Собственный домен
  apiUrl: 'https://buildlify.site',
  siteUrl: 'https://buildlify.site/',
  fileUrl: 'https://buildlify.site/storage',
  aiServiceUrl: 'https://buildlify.site/api', // Используем тот же сервер

  // WebSocket configuration
  pusher: {
    key: 'app-key', // Ключ из soketi.config.json
    cluster: 'mt1', // Не используется для локального Soketi
    // Для продакшн сервера:
    host: 'buildlify.site',
    port: 6001,
    scheme: 'https',
  },

  links: [
    {
      name: 'Политика конфиденциальности',
      link: '',
    },
    {
      name: 'Программа лояльности',
      link: '',
    },
  ],
};

// Вспомогательная функция для формирования URL аватара
export const getAvatarUrl = avatarPath => {
  if (!avatarPath) return null;

  // Если уже полный URL
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }

  // Если путь начинается с /storage/, используем siteUrl
  if (avatarPath.startsWith('/storage/')) {
    return `${config.siteUrl.replace(/\/$/, '')}${avatarPath}`;
  }

  // Иначе используем fileUrl
  return `${config.fileUrl}${
    avatarPath.startsWith('/') ? '' : '/'
  }${avatarPath}`;
};

export default config;
