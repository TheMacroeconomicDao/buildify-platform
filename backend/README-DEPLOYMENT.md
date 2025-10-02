# Buildlify Backend - Полное руководство по развертыванию

Это подробное руководство поможет вам развернуть Laravel бэкенд Buildlify на пустом облачном сервере Ubuntu 22.04 с нуля.

## 📋 Системные требования

### Минимальные требования к серверу:
- **ОС**: Ubuntu 22.04 LTS (рекомендуется)
- **RAM**: минимум 2GB (рекомендуется 4GB+)
- **Диск**: минимум 20GB SSD (рекомендуется 40GB+)
- **CPU**: минимум 1 vCPU (рекомендуется 2+ vCPU)
- **Интернет**: стабильное подключение

### Предварительные требования:
- **Домен**: Зарегистрированный домен с возможностью управления DNS
- **Доступ**: SSH доступ с правами root или sudo
- **API ключи**: 
  - OpenAI API Key (для генерации дизайнов)
  - Stripe Keys (для обработки платежей)
  - Pusher Account (для WebSocket соединений)

## 🌟 Подготовка с нуля

### 1. Получение и настройка сервера

#### Создание сервера (VPS/Cloud):

**DigitalOcean:**
```bash
# Создание Droplet через doctl CLI
doctl compute droplet create buildlify-server \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region fra1 \
  --ssh-keys your-ssh-key-id
```

**AWS EC2:**
```bash
# Создание EC2 инстанса
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-your-security-group
```

**Другие провайдеры:**
- Выберите Ubuntu 22.04 LTS
- Минимум 2GB RAM, 2 vCPU
- Настройте SSH ключи

### 2. Первоначальная настройка сервера

#### Подключение к серверу:
```bash
# Замените YOUR_SERVER_IP на реальный IP адрес
ssh root@YOUR_SERVER_IP
```

#### Создание пользователя (опционально):
```bash
# Создание пользователя для приложения
adduser buildlify
usermod -aG sudo buildlify

# Настройка SSH для нового пользователя
mkdir -p /home/buildlify/.ssh
cp ~/.ssh/authorized_keys /home/buildlify/.ssh/
chown -R buildlify:buildlify /home/buildlify/.ssh
chmod 700 /home/buildlify/.ssh
chmod 600 /home/buildlify/.ssh/authorized_keys

# Переключение на нового пользователя
su - buildlify
```

### 3. Настройка DNS записей

Настройте DNS записи у вашего регистратора домена:

```
# A записи (замените YOUR_SERVER_IP на реальный IP)
your-domain.com.        A    YOUR_SERVER_IP
www.your-domain.com.    A    YOUR_SERVER_IP

# Опционально: CNAME для поддоменов
api.your-domain.com.    CNAME your-domain.com.
```

#### Проверка DNS:
```bash
# Проверка разрешения домена
dig your-domain.com
nslookup your-domain.com

# Проверка доступности
ping your-domain.com
```

### 4. Получение API ключей

