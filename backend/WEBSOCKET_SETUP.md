# WebSocket Setup Guide

## Настройка WebSocket для real-time уведомлений

### 1. Конфигурация .env файла

Добавьте следующие переменные в ваш `.env` файл:

```env
# WebSocket Broadcasting Configuration
BROADCAST_DRIVER=pusher

# Pusher Configuration (можно использовать бесплатный план)
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1

# Queue Configuration (для обработки событий в фоне)
QUEUE_CONNECTION=database
```

### 2. Альтернативная настройка с Soketi (self-hosted)

Если хотите использовать собственный WebSocket сервер:

```env
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=app-id
PUSHER_APP_KEY=app-key
PUSHER_APP_SECRET=app-secret
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001
PUSHER_SCHEME=http
```

### 3. Запуск очередей

Для обработки WebSocket событий в фоне:

```bash
php artisan queue:work
```

### 4. Установка Soketi (опционально)

```bash
npm install -g @soketi/soketi
soketi start
```

## Реализованные события

### AdminNotificationEvent
- Канал: `admin`
- Уведомления для администраторов о новых пользователях, заказах, жалобах

### UserNotificationEvent
- Канал: `user.{id}`
- Персональные уведомления для пользователей

### OrderUpdateEvent
- Канал: `order.{id}`
- Обновления статуса заказа для всех участников

## Каналы

- `admin` - для администраторов
- `user.{id}` - для конкретного пользователя
- `order.{id}` - для участников заказа
- `complaint.{id}` - для участников жалобы
- `customers` - для всех заказчиков
- `executors` - для всех исполнителей
- `mediators` - для всех посредников

## События, требующие real-time обновления

1. **Уведомления**
   - Новые уведомления пользователям
   - Административные уведомления

2. **Заказы**
   - Изменение статуса заказа
   - Назначение исполнителя
   - Назначение посредника
   - Новые отклики на заказ

3. **Верификация**
   - Изменение статуса верификации исполнителя
   - Загрузка новой лицензии

4. **Жалобы**
   - Новые жалобы
   - Изменение статуса жалобы

5. **Платежи**
   - Изменение статуса подписки
   - Успешные/неуспешные платежи
