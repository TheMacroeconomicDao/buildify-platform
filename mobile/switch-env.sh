#!/bin/bash

# Скрипт для переключения между окружениями

if [ "$1" = "local" ]; then
    echo "Переключение на локальное окружение..."
    cp env.local .env
    echo "✅ Переключено на локальное окружение"
elif [ "$1" = "production" ]; then
    echo "Переключение на продакшн окружение..."
    cp env.production .env
    echo "✅ Переключено на продакшн окружение"
else
    echo "❌ Использование: ./switch-env.sh [local|production]"
    echo ""
    echo "Доступные окружения:"
    echo "  local      - локальный сервер (127.0.0.1:8000)"
    echo "  production - продакшн сервер (buildify.duckdns.org)"
    echo ""
    if [ -f .env ]; then
        echo "Текущее окружение:"
        grep "ENV_NAME=" .env || echo "Не определено"
    else
        echo "Файл .env не найден. Запустите команду для создания."
    fi
fi
