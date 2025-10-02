# Примеры использования API подписок

## React/Next.js примеры

### Hook для работы с подписками

```typescript
// hooks/useSubscriptions.ts
import { useState, useEffect } from "react";

interface Subscription {
    id: number;
    stripe_status: string;
    ends_at: string | null;
    // ... другие поля
}

interface Tariff {
    id: number;
    name: string;
    price: number;
    duration_days: number;
    max_orders: number;
    max_responses: number;
    max_contacts: number;
    // ... другие поля
}

export const useSubscriptions = (token: string) => {
    const [currentSubscription, setCurrentSubscription] = useState<{
        subscription: Subscription;
        tariff: Tariff;
    } | null>(null);
    const [availableTariffs, setAvailableTariffs] = useState<Tariff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Получить текущую подписку
    const fetchCurrentSubscription = async () => {
        try {
            const response = await fetch("/api/subscriptions/my", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentSubscription(data);
            } else if (response.status === 404) {
                setCurrentSubscription(null);
            } else {
                throw new Error("Failed to fetch subscription");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        }
    };

    // Получить доступные тарифы
    const fetchAvailableTariffs = async () => {
        try {
            const response = await fetch("/api/subscriptions", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch tariffs");
            }

            const data = await response.json();
            setAvailableTariffs(data.subscriptions);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        }
    };

    // Оплатить подписку
    const purchaseSubscription = async (tariffId: number) => {
        try {
            const response = await fetch(
                `/api/subscriptions/${tariffId}/checkout`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                window.location.href = data.checkout_url;
            } else {
                throw new Error(
                    data.message || "Failed to create checkout session"
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        }
    };

    // Отменить подписку
    const cancelSubscription = async () => {
        try {
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
                await fetchCurrentSubscription(); // Обновить данные
                return data.message;
            } else {
                throw new Error(
                    data.message || "Failed to cancel subscription"
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            throw err;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchCurrentSubscription(),
                fetchAvailableTariffs(),
            ]);
            setLoading(false);
        };

        if (token) {
            loadData();
        }
    }, [token]);

    return {
        currentSubscription,
        availableTariffs,
        loading,
        error,
        purchaseSubscription,
        cancelSubscription,
        refetch: () => {
            fetchCurrentSubscription();
            fetchAvailableTariffs();
        },
    };
};
```

### Компонент страницы подписок

```tsx
// components/SubscriptionPage.tsx
import React from "react";
import { useSubscriptions } from "../hooks/useSubscriptions";

interface Props {
    userToken: string;
}

export const SubscriptionPage: React.FC<Props> = ({ userToken }) => {
    const {
        currentSubscription,
        availableTariffs,
        loading,
        error,
        purchaseSubscription,
        cancelSubscription,
    } = useSubscriptions(userToken);

    const handlePurchase = (tariffId: number) => {
        purchaseSubscription(tariffId);
    };

    const handleCancel = async () => {
        if (confirm("Вы уверены, что хотите отменить подписку?")) {
            try {
                const message = await cancelSubscription();
                alert(message);
            } catch (err) {
                alert("Ошибка при отмене подписки");
            }
        }
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка: {error}</div>;

    return (
        <div className="subscription-page">
            {currentSubscription ? (
                <CurrentSubscriptionCard
                    subscription={currentSubscription}
                    onCancel={handleCancel}
                />
            ) : (
                <div>У вас нет активной подписки</div>
            )}

            <div className="tariffs-grid">
                {availableTariffs.map((tariff) => (
                    <TariffCard
                        key={tariff.id}
                        tariff={tariff}
                        onPurchase={() => handlePurchase(tariff.id)}
                        isCurrentPlan={
                            currentSubscription?.tariff.id === tariff.id
                        }
                    />
                ))}
            </div>
        </div>
    );
};

// Компонент карточки текущей подписки
const CurrentSubscriptionCard: React.FC<{
    subscription: any;
    onCancel: () => void;
}> = ({ subscription, onCancel }) => {
    const { subscription: sub, tariff } = subscription;

    return (
        <div className="current-subscription-card">
            <h3>Ваша текущая подписка</h3>
            <div>
                <strong>{tariff.name}</strong>
                <p>Статус: {sub.stripe_status}</p>
                <p>Цена: ${tariff.price / 100}/месяц</p>
                <p>Заказов: до {tariff.max_orders}</p>
                <p>Откликов: до {tariff.max_responses}</p>
                {sub.ends_at && (
                    <p>
                        Действует до:{" "}
                        {new Date(sub.ends_at).toLocaleDateString()}
                    </p>
                )}
            </div>
            <button onClick={onCancel} className="cancel-button">
                Отменить подписку
            </button>
        </div>
    );
};

// Компонент карточки тарифа
const TariffCard: React.FC<{
    tariff: any;
    onPurchase: () => void;
    isCurrentPlan: boolean;
}> = ({ tariff, onPurchase, isCurrentPlan }) => {
    return (
        <div className={`tariff-card ${isCurrentPlan ? "current" : ""}`}>
            <h3>{tariff.name}</h3>
            <div className="price">${tariff.price / 100}</div>
            <div className="duration">на {tariff.duration_days} дней</div>

            <ul className="features">
                <li>До {tariff.max_orders} заказов</li>
                <li>До {tariff.max_responses} откликов</li>
                <li>До {tariff.max_contacts} контактов</li>
            </ul>

            {!isCurrentPlan && (
                <button onClick={onPurchase} className="purchase-button">
                    Выбрать план
                </button>
            )}

            {isCurrentPlan && (
                <div className="current-plan-badge">Текущий план</div>
            )}
        </div>
    );
};
```

