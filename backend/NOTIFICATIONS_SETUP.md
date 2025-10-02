# Настройка уведомлений для исполнителей

## Описание

Система автоматически отправляет уведомления исполнителям при их выборе для заказа. Уведомления отправляются как по email, так и через внутреннюю систему уведомлений приложения.

## Настройка почты в .env

Добавьте следующие параметры в ваш файл .env:

```env
# Основные настройки почты
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-server.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@buildlify.com"
MAIL_FROM_NAME="Buildlify"

# Специальные настройки для уведомлений исполнителям
EXECUTOR_NOTIFICATION_EMAIL="notifications@buildlify.com"
EXECUTOR_NOTIFICATION_NAME="Buildlify Notifications"
```

## Рекомендуемые почтовые сервисы

### 1. Gmail (для разработки)
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
```

### 2. Yandex Mail
```env
MAIL_HOST=smtp.yandex.ru
MAIL_PORT=587
MAIL_USERNAME=your-email@yandex.ru
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
```

### 3. Mailgun (рекомендуется для продакшн)
```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=your-domain.com
MAILGUN_SECRET=your-api-key
```

## Как работает система

1. **При выборе исполнителя через API** (`OrderResponseController::accept`):
   - Обновляется статус заказа на "ExecutorSelected"
   - Автоматически отправляется email уведомление
   - Создается внутреннее push-уведомление

2. **При выборе исполнителя через админ-панель** (`OrderEditScreen`):
   - При назначении нового исполнителя
   - При смене исполнителя
   - Также отправляются оба типа уведомлений

## Структура уведомлений

### Email уведомление
- Красивый HTML шаблон с деталями заказа
- Информация о заказчике и сумме
- Инструкции по дальнейшим действиям

### Внутреннее уведомление
- JSON структура с данными заказа
- Отображается в мобильном приложении
- Может быть помечено как прочитанное

## Логирование

Все уведомления логируются в Laravel лог:
- Успешная отправка: `INFO` уровень
- Ошибки отправки: `ERROR` уровень

## Тестирование

Для тестирования можно использовать:
1. `MAIL_MAILER=log` - письма будут записываться в лог
2. `MAIL_MAILER=array` - письма будут храниться в памяти для тестов
3. Ethereal Email (https://ethereal.email/) для безопасного тестирования

## Безопасность

- Никогда не добавляйте .env файл в git
- Используйте пароли приложений для Gmail
- Для продакшн рекомендуется использовать профессиональные SMTP сервисы

