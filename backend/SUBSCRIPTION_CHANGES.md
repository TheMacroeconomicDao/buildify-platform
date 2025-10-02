# Изменения в системе подписок

## Обзор изменений

Внесены изменения в логику обработки подписок за $0 и добавлена возможность удаления подписок в админ-панели.

## 1. Изменения в логике подписок за $0

### Проблема
Ранее подписки за $0 (включая тестовые) активировались мгновенно без прохождения через процесс оплаты.

### Решение
Теперь **все подписки**, включая за $0, перенаправляются на процесс оплаты через Stripe Checkout.

### Изменения в коде

#### `app/Http/Controllers/SubscriptionController.php`

1. **Удалена мгновенная активация для $0 подписок:**
   ```php
   // УДАЛЕНО:
   if ($tariff->price == 0) {
       $user->activateSubscription($tariff);
       return response()->json([...]);
   }
   ```

2. **Обновлена проверка дублирования подписок:**
   ```php
   // Для тарифов с Stripe ID проверяем через Stripe
   if ($tariff->stripe_price_id && $user->subscribedToPrice($tariff->stripe_price_id)) {
       // ...
   }
   
   // Для тарифов без Stripe ID (тестовые, $0) проверяем через текущий тариф
   if (!$tariff->stripe_price_id && $user->current_tariff_id === $tariff->id && $user->hasActiveSubscription()) {
       // ...
   }
   ```

3. **Обновлен метод `success()` для активации подписок:**
   ```php
   public function success(Request $request)
   {
       $sessionId = $request->get('session_id');
       $tariffId = $request->get('tariff_id');
       
       // Проверяем статус платежа в Stripe
       $session = \Laravel\Cashier\Cashier::stripe()->checkout->sessions->retrieve($sessionId);
       
       if ($session->payment_status !== 'paid') {
           // Ошибка
       }
       
       // Активируем подписку
       $user->activateSubscription($tariff);
   }
   ```

### Поведение для пользователей

- **Платные подписки**: Как и раньше - перенаправление на Stripe Checkout
- **Подписки за $0**: Теперь тоже перенаправляются на Stripe Checkout, но платеж проходит мгновенно
- **Тестовые подписки**: Аналогично подпискам за $0

### Преимущества

1. **Единообразный UX**: Все подписки проходят через одинаковый процесс
2. **Лучшая аналитика**: Все активации подписок проходят через единую точку
3. **Проще тестирование**: Можно тестировать весь flow оплаты с $0 подписками

## 2. Удаление подписок в админ-панели

### Новая функциональность
Добавлена возможность удаления подписок через админ-панель с защитой от случайного удаления.

### Изменения в коде

#### `app/Orchid/Screens/Subscription/SubscriptionListScreen.php`

1. **Добавлена колонка "Test":**
   ```php
   TD::make('is_test', 'Test')->sort()
       ->render(fn(Tariff $s) => $s->is_test ? 'Yes' : 'No'),
   ```

2. **Обновлена колонка действий с DropDown:**
   ```php
   TD::make('actions', 'Actions')
       ->render(fn(Tariff $s) => DropDown::make()
           ->list([
               Link::make('Edit')->route('platform.subscriptions.edit', $s),
               Button::make('Delete')
                   ->confirm('Are you sure you want to delete this subscription?')
                   ->method('remove')
                   ->parameters(['id' => $s->id])
                   ->canSee(!$this->isSystemTariff($s)),
           ])),
   ```

3. **Добавлен метод защиты системных тарифов:**
   ```php
   private function isSystemTariff(Tariff $tariff): bool
   {
       return $tariff->name === 'Free';
   }
   ```

4. **Добавлен метод удаления с проверками:**
   ```php
   public function remove(\Illuminate\Http\Request $request)
   {
       $tariff = Tariff::findOrFail($request->get('id'));
       
       // Защита системных тарифов
       if ($this->isSystemTariff($tariff)) {
           Alert::error('Cannot delete system tariff');
           return;
       }
       
       // Проверка активных пользователей
       $activeUsersCount = \App\Models\User::where('current_tariff_id', $tariff->id)
           ->whereNotNull('subscription_ends_at')
           ->where('subscription_ends_at', '>', now())
           ->count();
           
       if ($activeUsersCount > 0) {
           Alert::error("Cannot delete tariff. {$activeUsersCount} users have active subscriptions.");
           return;
       }
       
       // Архивирование в Stripe (если есть)
       if ($tariff->stripe_product_id) {
           $stripe = new \Stripe\StripeClient(config('cashier.secret'));
           $stripe->products->update($tariff->stripe_product_id, ['active' => false]);
       }
       
       // Удаление
       $tariff->delete();
       Alert::success('Subscription deleted successfully');
   }
   ```

### Защиты при удалении

1. **Системные тарифы**: Тариф "Free" нельзя удалить
2. **Активные подписки**: Нельзя удалить тариф, если у пользователей есть активные подписки
3. **Stripe интеграция**: При удалении тарифа с Stripe ID продукт архивируется в Stripe
4. **Подтверждение**: Требуется подтверждение перед удалением

### Интерфейс

- **Кнопка удаления**: Отображается только для тарифов, которые можно удалить
- **Подтверждение**: Модальное окно с подтверждением действия
- **Уведомления**: Информативные сообщения об успехе или ошибках

## 3. Тестирование

### Команды для тестирования

1. **Создание тестовой подписки за $0:**
   ```bash
   php artisan subscription:create-test --name="Test Zero" --days=7 --orders=5 --contacts=10
   ```

2. **Проверка списка подписок:**
   ```bash
   php artisan tinker --execute="App\Models\Tariff::where('is_active', true)->get(['id', 'name', 'price', 'is_test'])"
   ```

### Сценарии тестирования

1. **Покупка подписки за $0:**
   - Выбрать тестовую подписку в мобильном приложении
   - Проверить перенаправление на Stripe Checkout
   - Убедиться в мгновенной активации

2. **Удаление подписки в админке:**
   - Попробовать удалить тариф "Free" (должно быть заблокировано)
   - Удалить тестовую подписку без активных пользователей
   - Попробовать удалить тариф с активными пользователями (должно быть заблокировано)

## 4. Миграция существующих данных

Существующие подписки и пользователи не требуют миграции. Изменения затрагивают только новые активации подписок.

## 5. Обратная совместимость

- **API endpoints**: Не изменились
- **Мобильное приложение**: Работает без изменений
- **Существующие подписки**: Продолжают работать как раньше

## 6. Мониторинг

Рекомендуется отслеживать:

1. **Успешность активации $0 подписок** через Stripe webhooks
2. **Количество удалений подписок** в админ-панели
3. **Ошибки при обработке Stripe Checkout** для $0 сумм

## Заключение

Изменения делают систему подписок более единообразной и добавляют необходимые инструменты управления для администраторов, сохраняя при этом обратную совместимость.
