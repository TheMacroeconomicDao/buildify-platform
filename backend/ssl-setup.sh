#!/bin/bash

# =============================================================================
# SSL Certificate Setup Script for Buildlify
# Скрипт для настройки SSL сертификатов с помощью Let's Encrypt
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DOMAIN="${1:-}"
EMAIL="${2:-admin@${DOMAIN}}"
WEBROOT="/var/www/buildlify/public"

# Check if domain is provided
if [ -z "$DOMAIN" ]; then
    log_error "Использование: $0 <domain> [email]"
    log_error "Пример: $0 example.com admin@example.com"
    exit 1
fi

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "Этот скрипт должен быть запущен с правами root (sudo)"
    exit 1
fi

# Install Certbot
install_certbot() {
    log_info "Установка Certbot..."
    
    apt update
    apt install -y certbot python3-certbot-nginx
    
    log_success "Certbot установлен"
}

# Validate domain DNS
validate_domain() {
    log_info "Проверка DNS настроек для домена $DOMAIN..."
    
    # Check if domain resolves to this server's IP
    local server_ip=$(curl -s ifconfig.me)
    local domain_ip=$(dig +short $DOMAIN | head -n1)
    
    if [ "$server_ip" = "$domain_ip" ]; then
        log_success "DNS настройки корректны"
    else
        log_warning "Внимание: DNS может быть настроен неправильно"
        log_warning "IP сервера: $server_ip"
        log_warning "IP домена: $domain_ip"
        
        read -p "Продолжить настройку SSL? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Настройка SSL отменена"
            exit 0
        fi
    fi
}

# Setup temporary Nginx configuration for domain validation
setup_temp_nginx() {
    log_info "Настройка временной конфигурации Nginx..."
    
    # Create temporary config for domain validation
    cat > /etc/nginx/sites-available/temp-${DOMAIN} << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    root ${WEBROOT};
    index index.php index.html;
    
    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
        try_files \$uri =404;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    
    # Enable temporary config
    ln -sf /etc/nginx/sites-available/temp-${DOMAIN} /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    
    log_success "Временная конфигурация Nginx настроена"
}

# Obtain SSL certificate
obtain_certificate() {
    log_info "Получение SSL сертификата от Let's Encrypt..."
    
    # Try to obtain certificate
    if certbot certonly \
        --webroot \
        --webroot-path=${WEBROOT} \
        --email ${EMAIL} \
        --agree-tos \
        --no-eff-email \
        --domains ${DOMAIN} \
        --domains www.${DOMAIN} \
        --non-interactive; then
        
        log_success "SSL сертификат успешно получен"
    else
        log_error "Ошибка получения SSL сертификата"
        return 1
    fi
}

# Setup production Nginx configuration with SSL
setup_production_nginx() {
    log_info "Настройка продакшн конфигурации Nginx с SSL..."
    
    # Remove temporary config
    rm -f /etc/nginx/sites-enabled/temp-${DOMAIN}
    
    # Create production config with SSL
    cat > /etc/nginx/sites-available/buildlify << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    root ${WEBROOT};
    index index.php index.html index.htm;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # File Upload Limits
    client_max_body_size 350M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Main Location Block
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    # Favicon and Robots
    location = /favicon.ico { 
        access_log off; 
        log_not_found off; 
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location = /robots.txt  { 
        access_log off; 
        log_not_found off; 
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Static Assets Caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # PHP Processing
    location ~ \.php$ {
        try_files \$uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        
        # PHP Configuration
        fastcgi_param PHP_VALUE "post_max_size=350M
                                upload_max_filesize=350M
                                max_execution_time=300
                                memory_limit=512M";
        
        # Timeouts
        fastcgi_connect_timeout 60s;
        fastcgi_send_timeout 300s;
        fastcgi_read_timeout 300s;
        
        # Buffer Settings
        fastcgi_buffer_size 128k;
        fastcgi_buffers 256 16k;
        fastcgi_busy_buffers_size 256k;
        fastcgi_temp_file_write_size 256k;
    }
    
    # Hide Sensitive Files
    location ~ /\.(env|git|svn|htaccess|htpasswd) {
        deny all;
        return 404;
    }
    
    location ~ /(composer\.(json|lock)|package\.(json|lock)|yarn\.lock)$ {
        deny all;
        return 404;
    }
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
        try_files \$uri =404;
    }
    
    # Error Pages
    error_page 404 /index.php;
    error_page 500 502 503 504 /50x.html;
    
    # Logging
    access_log /var/log/nginx/buildlify-access.log;
    error_log /var/log/nginx/buildlify-error.log;
}
EOF
    
    # Enable production config
    ln -sf /etc/nginx/sites-available/buildlify /etc/nginx/sites-enabled/
    
    # Test and reload Nginx
    if nginx -t; then
        systemctl reload nginx
        log_success "Продакшн конфигурация Nginx с SSL настроена"
    else
        log_error "Ошибка в конфигурации Nginx"
        return 1
    fi
}

# Setup automatic certificate renewal
setup_auto_renewal() {
    log_info "Настройка автоматического обновления сертификата..."
    
    # Create renewal script
    cat > /opt/ssl-renewal-${DOMAIN}.sh << EOF
#!/bin/bash
certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF
    
    chmod +x /opt/ssl-renewal-${DOMAIN}.sh
    
    # Add to crontab (check twice daily)
    (crontab -l 2>/dev/null; echo "0 */12 * * * /opt/ssl-renewal-${DOMAIN}.sh") | crontab -
    
    log_success "Автоматическое обновление сертификата настроено"
}

# Test SSL configuration
test_ssl() {
    log_info "Тестирование SSL конфигурации..."
    
    # Wait a moment for Nginx to reload
    sleep 2
    
    # Test HTTPS connection
    if curl -s -I https://${DOMAIN} | grep -q "HTTP/2 200"; then
        log_success "SSL сертификат работает корректно"
    else
        log_warning "Возможны проблемы с SSL сертификатом"
    fi
    
    # Test SSL rating (optional)
    log_info "Для проверки рейтинга SSL используйте: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
}

# Main function
main() {
    log_info "Начало настройки SSL для домена: $DOMAIN"
    
    install_certbot
    validate_domain
    setup_temp_nginx
    obtain_certificate
    setup_production_nginx
    setup_auto_renewal
    test_ssl
    
    log_success "Настройка SSL завершена успешно!"
    log_success "Ваш сайт теперь доступен по адресу: https://${DOMAIN}"
    
    echo ""
    echo "==================================="
    echo "SSL SETUP COMPLETED"
    echo "==================================="
    echo "Domain: ${DOMAIN}"
    echo "Certificate: /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    echo "Private Key: /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
    echo "Auto Renewal: Enabled (twice daily check)"
    echo ""
    echo "Next Steps:"
    echo "1. Update your .env file with APP_URL=https://${DOMAIN}"
    echo "2. Test your website: https://${DOMAIN}"
    echo "3. Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
    echo "==================================="
}

# Run main function
main "$@"
