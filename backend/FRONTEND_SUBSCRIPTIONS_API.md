# API Подписок для Фронтенда

## Обзор

API подписок позволяет пользователям просматривать доступные тарифы, управлять своими подписками и производить оплату через Stripe.

**Базовый URL:** `{base_url}/api`  
**Авторизация:** Bearer Token (обязательна для всех endpoints)

---

## 📋 Endpoints

### 1. Получить список доступных тарифов

**Endpoint:** `GET /subscriptions`  
**Описание:** Возвращает список всех активных тарифных планов

#### Запрос

```http
GET /api/subscriptions
Authorization: Bearer {token}
Accept: application/json
```

#### Ответ 200 OK

```json
{
    "success": true,
    "subscriptions": [
        {
            "id": 1,
            "name": "Тестовый тариф",
            "stripe_product_id": "prod_test_123",
            "stripe_price_id": "price_test_123",
            "duration_days": 30,
            "max_orders": 10,
            "max_responses": 50,
            "max_contacts": 20,
            "price": 999,
            "is_active": true,
            "created_at": "2025-08-06T05:52:01.000000Z",
            "updated_at": "2025-08-06T05:52:01.000000Z"
        }
    ]
}
```

---

### 2. Получить текущую подписку пользователя

**Endpoint:** `GET /subscriptions/my`  
**Описание:** Возвращает информацию о текущем тарифе пользователя. По умолчанию у всех пользователей есть бесплатный тариф "Free".

#### Запрос

```http
GET /api/subscriptions/my
Authorization: Bearer {token}
Accept: application/json
```

#### Ответ 200 OK

```json
{
    "success": true,
    "subscription": {
        "id": 1,
        "user_id": 4,
        "type": "default",
        "stripe_id": "sub_test_QBU2k59ggp",
        "stripe_status": "active",
        "stripe_price": "price_test_123",
        "quantity": 1,
        "trial_ends_at": null,
        "ends_at": null,
        "created_at": "2025-08-06T05:53:09.000000Z",
        "updated_at": "2025-08-06T05:53:09.000000Z",
        "items": []
    },
    "tariff": {
        "id": 1,
        "name": "Тестовый тариф",
        "stripe_product_id": "prod_test_123",
        "stripe_price_id": "price_test_123",
        "duration_days": 30,
        "max_orders": 10,
        "max_responses": 50,
        "max_contacts": 20,
        "price": 999,
        "is_active": true,
        "created_at": "2025-08-06T05:52:01.000000Z",
        "updated_at": "2025-08-06T05:52:01.000000Z"
    }
}
```

#### Ответ 404 Not Found

```json
{
    "success": false,
    "message": "У вас нет активной подписки"
}
```

---

### 3. Создать сессию оплаты

**Endpoint:** `POST /subscriptions/{tariff_id}/checkout`  
**Описание:** Оформляет подписку на выбранный тариф. Для бесплатных тарифов активирует тариф немедленно, для платных создает сессию оплаты Stripe

#### Запрос

```http
POST /api/subscriptions/1/checkout
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

#### Ответ 200 OK

Для платных тарифов:
```json
{
    "success": true,
    "checkout_url": "https://checkout.stripe.com/pay/cs_test_abc123",
    "is_free": false
}
```

Для бесплатных тарифов:
```json
{
    "success": true,
    "message": "Бесплатный тариф успешно активирован",
    "tariff": {
        "id": 4,
        "name": "Free",
        "price": 0,
        "duration_days": 0,
        "max_orders": 0,
        "max_responses": 0,
        "max_contacts": 0,
        "is_active": true
    },
    "is_free": true
}
```

#### Ответ 400 Bad Request

Возможные сообщения об ошибках:

```json
{
    "success": false,
    "message": "У вас уже активна подписка на этот тариф"
}
```

```json
{
    "success": false,
    "message": "Данный тариф временно недоступен для покупки. Попробуйте позже или выберите другой тариф."
}
```

#### Ответ 500 Internal Server Error

```json
{
    "success": false,
    "message": "Не удалось создать сессию оплаты. Попробуйте еще раз или обратитесь в поддержку."
}
```

---

### 4. Отменить подписку

**Endpoint:** `POST /subscriptions/unsubscribe`  
**Описание:** Отменяет текущую подписку (отмена произойдет в конце текущего периода)

#### Запрос

```http
POST /api/subscriptions/unsubscribe
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

#### Ответ 200 OK

```json
{
    "success": true,
    "message": "Подписка будет отменена в конце текущего периода"
}
```