---

## Vue.js примеры

### Composable для работы с подписками

```typescript
// composables/useSubscriptions.ts
import { ref, computed } from "vue";

export const useSubscriptions = (token: string) => {
    const currentSubscription = ref(null);
    const availableTariffs = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const hasActiveSubscription = computed(() => {
        return currentSubscription.value !== null;
    });

    const isSubscriptionActive = computed(() => {
        return (
            currentSubscription.value?.subscription?.stripe_status === "active"
        );
    });

    const fetchCurrentSubscription = async () => {
        try {
            loading.value = true;
            const response = await fetch("/api/subscriptions/my", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                currentSubscription.value = data;
            } else if (response.status === 404) {
                currentSubscription.value = null;
            }
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    };

    const fetchAvailableTariffs = async () => {
        try {
            const response = await fetch("/api/subscriptions", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                availableTariffs.value = data.subscriptions;
            }
        } catch (err) {
            error.value = err.message;
        }
    };

    const purchaseSubscription = async (tariffId: number) => {
        try {
            const response = await fetch(
                `/api/subscriptions/${tariffId}/checkout`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            const data = await response.json();
            if (data.success) {
                window.location.href = data.checkout_url;
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            error.value = err.message;
        }
    };

    return {
        currentSubscription,
        availableTariffs,
        loading,
        error,
        hasActiveSubscription,
        isSubscriptionActive,
        fetchCurrentSubscription,
        fetchAvailableTariffs,
        purchaseSubscription,
    };
};
```

### Vue компонент

