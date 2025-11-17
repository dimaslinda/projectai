# Multi-stage Dockerfile untuk Laravel + Vite (PHP-FPM + Nginx)

# Stage 1: Build frontend assets dengan Vite
FROM node:20-alpine AS frontend
WORKDIR /app

# Install dependensi Node
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Salin source yang diperlukan untuk build
COPY vite.config.ts tsconfig.json ./
COPY resources ./resources
COPY public ./public

# Build Vite (output ke public/build)
RUN npm run build


# Stage 2: Install vendor PHP tanpa menjalankan composer scripts
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-progress \
    --no-interaction \
    --no-scripts


# Stage 3: Image final dengan PHP-FPM + Nginx
FROM php:8.3-fpm-alpine

# Instal paket yang dibutuhkan
RUN apk add --no-cache \
        nginx \
        supervisor \
        curl \
        bash \
        icu-dev \
        oniguruma-dev \
        libzip-dev \
        freetype-dev \
        libjpeg-turbo-dev \
        libpng-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        bcmath \
        gd \
        zip \
    && rm -rf /var/cache/apk/*

WORKDIR /var/www/html

# Salin vendor hasil stage composer
COPY --from=vendor /app/vendor ./vendor

# Salin source code aplikasi
COPY . .

# Salin hasil build frontend
COPY --from=frontend /app/public/build ./public/build

# Konfigurasi Nginx & Supervisord
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

# Siapkan direktori runtime & permission untuk Laravel
RUN mkdir -p /run/nginx /var/log/supervisor \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Port HTTP Nginx
EXPOSE 8080

# Jalankan Nginx + PHP-FPM via supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]