#### Ответ 404 Not Found

```json
{
    "success": false,
    "message": "У вас нет активной подписки"
}
```

---

## 📊 Модели данных

### Tariff (Тариф)

```typescript
interface Tariff {
    id: number;
    name: string; // Название тарифа
    stripe_product_id: string; // ID продукта в Stripe
    stripe_price_id: string; // ID цены в Stripe
    duration_days: number; // Длительность в днях
    max_orders: number; // Максимум заказов
    max_responses: number; // Максимум откликов
    max_contacts: number; // Максимум контактов
    price: number; // Цена в копейках
    is_active: boolean; // Активен ли тариф
    created_at: string; // ISO 8601 дата создания
    updated_at: string; // ISO 8601 дата обновления
}
```

### UserSubscription (Подписка пользователя)

```typescript
interface UserSubscription {
    id: number;
    user_id: number; // ID пользователя
    type: string; // Тип подписки (обычно "default")
    stripe_id: string; // ID подписки в Stripe
    stripe_status: string; // Статус в Stripe
    stripe_price: string; // ID цены в Stripe
    quantity: number; // Количество
    trial_ends_at: string | null; // Дата окончания пробного периода
    ends_at: string | null; // Дата окончания подписки
    created_at: string; // ISO 8601 дата создания
    updated_at: string; // ISO 8601 дата обновления
    items: any[]; // Элементы подписки
}
```

### ErrorResponse (Ответ с ошибкой)

```typescript
interface ErrorResponse {
    success: false;
    message?: string; // Сообщение об ошибке
    error?: string; // Детальное описание ошибки
}
```

---

## 🎯 Статусы подписки Stripe

| Статус               | Описание          |
| -------------------- | ----------------- |
| `incomplete`         | Платеж в процессе |
| `incomplete_expired` | Платеж не удался  |
| `trialing`           | Пробный период    |
| `active`             | Активная подписка |
| `past_due`           | Просрочен платеж  |
| `canceled`           | Отменена          |
| `unpaid`             | Неоплачена        |

---

## 🔄 Типичные сценарии использования

### 1. Загрузка списка тарифов для страницы подписок

```javascript
// Получить все доступные тарифы
const response = await fetch("/api/subscriptions", {
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
    },
});

const data = await response.json();
if (data.success) {
    // Отобразить тарифы пользователю
    displayTariffs(data.subscriptions);
}
```

### 2. Проверка текущей подписки пользователя

```javascript
// Проверить есть ли у пользователя активная подписка
const response = await fetch("/api/subscriptions/my", {
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
    },
});

if (response.status === 200) {
    const data = await response.json();
    // У пользователя есть активная подписка
    displayCurrentSubscription(data.subscription, data.tariff);
} else if (response.status === 404) {
    // У пользователя нет подписки
    showSubscriptionPlans();
}
```

### 3. Оплата подписки

```javascript
// Создать сессию оплаты и перенаправить на Stripe
const tariffId = 1;
const response = await fetch(`/api/subscriptions/${tariffId}/checkout`, {
    method: "POST",
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

const data = await response.json();
if (data.success) {
    // Перенаправить на страницу оплаты Stripe
    window.location.href = data.checkout_url;
} else {
    // Показать ошибку
    showError(data.message);
}
```

### 4. Отмена подписки

```javascript
// Отменить текущую подписку
const response = await fetch("/api/subscriptions/unsubscribe", {
    method: "POST",
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

const data = await response.json();
if (data.success) {
    showMessage(data.message);
    // Обновить UI для отображения статуса отмены
} else {
    showError(data.message);
}
```

---

## ⚠️ Важные особенности

### Авторизация

-   Все endpoints требуют Bearer токен
-   При отсутствии токена вернется ошибка 401 Unauthorized

### Ограничения для исполнителей

-   Некоторые функции требуют верификации исполнителя
-   Проверяйте статус верификации пользователя

### Обработка ошибок

-   Всегда проверяйте поле `success` в ответе
-   HTTP статус коды соответствуют стандартам REST
-   Детальные сообщения об ошибках доступны в полях `message` и `error`

### Stripe интеграция

-   Используется Stripe Checkout для безопасной оплаты
-   После успешной оплаты пользователь будет перенаправлен обратно в приложение
-   Webhook события обрабатываются автоматически на бэкенде

---

## 🔗 Полезные ссылки

-   [Swagger документация](/swagger)
-   [Stripe документация](https://stripe.com/docs)
-   [Laravel Cashier документация](https://laravel.com/docs/cashier)
