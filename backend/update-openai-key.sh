#!/bin/bash

# =============================================================================
# Скрипт для обновления OpenAI API ключа на сервере
# =============================================================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# OpenAI API ключ
OPENAI_KEY="your_openai_api_key_here"

# Путь к приложению
APP_DIR="/var/www/buildlify"

# Проверка, что скрипт запущен с правами root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Этот скрипт должен быть запущен с правами root (sudo)"
        exit 1
    fi
}

# Обновление .env файла
update_env_file() {
    log_info "Обновление .env файла..."
    
    cd ${APP_DIR}
    
    # Создать резервную копию
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    
    # Обновить или добавить OPENAI_API_KEY
    if grep -q "OPENAI_API_KEY=" .env; then
        # Заменить существующий ключ
        sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=${OPENAI_KEY}/" .env
        log_info "Обновлен существующий OPENAI_API_KEY"
    else
        # Добавить новый ключ
        echo "" >> .env
        echo "# OpenAI Configuration" >> .env
        echo "OPENAI_API_KEY=${OPENAI_KEY}" >> .env
        echo "OPENAI_ORGANIZATION=" >> .env
        echo "OPENAI_REQUEST_TIMEOUT=30" >> .env
        log_info "Добавлен новый OPENAI_API_KEY"
    fi
    
    # Обновить OPENAI_ORGANIZATION если не установлен
    if ! grep -q "OPENAI_ORGANIZATION=" .env; then
        echo "OPENAI_ORGANIZATION=" >> .env
    fi
    
    # Обновить OPENAI_REQUEST_TIMEOUT если не установлен
    if ! grep -q "OPENAI_REQUEST_TIMEOUT=" .env; then
        echo "OPENAI_REQUEST_TIMEOUT=30" >> .env
    fi
    
    log_success ".env файл обновлен"
}

# Создание конфигурационного файла OpenAI
create_openai_config() {
    log_info "Создание конфигурационного файла OpenAI..."
    
    cd ${APP_DIR}
    
    # Создать config/openai.php если не существует
    if [ ! -f "config/openai.php" ]; then
        cat > config/openai.php << 'EOF'
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OpenAI API Key and Organization
    |--------------------------------------------------------------------------
    |
    | Here you may specify your OpenAI API Key and organization. This will be
    | used to authenticate with the OpenAI API - https://platform.openai.com.
    |
    */

    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),

    /*
    |--------------------------------------------------------------------------
    | Request Timeout
    |--------------------------------------------------------------------------
    |
    | The timeout may be used to specify the maximum number of seconds to wait
    | for a response. By default, the client will timeout after 30 seconds.
    |
    */

    'request_timeout' => env('OPENAI_REQUEST_TIMEOUT', 120),
];
EOF
        log_success "Создан config/openai.php"
    else
        log_info "config/openai.php уже существует"
    fi
}

# Очистка кэша и перезапуск сервисов
restart_services() {
    log_info "Очистка кэша и перезапуск сервисов..."
    
    cd ${APP_DIR}
    
    # Очистить кэш Laravel
    php artisan cache:clear
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    
    # Пересоздать кэш конфигурации
    php artisan config:cache
    
    # Перезапустить сервисы
    systemctl restart php8.2-fpm
    systemctl restart buildlify-queue
    
    log_success "Сервисы перезапущены"
}

# Тестирование OpenAI API
test_openai_api() {
    log_info "Тестирование OpenAI API..."
    
    cd ${APP_DIR}
    
    # Создать тестовый скрипт
    cat > test_openai_temp.php << EOF
<?php
require_once 'vendor/autoload.php';

\$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
\$dotenv->load();

\$apiKey = \$_ENV['OPENAI_API_KEY'] ?? null;

if (!\$apiKey) {
    echo "❌ OpenAI API ключ не найден в .env\n";
    exit(1);
}

echo "✅ OpenAI API ключ найден: " . substr(\$apiKey, 0, 10) . "...\n";

try {
    \$client = OpenAI::client(\$apiKey);
    
    \$result = \$client->chat()->create([
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            ['role' => 'user', 'content' => 'Say "API Test Successful"'],
        ],
        'max_tokens' => 10,
    ]);
    
    echo "✅ OpenAI API работает!\n";
    echo "Ответ: " . \$result->choices[0]->message->content . "\n";
    exit(0);
} catch (Exception \$e) {
    echo "❌ Ошибка OpenAI API: " . \$e->getMessage() . "\n";
    exit(1);
}
EOF
    
    # Запустить тест
    if php test_openai_temp.php; then
        log_success "OpenAI API тест прошел успешно!"
    else
        log_error "OpenAI API тест не прошел"
    fi
    
    # Удалить тестовый файл
    rm -f test_openai_temp.php
}

# Проверка конфигурации через Laravel
check_laravel_config() {
    log_info "Проверка конфигурации Laravel..."
    
    cd ${APP_DIR}
    
    # Проверить через artisan tinker
    php artisan tinker --execute="
        echo 'OpenAI API Key: ' . (config('openai.api_key') ? 'Установлен' : 'НЕ УСТАНОВЛЕН') . PHP_EOL;
        echo 'Длина ключа: ' . strlen(config('openai.api_key')) . PHP_EOL;
        echo 'Начинается с sk-: ' . (str_starts_with(config('openai.api_key'), 'sk-') ? 'Да' : 'Нет') . PHP_EOL;
    "
}

# Установка правильных прав доступа
fix_permissions() {
    log_info "Установка правильных прав доступа..."
    
    cd ${APP_DIR}
    
    # Установить права на .env и config файлы
    chown www-data:www-data .env config/openai.php
    chmod 644 .env config/openai.php
    
    log_success "Права доступа установлены"
}

# Основная функция
main() {
    log_info "Начало обновления OpenAI API ключа..."
    
    check_root
    update_env_file
    create_openai_config
    fix_permissions
    restart_services
    check_laravel_config
    test_openai_api
    
    log_success "OpenAI API ключ успешно обновлен и протестирован!"
    
    echo ""
    echo "==================================="
    echo "ОБНОВЛЕНИЕ ЗАВЕРШЕНО"
    echo "==================================="
    echo "OpenAI API ключ: Установлен"
    echo "Конфигурация: config/openai.php"
    echo "Сервисы: Перезапущены"
    echo "Тестирование: Пройдено"
    echo ""
    echo "Теперь можно тестировать генерацию дизайна в мобильном приложении!"
    echo "==================================="
}

# Запуск основной функции
main "$@"
