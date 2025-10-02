# Push Notifications Setup Guide

## Конфигурация

### 1. Настройка FCM (Firebase Cloud Messaging)

Добавьте в `.env`:
```env
FCM_SERVER_KEY=your_firebase_server_key_here
FCM_SENDER_ID=your_firebase_sender_id_here
```

### 2. Настройка Cron для запланированных уведомлений

Добавьте в crontab:
```bash
# Проверка запланированных push-уведомлений каждую минуту
* * * * * cd /path/to/your/project && php artisan notifications:process-scheduled >> /dev/null 2>&1
```

## API Endpoints

### Пользовательские endpoints

#### Обновить push токен
```http
POST /api/push/token
Authorization: Bearer {token}
Content-Type: application/json

{
  "push_token": "firebase_device_token_here"
}
```

#### Обновить настройки push-уведомлений
```http
POST /api/push/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "order_responses": true,
  "order_status_changes": true,
  "executor_selected": true,
  "payment_notifications": true,
  "promotional": false,
  "scheduled": true
}
```

#### Получить настройки push-уведомлений
```http
GET /api/push/settings
Authorization: Bearer {token}
```

#### Отправить тестовое уведомление
```http
POST /api/push/test
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Test Title",
  "message": "Test Message"
}
```

### Админские endpoints

#### Создать запланированное уведомление
```http
POST /api/push/scheduled
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Notification Title",
  "message": "Notification Message",
  "target_type": "all", // all, customers, executors, specific_users
  "target_user_ids": [1, 2, 3], // только для specific_users
  "schedule_type": "once", // once, daily, weekly, monthly
  "scheduled_at": "2025-10-01 10:00:00",
  "data": {
    "custom_key": "custom_value"
  }
}
```

#### Получить список запланированных уведомлений
```http
GET /api/push/scheduled
Authorization: Bearer {admin_token}
```

#### Отменить запланированное уведомление
```http
DELETE /api/push/scheduled/{id}
Authorization: Bearer {admin_token}
```

## Автоматические push-уведомления

### 1. При откликах на заказы
Автоматически отправляются:
- **Заказчику**: когда исполнитель откликается на заказ
- **Исполнителю**: когда его выбирают для выполнения заказа

### 2. При изменении статуса заказа
Отправляются всем участникам заказа при смене статуса.

## Структура push-уведомления

```json
{
  "notification": {
    "title": "Заголовок уведомления",
    "body": "Текст сообщения",
    "sound": "default",
    "badge": 1
  },
  "data": {
    "type": "order_response",
    "order_id": 123,
    "executor_id": 456,
    "click_action": "FLUTTER_NOTIFICATION_CLICK",
    "timestamp": "2025-09-30T12:00:00.000Z"
  }
}
```

## Типы уведомлений

### Автоматические
- `order_response` - новый отклик на заказ
- `executor_selected` - исполнитель выбран для заказа
- `order_status_changed` - изменение статуса заказа
- `payment_success` - успешная оплата
- `payment_failed` - неудачная оплата

### Запланированные
- `promotional` - рекламные уведомления
- `reminder` - напоминания
- `announcement` - объявления
- `maintenance` - технические работы

## Админ-панель

Доступна по адресу: `/admin/push-notifications`

Функции:
- ✅ Создание разовых и повторяющихся уведомлений
- ✅ Выбор целевой аудитории
- ✅ Планирование даты и времени отправки
- ✅ Просмотр статистики отправки
- ✅ Отмена запланированных уведомлений

## Мониторинг

### Логи
```bash
tail -f storage/logs/laravel.log | grep "Push notification"
```

### Проверка очереди
```bash
php artisan queue:work --verbose
```

### Ручная обработка запланированных уведомлений
```bash
php artisan notifications:process-scheduled
```

## Troubleshooting

### Push-уведомления не приходят
1. Проверьте FCM_SERVER_KEY в `.env`
2. Убедитесь что у пользователя есть push_token
3. Проверьте логи на ошибки FCM
4. Убедитесь что queue worker запущен

### Запланированные уведомления не отправляются
1. Проверьте что cron настроен правильно
2. Запустите команду вручную: `php artisan notifications:process-scheduled`
3. Проверьте что статус уведомления = 'pending'
4. Убедитесь что scheduled_at <= текущее время

### Низкий процент доставки
1. Проверьте валидность push токенов
2. Убедитесь что приложение не удалено с устройств
3. Проверьте настройки уведомлений у пользователей
