# ChatGPT Design Generation Integration

## Обзор

Интегрирована система генерации дизайна интерьера с использованием ChatGPT API. Система позволяет пользователям создавать детальные дизайн-проекты на основе описания, типа комнаты, стиля и бюджета.

## Установка и настройка

### 1. Установка пакетов

```bash
cd backend
composer install
```

Пакет `openai-php/client` добавлен в `composer.json`.

### 2. Конфигурация OpenAI API

Добавьте в `.env` файл:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORGANIZATION=
OPENAI_REQUEST_TIMEOUT=30
```

### 3. Получение API ключа

1. Зарегистрируйтесь на [OpenAI Platform](https://platform.openai.com/)
2. Перейдите в API Keys section
3. Создайте новый API ключ
4. Добавьте ключ в `.env` файл

## Архитектура

### Backend

#### Сервисы

**`ChatGPTDesignService`** - основной сервис для работы с ChatGPT API:
- `generateInteriorDesign()` - генерация дизайна
- `generateDesignVariations()` - создание вариаций
- `buildDesignPrompt()` - построение промпта
- `parseDesignResponse()` - парсинг ответа

#### Контроллеры

**`DesignGenerationController`** - API контроллер:
- `POST /api/design/generate` - генерация дизайна
- `POST /api/design/variations` - генерация вариаций
- `GET /api/design/options` - получение опций

#### Конфигурация

**`config/openai.php`** - конфигурация OpenAI:
```php
return [
    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),
    'request_timeout' => env('OPENAI_REQUEST_TIMEOUT', 30),
];
```

### Mobile App

#### Хуки

**`useChatGPTDesignGeneration`** - хук для управления генерацией:
- Управление состоянием формы
- Вызов API методов
- Обработка результатов

#### Экраны

**`ChatGPTDesignGeneration`** - основной экран генерации:
- Форма ввода описания
- Выбор типа комнаты и стиля
- Выбор бюджета
- Отображение результатов

#### API интеграция

Добавлены методы в `unified-api.ts`:
```typescript
design: {
  generate: (data) => Promise<ApiResponse>,
  generateVariations: (data) => Promise<ApiResponse>,
  getOptions: () => Promise<ApiResponse>
}
```

## API Endpoints

### POST /api/design/generate

Генерирует дизайн интерьера на основе входных данных.

**Параметры запроса:**
```json
{
  "description": "Описание проекта (обязательно)",
  "room_type": ["living_room", "bedroom"], // опционально
  "style": ["modern", "minimalist"], // опционально
  "budget": {
    "min": 5000,
    "max": 15000
  } // опционально
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Design generated successfully",
  "data": {
    "design": {
      "sections": {
        "color_scheme": "Детальная цветовая схема...",
        "layout_suggestions": "Планировка и расстановка мебели...",
        "material_recommendations": "Рекомендации по материалам...",
        // ... другие секции
      },
      "summary": "Краткое резюме дизайна",
      "shopping_list": [
        {
          "item": "Название товара",
          "estimated_price": 1500
        }
      ],
      "estimated_cost": {
        "min": 5000,
        "max": 15000,
        "currency": "AED"
      }
    },
    "tokens_used": 1250,
    "generated_at": "2025-01-01T12:00:00.000Z"
  }
}
```

### POST /api/design/variations

Создает вариации существующего дизайна.

**Параметры запроса:**
```json
{
  "original_design": "Текст оригинального дизайна",
  "count": 3 // количество вариаций (1-5)
}
```

### GET /api/design/options

Возвращает доступные опции для генерации.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "room_types": [
      {"key": "living_room", "label": "Living Room"},
      {"key": "bedroom", "label": "Bedroom"}
    ],
    "styles": [
      {"key": "modern", "label": "Modern"},
      {"key": "arabic", "label": "Arabic"}
    ],
    "budget_ranges": [
      {"min": 5000, "max": 15000, "label": "5,000 - 15,000 AED"}
    ]
  }
}
```

## Особенности реализации

### ChatGPT Промпт

Система создает детальные промпты, учитывающие:
- Локальный контекст (Dubai, UAE)
- Климатические особенности
- Культурные предпочтения
- Доступность материалов в регионе
- Конкретные ценовые диапазоны в AED

### Парсинг ответов

Ответы ChatGPT парсятся и структурируются:
- Разделение на секции (цвета, материалы, мебель и т.д.)
- Извлечение списка покупок с ценами
- Расчет общей стоимости
- Создание краткого резюме

### Обработка ошибок

- Логирование всех запросов и ошибок
- Graceful degradation при недоступности API
- Валидация входных данных
- Таймауты для запросов

## Использование

### В мобильном приложении

1. Пользователь описывает проект
2. Выбирает тип комнаты, стиль, бюджет
3. Нажимает "Generate Design"
4. Получает детальный дизайн-план
5. Может создать вариации или заказ

### Функции

- **Генерация дизайна** - создание полного дизайн-проекта
- **Вариации** - альтернативные варианты дизайна
- **Список покупок** - конкретные товары с ценами
- **Создание заказа** - переход к размещению заказа
- **Многоязычность** - поддержка английского и арабского

## Мониторинг и логи

Все действия логируются:
- Запросы к ChatGPT API
- Использованные токены
- Ошибки генерации
- Время выполнения

Логи можно найти в `storage/logs/laravel.log`.

## Стоимость

- Использует модель GPT-4
- Примерная стоимость: $0.03-0.06 за запрос
- Рекомендуется мониторить использование токенов
- Можно настроить лимиты в OpenAI Dashboard

## Безопасность

- API ключ хранится в `.env`
- Валидация всех входных данных
- Защита от спама (можно добавить rate limiting)
- Логирование для аудита

## Будущие улучшения

- Сохранение истории дизайнов пользователя
- Интеграция с каталогом товаров
- Генерация изображений (DALL-E)
- Персонализация на основе предпочтений
- Интеграция с поставщиками мебели в UAE
