FROM php:8.2-fpm

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    zip \
    unzip \
    git \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Установка PHP расширений
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

WORKDIR /usr/share/nginx/html/stretchon-backend

COPY . .

RUN mv service/site.conf /etc/nginx/sites-available/default && \
    mv service/entrypoint.sh /etc && \
    mv service/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN rm /etc/nginx/sites-enabled/default

RUN mv .env.example .env

RUN curl -s https://getcomposer.org/installer | php

RUN mv composer.phar /usr/local/bin/composer

RUN php -d memory_limit=-1 /usr/local/bin/composer install

RUN php artisan storage:link

RUN chmod 777 /etc/entrypoint.sh

RUN chown -R daemon:daemon /usr/share/nginx/html/stretchon-backend

RUN chmod 777 /usr/share/nginx/html/stretchon-backend/storage
#USER www-data

#RUN chmod -R 747 /usr/share/nginx/html/stretchon-backend/*

ENTRYPOINT ["/etc/entrypoint.sh"]
