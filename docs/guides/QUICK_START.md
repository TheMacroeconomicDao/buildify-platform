# 🚀 Quick Start Guide

Get Buildify Platform up and running in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker & Docker Compose** (Recommended)
  - Docker Desktop 4.0+
  - OR Docker Engine 20.10+ with Compose plugin

- **OR Manual Setup:**
  - Node.js 18+
  - PHP 8.2+
  - Composer 2+
  - PostgreSQL 15
  - Redis 7

## 🎯 Option 1: Docker Setup (Recommended)

### Step 1: Clone Repository

```bash
git clone https://github.com/TheMacroeconomicDao/buildify-platform.git
cd buildify-platform
```

### Step 2: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env file and set your values
# At minimum, configure:
# - Database credentials
# - Stripe keys
# - OpenAI API key
# - Firebase/FCM keys
```

### Step 3: Start Services

```bash
# Using Makefile (recommended)
make up

# OR using docker-compose directly
docker-compose up -d
```

### Step 4: Run Migrations

```bash
make backend-migrate

# OR
docker-compose exec backend php artisan migrate
```

### Step 5: Seed Database (Optional)

```bash
make backend-seed

# OR
docker-compose exec backend php artisan db:seed
```

### Step 6: Access Application

- **Backend API**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Documentation**: http://localhost:3000/api/documentation
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6380
- **WebSocket**: localhost:6001
- **pgAdmin**: http://localhost:5050
- **Redis Commander**: http://localhost:8081

### Step 7: Create Admin User

```bash
docker-compose exec backend php artisan tinker

# In tinker console:
$user = new App\Models\User();
$user->name = 'Admin';
$user->email = 'admin@buildify.local';
$user->password = bcrypt('password');
$user->type = 99; // Admin
$user->save();
```

## 🎯 Option 2: Manual Setup

### Backend Setup

```bash
# Navigate to backend
cd apps/backend

# Install dependencies
composer install

# Environment
cp .env.example .env
php artisan key:generate

# Configure .env file with your database credentials

# Migrate database
php artisan migrate

# Seed database (optional)
php artisan db:seed

# Start server
php artisan serve
```

### Mobile Setup

```bash
# Navigate to mobile
cd apps/mobile

# Install dependencies
npm install

# iOS specific
cd ios && pod install && cd ..

# Configure environment
cp env.local .env

# Start Metro bundler
npm start

# In another terminal, run:
# For iOS:
npm run ios

# For Android:
npm run android
```

## 📱 Mobile App Configuration

Edit `apps/mobile/.env`:

```env
API_URL=http://localhost:3000/api
WS_HOST=localhost
WS_PORT=6001
WS_KEY=buildify-key
```

For physical devices, replace `localhost` with your computer's IP address:

```env
API_URL=http://192.168.1.100:3000/api
WS_HOST=192.168.1.100
```

## 🔧 Common Tasks

### Backend

```bash
# Run migrations
make backend-migrate

# Clear caches
make backend-clear

# Run tests
make backend-test

# Access Laravel Tinker
docker-compose exec backend php artisan tinker

# View logs
make logs-backend
```

### Mobile

```bash
# Start on iOS
make mobile-ios

# Start on Android
make mobile-android

# Run tests
make mobile-test

# Build for production
make mobile-build-android
make mobile-build-ios
```

### Database

```bash
# Backup database
make db-backup

# Restore database
make db-restore FILE=backups/backup_20251002.sql

# Access PostgreSQL shell
make db-shell
```

## 🐛 Troubleshooting

### Backend not starting

```bash
# Check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

### Database connection failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify credentials in .env file
```

### Mobile app can't connect to API

```bash
# For iOS simulator/Android emulator:
# Use http://localhost:3000/api

# For physical device:
# Use http://<YOUR_COMPUTER_IP>:3000/api

# Check backend is accessible:
curl http://localhost:3000/health
```

### Port already in use

```bash
# Check what's using the port
lsof -i :3000

# Change port in docker-compose.yml
ports:
  - "3001:80"  # Use 3001 instead of 3000
```

## 📚 Next Steps

1. **Read Documentation**
   - [Technical Overview](../TECHNICAL_OVERVIEW.md)
   - [Architecture Analysis](../ARCHITECTURE_ANALYSIS.md)

2. **Explore API**
   - Open http://localhost:3000/api/documentation
   - Test endpoints with Postman/Insomnia

3. **Configure External Services**
   - Set up Stripe account
   - Get OpenAI API key
   - Configure Firebase project

4. **Start Development**
   - Read [Contributing Guide](../../CONTRIBUTING.md)
   - Check [Best Practices](../best-practices/)

## 🆘 Getting Help

- **Documentation**: Check the [docs/](../) folder
- **Issues**: [GitHub Issues](https://github.com/TheMacroeconomicDao/buildify-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TheMacroeconomicDao/buildify-platform/discussions)

## ✅ Verification

To verify everything is working:

```bash
# Check all services are running
make status

# Check backend health
curl http://localhost:3000/health

# Check database
make db-shell
# In psql: \dt

# Check Redis
docker-compose exec redis redis-cli ping
# Should return: PONG
```

---

**You're all set! Happy coding! 🎉**
