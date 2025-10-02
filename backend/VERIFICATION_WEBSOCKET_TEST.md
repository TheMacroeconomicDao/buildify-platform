# Тестирование WebSocket уведомлений о верификации

## Сценарии для тестирования

### 1. Загрузка лицензии исполнителем

**Действие:** Исполнитель загружает файл лицензии через мобильное приложение

**Ожидаемые WebSocket события:**

#### Для исполнителя:
- **Канал:** `private-user.{executor_id}`
- **Событие:** `notification`
- **Тип:** `license_uploaded`
- **Данные:**
```json
{
  "type": "license_uploaded",
  "title": "Лицензия загружена",
  "message": "Ваша лицензия успешно загружена и отправлена на проверку. Ожидайте результат верификации.",
  "data": {
    "user_id": 123,
    "license_file_path": "/storage/licenses/...",
    "verification_status": 0,
    "uploaded_at": "2025-01-01T12:00:00.000Z"
  }
}
```

#### Для администраторов:
- **Канал:** `private-admin`
- **Событие:** `notification`
- **Тип:** `new_license_verification`
- **Данные:**
```json
{
  "type": "new_license_verification",
  "title": "Новая лицензия на верификацию",
  "message": "Исполнитель Иван Иванов загрузил лицензию для верификации",
  "data": {
    "executor_id": 123,
    "executor_name": "Иван Иванов",
    "executor_email": "executor@test.com",
    "license_file_path": "/storage/licenses/...",
    "uploaded_at": "2025-01-01T12:00:00.000Z"
  }
}
```

### 2. Одобрение верификации администратором

**Действие:** Администратор одобряет верификацию исполнителя

**Ожидаемые WebSocket события:**

#### Для исполнителя:
- **Канал:** `private-user.{executor_id}`
- **Событие:** `notification`
- **Тип:** `verification_status_changed`
- **Данные:**
```json
{
  "type": "verification_status_changed",
  "title": "Верификация одобрена!",
  "message": "Поздравляем! Ваша верификация успешно пройдена. Теперь вы можете принимать заказы.",
  "data": {
    "user_id": 123,
    "old_status": 0,
    "new_status": 1,
    "old_status_label": "На рассмотрении",
    "new_status_label": "Одобрена",
    "verification_comment": null,
    "verified_at": "2025-01-01T12:30:00.000Z"
  }
}
```

#### Для администраторов:
- **Канал:** `private-admin`
- **Событие:** `notification`
- **Тип:** `verification_completed`
- **Данные:**
```json
{
  "type": "verification_completed",
  "title": "Верификация завершена",
  "message": "Исполнитель Иван Иванов успешно верифицирован",
  "data": {
    "executor_id": 123,
    "executor_name": "Иван Иванов",
    "executor_email": "executor@test.com",
    "new_status": 1,
    "new_status_label": "Одобрена",
    "verification_comment": null
  }
}
```

### 3. Отклонение верификации администратором

**Действие:** Администратор отклоняет верификацию с комментарием

**Ожидаемые WebSocket события:**

#### Для исполнителя:
- **Канал:** `private-user.{executor_id}`
- **Событие:** `notification`
- **Тип:** `verification_status_changed`
- **Данные:**
```json
{
  "type": "verification_status_changed",
  "title": "Верификация отклонена",
  "message": "К сожалению, ваша верификация была отклонена. Причина: Документ нечитаемый, загрузите более качественное фото",
  "data": {
    "user_id": 123,
    "old_status": 0,
    "new_status": 2,
    "old_status_label": "На рассмотрении",
    "new_status_label": "Отклонена",
    "verification_comment": "Документ нечитаемый, загрузите более качественное фото",
    "verified_at": "2025-01-01T12:30:00.000Z"
  }
}
```

## Команды для тестирования

### 1. Симуляция загрузки лицензии
```php
// В tinker
$executor = User::where('email', 'executor@test.com')->first();
$executor->update(['license_file_path' => '/storage/licenses/test_license.pdf']);
```

### 2. Симуляция одобрения верификации
```php
// В tinker
$executor = User::where('email', 'executor@test.com')->first();
$executor->update([
    'verification_status' => 1, // Approved
    'verification_comment' => null,
    'verified_at' => now()
]);
```

### 3. Симуляция отклонения верификации
```php
// В tinker
$executor = User::where('email', 'executor@test.com')->first();
$executor->update([
    'verification_status' => 2, // Rejected
    'verification_comment' => 'Документ нечитаемый, загрузите более качественное фото',
    'verified_at' => now()
]);
```

## Проверка в мобильном приложении

### 1. Подключение к WebSocket
- Убедитесь, что пользователь авторизован
- Проверьте подключение к каналу `private-user.{user_id}`
- Для админов: проверьте подключение к каналу `private-admin`

### 2. Обработка уведомлений
- Уведомления должны появляться через `notifySuccess`, `notifyWarning`, `notifyInfo`
- Данные пользователя должны обновляться автоматически
- Redux store должен содержать `lastVerificationUpdate`

### 3. UI обновления
- Компонент `VerificationStatusBadge` должен обновляться в реальном времени
- Хук `useVerificationStatus` должен возвращать актуальный статус
- Экраны с информацией о верификации должны обновляться автоматически
