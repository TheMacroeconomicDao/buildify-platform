#!/bin/bash

# =============================================================================
# Buildlify Backend Deployment Script
# Скрипт для развертывания Laravel бэкенда на пустом облачном сервере Ubuntu 22.04
# =============================================================================

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка, что скрипт запущен с правами root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Этот скрипт должен быть запущен с правами root (sudo)"
        exit 1
    fi
}

# Конфигурационные переменные (можно изменить)
APP_NAME="buildlify"
APP_USER="www-data"
APP_DIR="/var/www/${APP_NAME}"
DOMAIN="${DOMAIN:-localhost}"
DB_NAME="${DB_NAME:-buildlify_production}"
DB_USER="${DB_USER:-buildlify_user}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"
REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32)}"

# Функция для обновления системы
update_system() {
    log_info "Обновление системы..."
    apt update && apt upgrade -y
    log_success "Система обновлена"
}

# Установка базовых пакетов
install_base_packages() {
    log_info "Установка базовых пакетов..."
    apt install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        supervisor \
        htop \
        nano \
        vim \
        fail2ban \
        ufw
    log_success "Базовые пакеты установлены"
}

# Установка PHP 8.2
install_php() {
    log_info "Установка PHP 8.2..."
    
    # Добавление репозитория PHP
    add-apt-repository ppa:ondrej/php -y
    apt update
    
    # Установка PHP и расширений
    apt install -y \
        php8.2 \
        php8.2-fpm \
        php8.2-cli \
        php8.2-common \
        php8.2-mysql \
        php8.2-pgsql \
        php8.2-xml \
        php8.2-xmlrpc \
        php8.2-curl \
        php8.2-gd \
        php8.2-imagick \
        php8.2-dev \
        php8.2-imap \
        php8.2-mbstring \
        php8.2-opcache \
        php8.2-soap \
        php8.2-zip \
        php8.2-intl \
        php8.2-bcmath \
        php8.2-redis
    
    # Настройка PHP-FPM
    systemctl enable php8.2-fpm
    systemctl start php8.2-fpm
    
    log_success "PHP 8.2 установлен и настроен"
}

# Установка Composer
install_composer() {
    log_info "Установка Composer..."
    
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
    
    log_success "Composer установлен"
}

# Установка Node.js
install_nodejs() {
    log_info "Установка Node.js..."
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    log_success "Node.js установлен"
}

# Установка Nginx
install_nginx() {
    log_info "Установка Nginx..."
    
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    
    log_success "Nginx установлен"
}

# Установка PostgreSQL
install_postgresql() {
    log_info "Установка PostgreSQL..."
    
    apt install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
    
    # Создание базы данных и пользователя
    log_info "Создание базы данных и пользователя..."
    
    # Проверка и создание базы данных
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
        log_warning "База данных ${DB_NAME} уже существует, пропускаем создание"
    else
        sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
        log_info "База данных ${DB_NAME} создана"
    fi
    
    # Проверка и создание пользователя
    if sudo -u postgres psql -t -c "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
        log_warning "Пользователь ${DB_USER} уже существует, обновляем пароль"
        sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
    else
        sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
        log_info "Пользователь ${DB_USER} создан"
    fi
    
    # Назначение прав (выполняется всегда для обеспечения корректных прав)
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
    sudo -u postgres psql -c "ALTER USER ${DB_USER} CREATEDB;"
    
    log_success "PostgreSQL установлен и настроен"
}

# Установка Redis
install_redis() {
    log_info "Установка Redis..."
    
    apt install -y redis-server
    
    # Настройка Redis с паролем
    sed -i "s|# requirepass foobared|requirepass ${REDIS_PASSWORD}|" /etc/redis/redis.conf
    sed -i "s|bind 127.0.0.1 ::1|bind 127.0.0.1|" /etc/redis/redis.conf
    
    systemctl enable redis-server
    systemctl restart redis-server
    
    log_success "Redis установлен и настроен"
}

