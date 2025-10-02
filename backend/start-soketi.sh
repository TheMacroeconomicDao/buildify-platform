#!/bin/bash

# Скрипт запуска Soketi WebSocket сервера для Buildlify

echo "🚀 Starting Buildlify WebSocket Server (Soketi)..."

# Проверяем, установлен ли Soketi
if ! command -v soketi &> /dev/null; then
    echo "❌ Soketi не установлен. Устанавливаем..."
    npm install -g @soketi/soketi
    
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки Soketi. Попробуйте:"
        echo "   sudo npm install -g @soketi/soketi"
        exit 1
    fi
    
    echo "✅ Soketi установлен успешно"
fi

# Проверяем конфигурацию
if [ ! -f "soketi.config.json" ]; then
    echo "❌ Файл конфигурации soketi.config.json не найден"
    exit 1
fi

echo "📋 Конфигурация Soketi:"
echo "   - Port: 6001"
echo "   - Host: 0.0.0.0"
echo "   - App ID: buildlify-app"
echo "   - App Key: buildlify-key"
echo "   - Max Connections: 1000"
echo "   - Metrics: enabled (port 9601)"

# Создаем директорию для логов если не существует
mkdir -p storage/logs

# Запускаем Soketi с конфигурацией
echo "🔌 Запускаем WebSocket сервер..."
soketi start --config=soketi.config.json --verbose

# Если сервер остановился
echo "⚠️  WebSocket сервер остановлен"