```vue
<!-- SubscriptionPage.vue -->
<template>
    <div class="subscription-page">
        <div v-if="loading" class="loading">Загрузка...</div>

        <div v-else-if="error" class="error">Ошибка: {{ error }}</div>

        <div v-else>
            <!-- Текущая подписка -->
            <div v-if="hasActiveSubscription" class="current-subscription">
                <h2>Ваша подписка</h2>
                <div class="subscription-info">
                    <h3>{{ currentSubscription.tariff.name }}</h3>
                    <p>
                        Статус:
                        {{ currentSubscription.subscription.stripe_status }}
                    </p>
                    <p>
                        Цена:
                        {{ formatPrice(currentSubscription.tariff.price) }}
                    </p>
                </div>
            </div>

            <!-- Доступные тарифы -->
            <div class="tariffs-section">
                <h2>Выберите тариф</h2>
                <div class="tariffs-grid">
                    <div
                        v-for="tariff in availableTariffs"
                        :key="tariff.id"
                        class="tariff-card"
                        :class="{ active: isCurrentTariff(tariff.id) }"
                    >
                        <h3>{{ tariff.name }}</h3>
                        <div class="price">{{ formatPrice(tariff.price) }}</div>
                        <div class="features">
                            <div>Заказов: {{ tariff.max_orders }}</div>
                            <div>Откликов: {{ tariff.max_responses }}</div>
                            <div>Контактов: {{ tariff.max_contacts }}</div>
                        </div>

                        <button
                            v-if="!isCurrentTariff(tariff.id)"
                            @click="purchaseSubscription(tariff.id)"
                            class="purchase-btn"
                        >
                            Выбрать
                        </button>

                        <div v-else class="current-badge">Текущий план</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useSubscriptions } from "@/composables/useSubscriptions";

const props = defineProps<{
    userToken: string;
}>();

const {
    currentSubscription,
    availableTariffs,
    loading,
    error,
    hasActiveSubscription,
    fetchCurrentSubscription,
    fetchAvailableTariffs,
    purchaseSubscription,
} = useSubscriptions(props.userToken);

const formatPrice = (price: number) => {
    return `$${price / 100}`;
};

const isCurrentTariff = (tariffId: number) => {
    return currentSubscription.value?.tariff?.id === tariffId;
};

onMounted(async () => {
    await Promise.all([fetchCurrentSubscription(), fetchAvailableTariffs()]);
});
</script>
```

---

## JavaScript (ванильный) пример

### Класс для работы с подписками

```javascript
// SubscriptionManager.js
class SubscriptionManager {
    constructor(apiBaseUrl, authToken) {
        this.apiBaseUrl = apiBaseUrl;
        this.authToken = authToken;
    }

    async request(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const config = {
            headers: {
                Authorization: `Bearer ${this.authToken}`,
                Accept: "application/json",
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
    }

    async getCurrentSubscription() {
        try {
            return await this.request("/subscriptions/my");
        } catch (error) {
            if (error.message.includes("404")) {
                return null; // Нет подписки
            }
            throw error;
        }
    }

    async getAvailableTariffs() {
        const data = await this.request("/subscriptions");
        return data.subscriptions;
    }

    async purchaseSubscription(tariffId) {
        const data = await this.request(`/subscriptions/${tariffId}/checkout`, {
            method: "POST",
        });

        if (data.success) {
            window.location.href = data.checkout_url;
        }

        return data;
    }

    async cancelSubscription() {
        return await this.request("/subscriptions/unsubscribe", {
            method: "POST",
        });
    }
}

// Использование
const subscriptionManager = new SubscriptionManager("/api", userToken);

// Пример загрузки данных и отображения
async function loadSubscriptionPage() {
    try {
        const [currentSub, tariffs] = await Promise.all([
            subscriptionManager.getCurrentSubscription(),
            subscriptionManager.getAvailableTariffs(),
        ]);

        renderSubscriptionPage(currentSub, tariffs);
    } catch (error) {
        console.error("Error loading subscriptions:", error);
        showError(error.message);
    }
}

function renderSubscriptionPage(currentSubscription, tariffs) {
    const container = document.getElementById("subscription-container");

    let html = "";

    // Отображение текущей подписки
    if (currentSubscription) {
        html += `
      <div class="current-subscription">
        <h2>Ваша подписка</h2>
        <div class="subscription-card">
          <h3>${currentSubscription.tariff.name}</h3>
          <p>Статус: ${currentSubscription.subscription.stripe_status}</p>
          <p>Цена: $${currentSubscription.tariff.price / 100}</p>
          <button onclick="cancelCurrentSubscription()">Отменить</button>
        </div>
      </div>
    `;
    }

    // Отображение доступных тарифов
    html +=
        '<div class="tariffs-section"><h2>Доступные тарифы</h2><div class="tariffs-grid">';

    tariffs.forEach((tariff) => {
        const isCurrentPlan = currentSubscription?.tariff?.id === tariff.id;

        html += `
      <div class="tariff-card ${isCurrentPlan ? "current" : ""}">
        <h3>${tariff.name}</h3>
        <div class="price">$${tariff.price / 100}</div>
        <div class="duration">${tariff.duration_days} дней</div>
        <ul class="features">
          <li>Заказов: ${tariff.max_orders}</li>
          <li>Откликов: ${tariff.max_responses}</li>
          <li>Контактов: ${tariff.max_contacts}</li>
        </ul>
        ${
            isCurrentPlan
                ? '<div class="current-badge">Текущий план</div>'
                : `<button onclick="purchaseTariff(${tariff.id})">Выбрать</button>`
        }
      </div>
    `;
    });

    html += "</div></div>";
    container.innerHTML = html;
}

// Глобальные функции для обработки событий
async function purchaseTariff(tariffId) {
    try {
        await subscriptionManager.purchaseSubscription(tariffId);
    } catch (error) {
        alert("Ошибка при оформлении подписки: " + error.message);
    }
}

async function cancelCurrentSubscription() {
    if (!confirm("Вы уверены, что хотите отменить подписку?")) {
        return;
    }

    try {
        const result = await subscriptionManager.cancelSubscription();
        alert(result.message);
        loadSubscriptionPage(); // Перезагрузить данные
    } catch (error) {
        alert("Ошибка при отмене подписки: " + error.message);
    }
}

function showError(message) {
    const container = document.getElementById("subscription-container");
    container.innerHTML = `<div class="error">Ошибка: ${message}</div>`;
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", loadSubscriptionPage);
```