# Клонирование и настройка приложения
setup_application() {
    log_info "Настройка приложения..."
    
    # Создание директории приложения
    mkdir -p ${APP_DIR}
    
    # Если код уже есть, копируем его (предполагается, что скрипт запускается из папки с кодом)
    if [ -f "composer.json" ]; then
        log_info "Копирование файлов приложения..."
        cp -r . ${APP_DIR}/
    else
        log_error "Файлы приложения не найдены. Убедитесь, что скрипт запускается из директории с кодом."
        exit 1
    fi
    
    cd ${APP_DIR}
    
    # Установка зависимостей Composer
    log_info "Установка зависимостей PHP..."
    composer install --optimize-autoloader --no-dev
    
    # Установка зависимостей Node.js
    if [ -f "package.json" ]; then
        log_info "Установка зависимостей Node.js..."
        npm install
        npm run build
    fi
    
    # Создание .env файла
    if [ ! -f ".env" ]; then
        log_info "Создание .env файла..."
        cp .env.production .env 2>/dev/null || create_env_file
    fi
    
    # Генерация ключа приложения
    php artisan key:generate
    
    # Создание символической ссылки для storage
    php artisan storage:link
    
    # Настройка прав доступа
    chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
    chmod -R 755 ${APP_DIR}
    chmod -R 775 ${APP_DIR}/storage
    chmod -R 775 ${APP_DIR}/bootstrap/cache
    
    log_success "Приложение настроено"
}

# Создание .env файла
create_env_file() {
    log_info "Создание .env файла..."
    
    cat > ${APP_DIR}/.env << EOF
APP_NAME=Buildlify
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://${DOMAIN}

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

BROADCAST_DRIVER=pusher
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORGANIZATION=
OPENAI_REQUEST_TIMEOUT=30

# Stripe Configuration
STRIPE_KEY=your_stripe_public_key_here
STRIPE_SECRET=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Pusher Configuration
PUSHER_APP_ID=your_pusher_app_id
PUSHER_APP_KEY=your_pusher_key
PUSHER_APP_SECRET=your_pusher_secret
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="\${APP_NAME}"
VITE_PUSHER_APP_KEY="\${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="\${PUSHER_HOST}"
VITE_PUSHER_PORT="\${PUSHER_PORT}"
VITE_PUSHER_SCHEME="\${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="\${PUSHER_APP_CLUSTER}"
EOF

    log_success ".env файл создан"
}

# Настройка Nginx
setup_nginx() {
    log_info "Настройка Nginx..."
    
    cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root ${APP_DIR}/public;
    
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    
    index index.php;
    
    charset utf-8;
    
    client_max_body_size 350M;
    
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
    
    error_page 404 /index.php;
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }
    
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF
    
    # Активация сайта
    ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Тестирование конфигурации
    nginx -t
    systemctl reload nginx
    
    log_success "Nginx настроен"
}

# Настройка systemd сервисов для Laravel
setup_systemd_services() {
    log_info "Настройка systemd сервисов..."
    
    # Laravel Queue Worker
    cat > /etc/systemd/system/${APP_NAME}-queue.service << EOF
[Unit]
Description=${APP_NAME} Queue Worker
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
Restart=always
RestartSec=5s
ExecStart=/usr/bin/php ${APP_DIR}/artisan queue:work --sleep=3 --tries=3 --max-time=3600
WorkingDirectory=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF
    
    # Laravel Scheduler (через cron)
    echo "* * * * * ${APP_USER} cd ${APP_DIR} && php artisan schedule:run >> /dev/null 2>&1" > /etc/cron.d/${APP_NAME}-scheduler
    
    # Активация сервисов
    systemctl daemon-reload
    systemctl enable ${APP_NAME}-queue
    systemctl start ${APP_NAME}-queue
    
    log_success "Systemd сервисы настроены"
}

# Запуск миграций
run_migrations() {
    log_info "Запуск миграций базы данных..."
    
    cd ${APP_DIR}
    php artisan migrate --force
    
    # Запуск сидеров (если нужно)
    if [ "${RUN_SEEDERS:-false}" = "true" ]; then
        php artisan db:seed --force
    fi
    
    log_success "Миграции выполнены"
}

# Настройка SSL с Let's Encrypt
setup_ssl() {
    if [ "${SETUP_SSL:-false}" = "true" ] && [ "${DOMAIN}" != "localhost" ]; then
        log_info "Настройка SSL сертификата..."
        
        apt install -y certbot python3-certbot-nginx
        certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
        
        # Автоматическое обновление сертификата
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
        
        log_success "SSL сертификат настроен"
    fi
}