#### OpenAI API Key:
1. Зарегистрируйтесь на [OpenAI Platform](https://platform.openai.com/)
2. Перейдите в раздел [API Keys](https://platform.openai.com/api-keys)
3. Нажмите "Create new secret key"
4. Скопируйте ключ (начинается с `sk-`)
5. Пополните баланс для использования API

#### Stripe Keys:
1. Зарегистрируйтесь на [Stripe](https://stripe.com/)
2. Перейдите в [Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
3. Скопируйте:
   - Publishable key (начинается с `pk_`)
   - Secret key (начинается с `sk_`)
4. Настройте Webhook endpoints для обработки событий

#### Pusher Account:
1. Зарегистрируйтесь на [Pusher](https://pusher.com/)
2. Создайте новое приложение
3. Скопируйте:
   - App ID
   - App Key  
   - App Secret
   - Cluster

### 5. Подготовка кода приложения

#### Клонирование репозитория:
```bash
# Установка Git (если не установлен)
sudo apt update
sudo apt install -y git

# Клонирование репозитория
git clone https://github.com/your-username/buildlify.git
cd buildlify/backend

# Или загрузка через SCP/SFTP
scp -r ./buildlify root@YOUR_SERVER_IP:/root/
```

#### Подготовка файлов:
```bash
# Убедитесь, что все скрипты исполняемые
chmod +x deploy.sh ssl-setup.sh backup-script.sh

# Проверка структуры файлов
ls -la
# Должны быть: deploy.sh, env.production.template, nginx.production.conf, и др.
```

## 🚀 Автоматическое развертывание

После выполнения всех подготовительных шагов выше, можно запустить автоматическое развертывание:

### Шаг 1: Запуск основного скрипта развертывания

```bash
# Убедитесь, что вы находитесь в директории с кодом
cd buildlify/backend

# Запуск автоматического развертывания
sudo DOMAIN=your-domain.com ./deploy.sh
```

**Что происходит во время развертывания:**
- ✅ Обновление системы Ubuntu
- ✅ Установка PHP 8.2 и всех необходимых расширений
- ✅ Установка и настройка PostgreSQL
- ✅ Установка и настройка Redis
- ✅ Установка и настройка Nginx
- ✅ Установка Composer и Node.js
- ✅ Настройка Laravel приложения
- ✅ Создание базы данных и пользователя
- ✅ Запуск миграций
- ✅ Настройка systemd сервисов
- ✅ Настройка безопасности и firewall
- ✅ Настройка мониторинга и логирования

### Шаг 2: Настройка переменных окружения

```bash
# Редактирование .env файла с вашими API ключами
sudo nano /var/www/buildlify/.env
```

**Обязательно настройте следующие параметры:**
```env
APP_URL=https://your-domain.com
DB_PASSWORD=your_secure_database_password
OPENAI_API_KEY=sk-your-openai-key
STRIPE_KEY=pk_live_your-stripe-key
STRIPE_SECRET=sk_live_your-stripe-secret
PUSHER_APP_ID=your-pusher-app-id
PUSHER_APP_KEY=your-pusher-key
PUSHER_APP_SECRET=your-pusher-secret
```

### Шаг 3: Настройка SSL сертификата

```bash
# Настройка SSL сертификата Let's Encrypt
sudo ./ssl-setup.sh your-domain.com admin@your-domain.com
```

### Шаг 4: Финальная проверка

```bash
# Перезапуск всех сервисов после настройки
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
sudo systemctl restart buildlify-queue

# Проверка статуса всех сервисов
sudo systemctl status nginx php8.2-fpm postgresql redis-server buildlify-queue

# Очистка и пересоздание кэша Laravel
cd /var/www/buildlify
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
```

### Шаг 5: Проверка работоспособности

```bash
# Проверка доступности сайта
curl -I https://your-domain.com

# Проверка API
curl https://your-domain.com/api/health

# Проверка логов на наличие ошибок
tail -f /var/www/buildlify/storage/logs/laravel.log
```

## 🎯 Пошаговая настройка для начинающих

### Полный процесс развертывания от А до Я:

#### 1️⃣ Подготовка локальной машины

```bash
# На вашем локальном компьютере
# Убедитесь, что у вас есть SSH ключи
ls ~/.ssh/
# Если нет ключей, создайте их:
ssh-keygen -t ed25519 -C "your-email@example.com"

# Добавьте публичный ключ на сервер при создании
cat ~/.ssh/id_ed25519.pub
```

#### 2️⃣ Создание и подключение к серверу

```bash
# Подключение к серверу (замените IP)
ssh root@YOUR_SERVER_IP

# Первое, что нужно сделать - обновить систему
apt update && apt upgrade -y

# Установить основные инструменты
apt install -y curl wget git nano htop
```

#### 3️⃣ Загрузка кода приложения

```bash
# Вариант 1: Клонирование из Git
git clone https://github.com/your-username/buildlify.git
cd buildlify/backend

# Вариант 2: Загрузка через SCP с локальной машины
# (выполнить на локальной машине)
scp -r ./buildlify root@YOUR_SERVER_IP:/root/
```

#### 4️⃣ Запуск автоматического развертывания

```bash
# Перейти в директорию с бэкендом
cd buildlify/backend  # или cd /root/buildlify/backend

# Сделать скрипты исполняемыми
chmod +x *.sh

# Запустить развертывание (ЗАМЕНИТЕ your-domain.com на ваш домен)
DOMAIN=your-domain.com ./deploy.sh

# Процесс займет 10-15 минут
# Следите за выводом, при ошибках скрипт остановится
```

#### 5️⃣ Настройка конфигурации

```bash
# После успешного развертывания отредактируйте .env
nano /var/www/buildlify/.env

# Обязательно измените следующие строки:
# APP_URL=https://your-domain.com
# DB_PASSWORD=сгенерированный_пароль_из_скрипта
# OPENAI_API_KEY=ваш_ключ_openai
# STRIPE_KEY=ваш_публичный_ключ_stripe
# STRIPE_SECRET=ваш_секретный_ключ_stripe
# PUSHER_APP_ID=ваш_app_id_pusher
# PUSHER_APP_KEY=ваш_ключ_pusher
# PUSHER_APP_SECRET=ваш_секрет_pusher
```

#### 6️⃣ Настройка SSL

```bash
# Убедитесь, что DNS настроен и домен указывает на сервер
dig your-domain.com  # должен показать IP вашего сервера

# Запустите настройку SSL
./ssl-setup.sh your-domain.com admin@your-domain.com

# Это настроит автоматические сертификаты Let's Encrypt
```

#### 7️⃣ Финальная проверка

```bash
# Проверка всех сервисов
systemctl status nginx
systemctl status php8.2-fpm
systemctl status postgresql
systemctl status redis-server
systemctl status buildlify-queue

# Если какой-то сервис не запущен:
systemctl start service-name
systemctl enable service-name

# Проверка сайта
curl -I https://your-domain.com
# Должен вернуть HTTP/2 200

# Проверка логов
tail -f /var/www/buildlify/storage/logs/laravel.log
```

#### 8️⃣ Создание первого администратора

```bash
# Перейти в директорию приложения
cd /var/www/buildlify

# Создать администратора через Artisan команду
sudo -u www-data php artisan make:admin-user
# Или если такой команды нет, создайте через tinker:
sudo -u www-data php artisan tinker

# В tinker выполните:
# $user = new App\Models\User();
# $user->name = 'Admin';
# $user->email = 'admin@your-domain.com';
# $user->password = Hash::make('secure-password');
# $user->type = 'admin'; // или как определено в вашей модели
# $user->save();
```

## 🔧 Альтернативная ручная настройка

Если автоматический скрипт не подходит или нужна более детальная настройка:

### 1. Установка зависимостей

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка базовых пакетов
apt install -y curl wget git unzip software-properties-common

# Установка PHP 8.2
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-pgsql php8.2-redis php8.2-gd php8.2-curl php8.2-mbstring php8.2-xml php8.2-zip php8.2-bcmath

# Установка Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# Установка PostgreSQL
apt install -y postgresql postgresql-contrib

# Установка Redis
apt install -y redis-server

# Установка Nginx
apt install -y nginx
```

### 2. Настройка базы данных

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE buildlify_production;
CREATE USER buildlify_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE buildlify_production TO buildlify_user;
ALTER USER buildlify_user CREATEDB;
\q
```

### 3. Настройка приложения

```bash
# Создание директории приложения
mkdir -p /var/www/buildlify
cp -r . /var/www/buildlify/
cd /var/www/buildlify

# Установка зависимостей
composer install --optimize-autoloader --no-dev

# Создание .env файла
cp env.production.template .env
nano .env  # Отредактируйте настройки

# Генерация ключа приложения
php artisan key:generate

# Создание символической ссылки
php artisan storage:link

# Настройка прав доступа
chown -R www-data:www-data /var/www/buildlify
chmod -R 755 /var/www/buildlify
chmod -R 775 /var/www/buildlify/storage
chmod -R 775 /var/www/buildlify/bootstrap/cache

# Запуск миграций
php artisan migrate --force
```

### 4. Настройка Nginx

```bash
# Копирование конфигурации
cp nginx.production.conf /etc/nginx/sites-available/buildlify

# Редактирование конфигурации (замените your-domain.com)
nano /etc/nginx/sites-available/buildlify

# Активация сайта
ln -s /etc/nginx/sites-available/buildlify /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Тестирование и перезагрузка
nginx -t
systemctl reload nginx
```

### 5. Настройка systemd сервисов

```bash
# Копирование сервисов
cp systemd-services/buildlify-queue.service /etc/systemd/system/
cp systemd-services/buildlify-websocket.service /etc/systemd/system/

# Активация сервисов
systemctl daemon-reload
systemctl enable buildlify-queue
systemctl start buildlify-queue

# Настройка cron для Laravel Scheduler
echo "* * * * * www-data cd /var/www/buildlify && php artisan schedule:run >> /dev/null 2>&1" > /etc/cron.d/buildlify-scheduler
```

## ⚙️ Настройка переменных окружения

Отредактируйте файл `/var/www/buildlify/.env`:

```env
# Основные настройки
APP_NAME=Buildlify
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# База данных
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=buildlify_production
DB_USERNAME=buildlify_user
DB_PASSWORD=your_secure_password

# OpenAI (ОБЯЗАТЕЛЬНО)
OPENAI_API_KEY=sk-your-openai-key

# Stripe (ОБЯЗАТЕЛЬНО)
STRIPE_KEY=pk_live_your-stripe-key
STRIPE_SECRET=sk_live_your-stripe-secret

# Pusher (ОБЯЗАТЕЛЬНО)
PUSHER_APP_ID=your-pusher-app-id
PUSHER_APP_KEY=your-pusher-key
PUSHER_APP_SECRET=your-pusher-secret
```

## 🔒 Безопасность

### Настройка firewall

```bash
ufw enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
```

### Настройка fail2ban

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Логи приложения
tail -f /var/www/buildlify/storage/logs/laravel.log

# Логи Nginx
tail -f /var/log/nginx/buildlify-error.log
tail -f /var/log/nginx/buildlify-access.log

# Логи очередей
journalctl -u buildlify-queue -f

# Системные логи
journalctl -f
```

### Проверка статуса сервисов

```bash
systemctl status nginx
systemctl status php8.2-fpm
systemctl status postgresql
systemctl status redis-server
systemctl status buildlify-queue
```

## 🔄 Резервное копирование

### Автоматическое резервное копирование

```bash
# Настройка скрипта резервного копирования
cp backup-script.sh /opt/backups/
chmod +x /opt/backups/backup-script.sh

# Добавление в cron (ежедневно в 2:00)
echo "0 2 * * * /opt/backups/backup-script.sh >> /var/log/backup.log 2>&1" | crontab -
```

### Ручное резервное копирование

```bash
# Резервная копия БД
sudo -u postgres pg_dump buildlify_production > backup_$(date +%Y%m%d).sql

# Резервная копия файлов
tar -czf app_backup_$(date +%Y%m%d).tar.gz -C /var/www buildlify
```

## 🚀 Обновление приложения

```bash
cd /var/www/buildlify

# Резервная копия
sudo /opt/backups/backup-script.sh

# Получение обновлений
git pull origin main

# Обновление зависимостей
composer install --optimize-autoloader --no-dev

# Запуск миграций
php artisan migrate --force

# Очистка кэша
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Перезапуск сервисов
systemctl restart buildlify-queue
systemctl restart php8.2-fpm
```

## 🔧 Устранение неполадок

### Проблемы с правами доступа

```bash
chown -R www-data:www-data /var/www/buildlify
chmod -R 755 /var/www/buildlify
chmod -R 775 /var/www/buildlify/storage
chmod -R 775 /var/www/buildlify/bootstrap/cache
```

### Проблемы с очередями

```bash
# Перезапуск worker'а очередей
systemctl restart buildlify-queue

# Проверка статуса
systemctl status buildlify-queue

# Просмотр логов
journalctl -u buildlify-queue -n 50
```

### Проблемы с базой данных

```bash
# Проверка подключения
sudo -u postgres psql buildlify_production

# Проверка статуса PostgreSQL
systemctl status postgresql

# Просмотр логов PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log
```

## 🚨 Частые проблемы и их решения

### Проблема: "Permission denied" при запуске скрипта
```bash
# Решение: Сделать скрипт исполняемым
chmod +x deploy.sh
sudo ./deploy.sh
```

### Проблема: "Domain doesn't resolve" при настройке SSL
```bash
# Проверить DNS настройки
dig your-domain.com
nslookup your-domain.com

# Подождать распространения DNS (до 24 часов)
# Или использовать временный SSL для localhost
```

### Проблема: Ошибки базы данных при миграции
```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Проверить подключение к БД
sudo -u postgres psql buildlify_production

# Пересоздать базу данных если нужно
sudo -u postgres psql -c "DROP DATABASE buildlify_production;"
sudo -u postgres psql -c "CREATE DATABASE buildlify_production;"
```

### Проблема: 500 ошибка на сайте
```bash
# Проверить логи
tail -f /var/www/buildlify/storage/logs/laravel.log
tail -f /var/log/nginx/buildlify-error.log

# Проверить права доступа
sudo chown -R www-data:www-data /var/www/buildlify
sudo chmod -R 775 /var/www/buildlify/storage
sudo chmod -R 775 /var/www/buildlify/bootstrap/cache

# Очистить кэш
cd /var/www/buildlify
sudo -u www-data php artisan cache:clear
sudo -u www-data php artisan config:clear
```

### Проблема: Очереди не работают
```bash
# Проверить статус worker'а
sudo systemctl status buildlify-queue

# Перезапустить worker
sudo systemctl restart buildlify-queue

# Проверить логи worker'а
sudo journalctl -u buildlify-queue -f

# Запустить worker вручную для отладки
cd /var/www/buildlify
sudo -u www-data php artisan queue:work --verbose
```

### Проблема: Медленная работа сайта
```bash
# Включить OPcache для PHP
sudo nano /etc/php/8.2/fpm/php.ini
# Найти и раскомментировать:
# opcache.enable=1
# opcache.memory_consumption=128
# opcache.max_accelerated_files=4000

# Перезапустить PHP-FPM
sudo systemctl restart php8.2-fpm

# Оптимизировать Laravel
cd /var/www/buildlify
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
```

## 📞 Поддержка и дополнительная помощь

### Если у вас возникли проблемы:

1. **Проверьте логи системы и приложения:**
   ```bash
   # Логи Laravel
   tail -f /var/www/buildlify/storage/logs/laravel.log
   
   # Логи Nginx
   tail -f /var/log/nginx/buildlify-error.log
   
   # Системные логи
   journalctl -f
   ```

2. **Убедитесь, что все сервисы запущены:**
   ```bash
   sudo systemctl status nginx php8.2-fpm postgresql redis-server buildlify-queue
   ```

3. **Проверьте конфигурацию .env файла:**
   ```bash
   cd /var/www/buildlify
   php artisan config:show
   ```

4. **Проверьте API ключи и их валидность:**
   - OpenAI: Попробуйте сделать тестовый запрос к API
   - Stripe: Проверьте в dashboard Stripe
   - Pusher: Проверьте в dashboard Pusher

### Полезные команды для диагностики:

```bash
# Проверка дискового пространства
df -h

# Проверка использования памяти
free -h

# Проверка процессов
top
htop

# Проверка сетевых подключений
netstat -tulpn

# Проверка открытых портов
ss -tulpn

# Тест скорости интернета
curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -
```

## 📝 Полезные команды

```bash
# Проверка версий
php --version
composer --version
nginx -v
psql --version

# Очистка кэша Laravel
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Проверка конфигурации
php artisan config:show
nginx -t

# Мониторинг ресурсов
htop
df -h
free -h
```
