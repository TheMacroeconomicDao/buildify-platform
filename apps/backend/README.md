# 🏗️ Buildify Backend API

Laravel 11 based RESTful API for Buildify marketplace platform.

## 📋 Overview

Enterprise-grade backend API providing comprehensive marketplace functionality including:
- Multi-role user management (Customer, Executor, Mediator, Admin)
- Order management and workflow
- Subscription and payment processing
- Real-time WebSocket notifications
- AI-powered design generation
- Referral system with automated cashback
- Admin panel via Orchid Platform

## 🚀 Tech Stack

- **Framework**: Laravel 11
- **PHP**: 8.2+
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Queue**: Redis-backed
- **WebSocket**: Soketi
- **Auth**: Laravel Sanctum
- **Payments**: Stripe + Laravel Cashier
- **AI**: OpenAI GPT-4 + DALL-E 3
- **Admin**: Orchid Platform 14.43.1

## 📊 Statistics

- **API Endpoints**: 350+
- **Eloquent Models**: 46+
- **Services**: 21+
- **Controllers**: 30+
- **Migrations**: 100+
- **Middleware**: Custom auth & validation layers

## 🛠️ Installation

### Prerequisites

- PHP 8.2+
- Composer
- PostgreSQL 15
- Redis 7

### Setup

```bash
# Clone repository
cd apps/backend

# Install dependencies
composer install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database
php artisan migrate
php artisan db:seed

# Start server
php artisan serve
```

## 🔧 Development

```bash
# Run tests
composer test

# Code formatting
./vendor/bin/pint

# Static analysis
./vendor/bin/phpstan

# Queue worker
php artisan queue:work

# WebSocket server
npm run soketi
```

## 📚 Documentation

- [API Documentation](../../docs/api/API_REFERENCE.md)
- [Architecture](../../docs/BACKEND_ANALYSIS.md)
- See `/public/swagger` for interactive API docs

## 📞 Support

For issues and questions, please open an issue in the main repository.
