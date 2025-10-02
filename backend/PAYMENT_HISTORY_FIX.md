# Исправление истории платежей

## Проблема
После успешной оплаты подписки история платежей не обновлялась ни в мобильном приложении, ни в админ-панели.

## Причина
В методе `success` контроллера подписок активировалась подписка, но не создавались записи о транзакциях в базе данных.

## Решение

### 1. Создан новый сервис `SubscriptionTransactionService`

**Файл:** `backend/app/Services/SubscriptionTransactionService.php`

Сервис отвечает за:
- Создание записей в таблице `wallet_transactions` для новой системы
- Создание записей в таблице `transaction` для совместимости со старой системой
- Сохранение метаданных о подписке (название тарифа, длительность, тестовая ли подписка)

**Ключевые методы:**
- `recordSubscriptionPayment()` - создает запись в новой системе транзакций
- `recordLegacyTransaction()` - создает запись в старой системе для совместимости

### 2. Обновлен `SubscriptionController`

**Файл:** `backend/app/Http/Controllers/SubscriptionController.php`

В метод `success()` добавлено:
- Импорт `SubscriptionTransactionService`
- Создание записи о транзакции после активации подписки
- Возврат ID транзакции в ответе API

```php
// Записываем транзакцию в историю платежей
$transactionService = new SubscriptionTransactionService();
$paymentIntentId = $session->payment_intent ?? null;

// Создаем запись в новой системе транзакций
$transaction = $transactionService->recordSubscriptionPayment(
    $user, 
    $tariff, 
    $sessionId, 
    $paymentIntentId
);

// Создаем запись в старой системе (для совместимости)
$transactionService->recordLegacyTransaction($user, $tariff, $sessionId);
```

### 3. Обновлен экран истории платежей в админке

**Файл:** `backend/app/Orchid/Screens/Payment/PaymentListScreen.php`

Изменения:
- Добавлены человекочитаемые названия для типов транзакций
- Добавлена колонка "Details" с информацией о подписке
- Исправлено отображение суммы (деление на 100 для центов)

**Новые типы транзакций:**
- `subscription_payment` - оплата подписки
- `deposit` - пополнение кошелька
- `withdrawal` - вывод средств

### 4. Обновлен Stripe Event Listener

**Файл:** `backend/app/Listeners/StripeEventListener.php`

Добавлено создание транзакций при получении webhook'ов от Stripe для обеспечения полной синхронизации.

## Структура данных транзакций

### Таблица `wallet_transactions`
- `type` - тип транзакции (`subscription_payment`, `deposit`, etc.)
- `amount` - сумма в центах
- `stripe_session_id` - ID сессии Stripe
- `stripe_payment_intent_id` - ID платежного намерения Stripe
- `meta` - JSON с метаданными:
  ```json
  {
    "tariff_id": 7,
    "tariff_name": "Test",
    "duration_days": 30,
    "is_test": true,
    "transaction_type": "subscription_purchase"
  }
  ```

### Таблица `transaction` (старая система)
- `subscription_id` - ID подписки из старой таблицы
- `amount` - сумма платежа
- `payment_id` - ID сессии Stripe
- `status` - статус (1 = успешно)

## Результат

Теперь после успешной оплаты подписки:

1. ✅ **Активируется подписка** пользователя
2. ✅ **Создается запись в истории платежей** (новая система)
3. ✅ **Создается запись для совместимости** (старая система)
4. ✅ **Отображается в админ-панели** с детальной информацией
5. ✅ **Синхронизируется через Stripe webhooks**

## Тестирование

```bash
# Создать тестовую транзакцию
php artisan tinker --execute="
\$user = App\Models\User::first();
\$tariff = App\Models\Tariff::where('name', 'Test')->first();
\$service = new App\Services\SubscriptionTransactionService();
\$transaction = \$service->recordSubscriptionPayment(\$user, \$tariff, 'test_session_123');
echo 'Transaction ID: ' . \$transaction->id;
"

# Проверить транзакции в админке
php artisan tinker --execute="
\$transactions = App\Models\WalletTransaction::with('user')->latest()->limit(5)->get();
foreach (\$transactions as \$t) {
    echo \$t->id . ' - ' . \$t->type . ' - $' . number_format(\$t->amount/100, 2) . PHP_EOL;
}
"
```

## Совместимость

- ✅ Существующие транзакции продолжают работать
- ✅ Старая система транзакций поддерживается
- ✅ Новые транзакции видны в обеих системах
- ✅ Мобильное приложение получает обновленные данные подписки