# Настройка firewall
setup_firewall() {
    log_info "Настройка firewall..."
    
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    
    log_success "Firewall настроен"
}

# Настройка мониторинга
setup_monitoring() {
    log_info "Настройка мониторинга..."
    
    # Настройка логирования
    mkdir -p /var/log/${APP_NAME}
    chown ${APP_USER}:${APP_USER} /var/log/${APP_NAME}
    
    # Настройка logrotate
    cat > /etc/logrotate.d/${APP_NAME} << EOF
/var/log/${APP_NAME}/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 ${APP_USER} ${APP_USER}
    postrotate
        systemctl reload php8.2-fpm
    endscript
}
EOF
    
    log_success "Мониторинг настроен"
}

# Создание скрипта резервного копирования
create_backup_script() {
    log_info "Создание скрипта резервного копирования..."
    
    mkdir -p /opt/backups
    
    cat > /opt/backups/backup-${APP_NAME}.sh << 'EOF'
#!/bin/bash

APP_NAME="buildlify"
APP_DIR="/var/www/${APP_NAME}"
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Создание директории для бэкапа
mkdir -p ${BACKUP_DIR}/${DATE}

# Бэкап базы данных
sudo -u postgres pg_dump buildlify_production > ${BACKUP_DIR}/${DATE}/database.sql

# Бэкап файлов приложения
tar -czf ${BACKUP_DIR}/${DATE}/app_files.tar.gz -C /var/www ${APP_NAME}

# Удаление старых бэкапов (старше 30 дней)
find ${BACKUP_DIR} -type d -name "20*" -mtime +30 -exec rm -rf {} \;

echo "Backup completed: ${DATE}"
EOF
    
    chmod +x /opt/backups/backup-${APP_NAME}.sh
    
    # Добавление в cron (ежедневно в 2:00)
    echo "0 2 * * * /opt/backups/backup-${APP_NAME}.sh >> /var/log/backup.log 2>&1" >> /etc/cron.d/${APP_NAME}-backup
    
    log_success "Скрипт резервного копирования создан"
}

# Финальная настройка и оптимизация
final_optimization() {
    log_info "Финальная оптимизация..."
    
    cd ${APP_DIR}
    
    # Кэширование конфигурации
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    # Оптимизация автозагрузчика
    composer dump-autoload --optimize
    
    # Перезапуск сервисов
    systemctl restart php8.2-fpm
    systemctl restart nginx
    systemctl restart ${APP_NAME}-queue
    
    log_success "Оптимизация завершена"
}

# Вывод информации о развертывании
print_deployment_info() {
    log_success "Развертывание завершено успешно!"
    
    echo ""
    echo "==================================="
    echo "ИНФОРМАЦИЯ О РАЗВЕРТЫВАНИИ"
    echo "==================================="
    echo "Приложение: ${APP_NAME}"
    echo "Домен: ${DOMAIN}"
    echo "Директория: ${APP_DIR}"
    echo "База данных: ${DB_NAME}"
    echo "Пользователь БД: ${DB_USER}"
    echo "Пароль БД: ${DB_PASSWORD}"
    echo "Пароль Redis: ${REDIS_PASSWORD}"
    echo ""
    echo "ВАЖНО:"
    echo "1. Настройте .env файл с правильными API ключами:"
    echo "   - OPENAI_API_KEY"
    echo "   - STRIPE_KEY и STRIPE_SECRET"
    echo "   - PUSHER настройки"
    echo ""
    echo "2. Для настройки SSL выполните:"
    echo "   SETUP_SSL=true DOMAIN=your-domain.com ./deploy.sh"
    echo ""
    echo "3. Логи приложения: ${APP_DIR}/storage/logs/"
    echo "4. Статус сервисов: systemctl status ${APP_NAME}-queue"
    echo "5. Резервные копии: /opt/backups/"
    echo "==================================="
}

# Основная функция
main() {
    log_info "Начало развертывания Buildlify Backend..."
    
    check_root
    update_system
    install_base_packages
    install_php
    install_composer
    install_nodejs
    install_nginx
    install_postgresql
    install_redis
    setup_application
    setup_nginx
    setup_systemd_services
    run_migrations
    setup_ssl
    setup_firewall
    setup_monitoring
    create_backup_script
    final_optimization
    print_deployment_info
    
    log_success "Развертывание завершено!"
}

# Запуск основной функции
main "$@"
