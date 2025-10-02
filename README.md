# 🏗️ Buildify Platform

**Enterprise-grade marketplace for construction and repair services**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/Backend-Laravel%2011-red)](apps/backend)
[![Mobile](https://img.shields.io/badge/Mobile-React%20Native%200.75.3-blue)](apps/mobile)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-blue)]()
[![Cache](https://img.shields.io/badge/Cache-Redis%207-red)]()

## 📋 Overview

**Buildify** is a comprehensive marketplace platform connecting customers with construction and repair service providers. The platform supports multiple user types (Customers, Executors, Mediators) with real-time communication, AI-powered design generation, and integrated payment processing.

### Key Features

- 🔐 **Multi-role System**: Support for Customers, Executors, Mediators, and Admins
- 💳 **Payment Integration**: Stripe-powered subscriptions and wallet system
- 🤖 **AI Integration**: OpenAI GPT-4 for interior design generation
- 📱 **Real-time Communication**: WebSocket-based notifications
- 🌐 **Multi-language Support**: 7 languages including English, Russian, Arabic
- 💰 **Referral System**: Automated cashback rewards
- 📊 **Admin Panel**: Comprehensive management via Orchid Platform

## 🏛️ Architecture

This is a **monorepo** containing:

```
buildify-platform/
├── apps/
│   ├── backend/          # Laravel 11 API
│   └── mobile/           # React Native app
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── .github/             # CI/CD workflows
```

### Technology Stack

**Backend:**
- Laravel 11 (PHP 8.2+)
- PostgreSQL 15
- Redis 7
- Soketi (WebSocket)
- Orchid Platform (Admin)
- Stripe + Laravel Cashier
- OpenAI GPT-4

**Mobile:**
- React Native 0.75.3
- Redux + Redux Persist
- React Navigation 6
- Pusher.js + Laravel Echo
- Firebase Cloud Messaging
- Stripe Checkout

**Infrastructure:**
- Docker Compose
- Nginx
- Supervisor
- Let's Encrypt SSL

## 📊 Project Metrics

- **API Endpoints**: 350+
- **Mobile Screens**: 47+
- **Database Migrations**: 100+
- **Custom Components**: 60+
- **User Types**: 4 (Customer, Executor, Mediator, Admin)
- **Languages Supported**: 7

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- PHP 8.2+
- Composer

### Backend Setup

```bash
cd apps/backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

### Mobile Setup

```bash
cd apps/mobile
npm install
cp env.local .env
npm start

# iOS
npm run ios

# Android
npm run android
```

### Docker Setup

```bash
docker-compose up -d
```

## 📚 Documentation

- [Technical Overview](docs/TECHNICAL_OVERVIEW.md)
- [Architecture Analysis](docs/ARCHITECTURE_ANALYSIS.md)
- [Backend Analysis](docs/BACKEND_ANALYSIS.md)
- [Mobile Analysis](docs/MOBILE_ANALYSIS.md)
- [API Documentation](apps/backend/public/swagger)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🏗️ Project Structure

### Backend Structure

```
apps/backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # API Controllers (30+)
│   │   ├── Middleware/       # Custom middleware
│   │   └── Requests/         # Form validation
│   ├── Models/               # Eloquent models (46+)
│   ├── Services/             # Business logic (21+)
│   ├── Enums/                # PHP 8.2 enums
│   └── Observers/            # Model observers
├── database/
│   └── migrations/           # Database schema (100+)
├── routes/
│   └── api.php              # API routes
└── tests/                   # PHPUnit tests
```

### Mobile Structure

```
apps/mobile/
├── src/
│   ├── screens/             # App screens (47+)
│   ├── components/          # Reusable components (60+)
│   ├── redux/               # State management
│   ├── api/                 # API client
│   ├── navigation/          # Navigation setup
│   └── i18n/               # Translations (7 languages)
├── android/                 # Android native code
└── ios/                     # iOS native code
```

## 🔑 Key Features

### Order Management
- Create and publish orders
- Browse available orders
- Submit and manage responses
- Track order progress
- Mutual completion system
- Review and rating system

### Subscription System
- Free, Basic, Pro, Enterprise tiers
- Stripe-powered recurring billing
- Usage limits (orders, contacts)
- Automatic expiration handling

### Wallet System
- AED currency support
- Stripe integration
- Transaction history
- Escrow for orders

### Referral System
- Automatic referral code generation
- 10% cashback on wallet deposits
- Referral balance tracking
- Use balance for subscriptions

### AI Design Generation
- OpenAI GPT-4 integration
- DALL-E 3 for images
- Async job processing
- Design variations

### Real-time Features
- WebSocket notifications
- Push notifications (FCM)
- In-app notifications
- Live order updates

## 👥 User Types

### 1. Customer (Type: 1)
- Create orders
- Receive executor responses
- Choose executor
- Pay and review

### 2. Executor (Type: 0)
- Browse orders
- Submit responses
- Portfolio management
- Get verified

### 3. Mediator (Type: 2)
- Manage deals
- 3-step workflow
- Commission system
- Quality control

### 4. Admin (Type: 99)
- User management
- Verification system
- Complaint moderation
- Analytics dashboard

## 🔐 Security

- ✅ Laravel Sanctum authentication
- ✅ SQL injection protection (Eloquent ORM)
- ✅ XSS protection
- ✅ HTTPS enforcement
- ✅ Password hashing (bcrypt)
- ✅ CSRF protection
- ⚠️ Rate limiting (recommended)
- ⚠️ 2FA (planned)

## 📈 Performance

**Backend:**
- API Response Time: ~200-400ms avg
- Database: Indexed queries
- Caching: Redis
- Queue: Background jobs

**Mobile:**
- Bundle Size: 50-80 MB
- Startup Time: <3s
- State Management: Redux

## 🧪 Testing

**Backend:**
```bash
cd apps/backend
composer test
```

**Mobile:**
```bash
cd apps/mobile
npm test
```

## 📊 Monitoring & Logging

**Recommended Tools:**
- Sentry (Error tracking)
- Firebase Crashlytics (Mobile)
- Laravel Telescope (Development)
- New Relic / Datadog (APM)

## 🚢 Deployment

### Production

```bash
# Backend
cd apps/backend
./deploy.sh

# Mobile
cd apps/mobile
npm run build-ios    # iOS
npm run build        # Android
```

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Branch Naming Convention

```
feature/TASK-123-description
bugfix/TASK-456-description
hotfix/critical-issue
```

### Commit Message Convention

```
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
refactor(scope): refactor code
test(scope): add tests
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Organization**: [TheMacroeconomicDao](https://github.com/TheMacroeconomicDao)
- **Repository**: [buildify-platform](https://github.com/TheMacroeconomicDao/buildify-platform)

## 🙏 Acknowledgments

- Laravel Community
- React Native Community
- Stripe
- OpenAI
- Firebase
- Orchid Platform

---

**Built with ❤️ by TheMacroeconomicDao Team**