---

## CSS стили для примеров

```css
/* Общие стили для подписок */
.subscription-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.loading,
.error {
    text-align: center;
    padding: 40px;
    font-size: 18px;
}

.error {
    color: #e74c3c;
    background-color: #fdf2f2;
    border: 1px solid #e74c3c;
    border-radius: 8px;
}

/* Текущая подписка */
.current-subscription-card,
.current-subscription {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 32px;
}

.current-subscription h2,
.current-subscription h3 {
    margin: 0 0 16px 0;
    color: #2c3e50;
}

/* Сетка тарифов */
.tariffs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-top: 24px;
}

.tariff-card {
    border: 1px solid #e1e8ed;
    border-radius: 12px;
    padding: 24px;
    background: white;
    transition: all 0.3s ease;
    position: relative;
}

.tariff-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #3498db;
}

.tariff-card.current,
.tariff-card.active {
    border-color: #27ae60;
    background: #f8fff9;
}

.tariff-card h3 {
    margin: 0 0 12px 0;
    font-size: 24px;
    color: #2c3e50;
}

.price {
    font-size: 32px;
    font-weight: bold;
    color: #3498db;
    margin-bottom: 8px;
}

.duration {
    color: #7f8c8d;
    margin-bottom: 20px;
}

.features {
    list-style: none;
    padding: 0;
    margin: 20px 0;
}

.features li,
.features div {
    padding: 8px 0;
    border-bottom: 1px solid #ecf0f1;
    color: #34495e;
}

.features li:last-child,
.features div:last-child {
    border-bottom: none;
}

/* Кнопки */
.purchase-button,
.purchase-btn,
.cancel-button {
    width: 100%;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-top: 16px;
}

.purchase-button,
.purchase-btn {
    background-color: #3498db;
    color: white;
}

.purchase-button:hover,
.purchase-btn:hover {
    background-color: #2980b9;
}

.cancel-button {
    background-color: #e74c3c;
    color: white;
}

.cancel-button:hover {
    background-color: #c0392b;
}

/* Бейджи */
.current-plan-badge,
.current-badge {
    background-color: #27ae60;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    text-align: center;
    font-weight: 600;
    margin-top: 16px;
}

/* Адаптивность */
@media (max-width: 768px) {
    .tariffs-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .subscription-page {
        padding: 16px;
    }

    .price {
        font-size: 28px;
    }
}
```

Эти примеры предоставляют готовые решения для интеграции API подписок в различных фронтенд-фреймворках и библиотеках.
