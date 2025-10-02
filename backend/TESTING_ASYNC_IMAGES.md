# Тестирование асинхронной генерации изображений

## Быстрый тест

### 1. Запуск queue worker'а

```bash
cd /Users/anton/buildlify/backend
php artisan queue:work --verbose
```

### 2. Отправка запроса на генерацию дизайна

```bash
curl -X POST http://your-domain/api/design/generate \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Modern living room with minimalist style" \
  -F "room_type[]=living_room" \
  -F "style[]=modern" \
  -F "photos=@/path/to/test-image.jpg"
```

Ответ должен содержать `generation_id`:
```json
{
  "success": true,
  "design": {...},
  "images": [],
  "generation_id": "uuid-here"
}
```

### 3. Проверка статуса генерации

```bash
curl http://your-domain/api/design/images/status/YOUR_GENERATION_ID
```

### 4. Получение готовых изображений

```bash
curl http://your-domain/api/design/images/get/YOUR_GENERATION_ID
```

## Мониторинг

### Проверка очереди
```bash
php artisan queue:monitor
```

### Просмотр логов
```bash
tail -f storage/logs/laravel.log
```

### Проверка БД
```sql
SELECT * FROM design_image_generations ORDER BY created_at DESC LIMIT 5;
SELECT * FROM jobs; -- активные задачи в очереди
SELECT * FROM failed_jobs; -- неудачные задачи
```

## WebSocket тестирование

### Подключение к WebSocket каналу
```javascript
// Подключение к каналу пользователя
Echo.private('user.' + userId)
    .listen('.design.images.generated', (e) => {
        console.log('Images ready!', e);
        // e.generation_id - ID генерации
        // e.images - массив готовых изображений
        // e.status - completed или failed
        // e.error - сообщение об ошибке (если есть)
    });
```

## Устранение проблем

### Queue worker не запускается
1. Проверить конфигурацию очереди: `config/queue.php`
2. Убедиться что таблица `jobs` существует: `php artisan migrate`
3. Перезапустить supervisor: `supervisorctl restart laravel-worker`

### Изображения не генерируются
1. Проверить OpenAI API ключ в `.env`
2. Проверить логи: `tail -f storage/logs/laravel.log`
3. Проверить failed_jobs: `php artisan queue:failed`

### WebSocket не работает
1. Проверить настройки broadcasting в `config/broadcasting.php`
2. Убедиться что Pusher/Soketi настроен правильно
3. Проверить авторизацию WebSocket каналов

### Повторный запуск неудачных задач
```bash
php artisan queue:retry all
```

### Очистка очереди
```bash
php artisan queue:clear
```
