# Руководство по развёртыванию партнёрской программы

## Предварительные требования

- Laravel 10+
- PHP 8.1+
- MySQL 8.0+ или PostgreSQL 13+
- Redis (для кеширования настроек)
- Настроенные очереди Laravel

## Пошаговое развёртывание

### 1. Резервное копирование

**⚠️ КРИТИЧЕСКИ ВАЖНО: Создайте резервную копию базы данных перед развёртыванием!**

```bash
# MySQL
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# PostgreSQL
pg_dump -U username -h localhost database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Развёртывание миграций

```bash
# Переключение в режим обслуживания
php artisan down --message="Обновление системы" --retry=60

# Запуск миграций
php artisan migrate --force

# Запуск сидеров настроек
php artisan db:seed --class=ReferralSettingsSeeder --force
```

### 3. Очистка кеша

```bash
# Очистка всех кешей
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Кеширование конфигурации для production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 4. Проверка развёртывания

```bash
# Проверка миграций
php artisan migrate:status

# Запуск тестов
php artisan test tests/Feature/ReferralBasicTest.php

# Проверка API endpoints
curl -H "Authorization: Bearer {test_token}" \
     -H "Accept: application/json" \
     http://your-domain.com/api/referrals/my-stats
```

### 5. Включение системы

```bash
# Выключение режима обслуживания
php artisan up
```

## Проверка функциональности

### 1. Проверка создания промокодов

```sql
-- Проверяем, что промокоды создаются для новых пользователей
SELECT u.id, u.name, u.email, rc.code, rc.is_active 
FROM users u 
LEFT JOIN referral_codes rc ON u.id = rc.user_id 
WHERE u.created_at > NOW() - INTERVAL 1 DAY;
```

### 2. Проверка настроек

```sql
-- Проверяем настройки реферальной системы
SELECT * FROM referral_settings;
```

### 3. Тестирование API

```bash
# Получение статистики (замените {token} на реальный токен)
curl -X GET "http://your-domain.com/api/referrals/my-stats" \
     -H "Authorization: Bearer {token}" \
     -H "Accept: application/json"

# Валидация промокода
curl -X POST "http://your-domain.com/api/referrals/validate-code" \
     -H "Authorization: Bearer {token}" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{"code": "ABC12345"}'
```

## Настройка мониторинга

### 1. Метрики для отслеживания

```sql
-- Дашборд метрик реферальной системы
-- Количество новых рефералов за день
SELECT DATE(created_at) as date, COUNT(*) as new_referrals
FROM referrals 
WHERE created_at >= CURDATE() - INTERVAL 7 DAY
GROUP BY DATE(created_at);

-- Общая статистика кэшбэка
SELECT 
    COUNT(*) as total_transactions,
    SUM(cashback_amount) as total_cashback_cents,
    AVG(cashback_amount) as avg_cashback_cents,
    SUM(cashback_amount)/100 as total_cashback_aed
FROM referral_transactions 
WHERE status = 'processed';

-- Топ реферреры
SELECT 
    u.name,
    u.email,
    u.total_referrals_count,
    u.total_referral_earnings/100 as total_earnings_aed
FROM users u 
WHERE u.total_referrals_count > 0 
ORDER BY u.total_referral_earnings DESC 
LIMIT 10;
```

### 2. Алерты

Настройте мониторинг для следующих событий:

- Превышение лимитов кэшбэка
- Подозрительная активность (много рефералов от одного IP)
- Ошибки в начислении кэшбэка
- Недоступность реферальных API

### 3. Логирование

Убедитесь, что логируются следующие события:

```php
// В config/logging.php добавьте канал для рефералов
'referrals' => [
    'driver' => 'daily',
    'path' => storage_path('logs/referrals.log'),
    'level' => 'info',
    'days' => 30,
],
```

## Обслуживание системы

### 1. Ежедневные задачи

```bash
# Создайте cron job для очистки старых логов
0 2 * * * cd /path/to/your/project && php artisan referrals:cleanup-logs

# Обновление статистики (если необходимо)
0 3 * * * cd /path/to/your/project && php artisan referrals:update-stats
```

### 2. Еженедельные проверки

- Проверка целостности данных
- Анализ метрик производительности
- Проверка логов на ошибки

### 3. Ежемесячные задачи

- Анализ эффективности программы
- Оптимизация настроек кэшбэка
- Очистка старых данных (если необходимо)

## Решение проблем

### Проблема: Промокоды не создаются

**Симптомы:** У новых пользователей нет промокодов

**Решение:**
```bash
# Проверьте логи
tail -f storage/logs/laravel.log | grep -i referral

# Создайте промокоды для существующих пользователей
php artisan tinker
>>> App\Models\User::whereDoesntHave('referralCode')->chunk(100, function($users) {
...     foreach($users as $user) {
...         App\Models\ReferralCode::createForUser($user);
...     }
... });
```

### Проблема: Кэшбэк не начисляется

**Симптомы:** При пополнении кошелька кэшбэк не приходит

**Решение:**
```bash
# Проверьте настройки
php artisan tinker
>>> App\Models\ReferralSetting::getAll()

# Проверьте очереди
php artisan queue:work --verbose

# Проверьте логи WalletService
tail -f storage/logs/laravel.log | grep -i cashback
```

### Проблема: API возвращает ошибки

**Симптомы:** 500 ошибки на endpoints рефералов

**Решение:**
```bash
# Проверьте права доступа к файлам
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/

# Очистите кеши
php artisan cache:clear
php artisan config:clear

# Проверьте подключение к БД
php artisan tinker
>>> DB::connection()->getPdo()
```

## Откат изменений

В случае критических проблем:

### 1. Быстрый откат

```bash
# Включить режим обслуживания
php artisan down

# Восстановить БД из резервной копии
mysql -u username -p database_name < backup_file.sql

# Откатить миграции
php artisan migrate:rollback --step=5

# Очистить кеши
php artisan cache:clear

# Выключить режим обслуживания
php artisan up
```

### 2. Отключение функций

Если нужно временно отключить партнёрскую программу:

```sql
-- Отключить программу через настройки
UPDATE referral_settings 
SET value = 'false' 
WHERE key = 'program_enabled';
```

## Масштабирование

### При росте нагрузки

1. **Кеширование:**
   - Кешируйте статистику рефералов
   - Используйте Redis для настроек

2. **Очереди:**
   - Обрабатывайте кэшбэк через очереди
   - Используйте отдельные воркеры для рефералов

3. **Индексы БД:**
   - Добавьте индексы на часто используемые поля
   - Мониторьте производительность запросов

4. **Микросервисы:**
   - Выделите реферальную систему в отдельный сервис
   - Используйте API для коммуникации

## Безопасность

### Рекомендации

1. **Валидация:**
   - Всегда валидируйте входные данные
   - Проверяйте права доступа

2. **Лимиты:**
   - Установите разумные лимиты на кэшбэк
   - Ограничьте количество запросов к API

3. **Аудит:**
   - Логируйте все операции с балансом
   - Мониторьте подозрительную активность

4. **Резервное копирование:**
   - Автоматические ежедневные бэкапы
   - Тестируйте восстановление из бэкапов

## Поддержка

При возникновении проблем:

1. Проверьте логи приложения
2. Убедитесь, что все миграции применены
3. Проверьте настройки в таблице `referral_settings`
4. Запустите тесты для проверки функциональности
5. Обратитесь к документации API

**Важно:** Всегда тестируйте изменения на staging окружении перед развёртыванием в production!
