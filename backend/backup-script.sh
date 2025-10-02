#!/bin/bash

# =============================================================================
# Buildlify Backend Backup Script
# Скрипт для создания резервных копий базы данных и файлов приложения
# =============================================================================

set -e

# Configuration
APP_NAME="buildlify"
APP_DIR="/var/www/${APP_NAME}"
BACKUP_BASE_DIR="/opt/backups"
DB_NAME="buildlify_production"
DB_USER="buildlify_user"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="${BACKUP_BASE_DIR}/${backup_date}"
    
    mkdir -p "${BACKUP_DIR}"
    log_info "Создана директория для бэкапа: ${BACKUP_DIR}"
}

# Backup database
backup_database() {
    log_info "Создание резервной копии базы данных..."
    
    local db_backup_file="${BACKUP_DIR}/database.sql"
    local db_backup_compressed="${BACKUP_DIR}/database.sql.gz"
    
    # Create database backup
    sudo -u postgres pg_dump "${DB_NAME}" > "${db_backup_file}"
    
    # Compress the backup
    gzip "${db_backup_file}"
    
    # Verify backup
    if [ -f "${db_backup_compressed}" ]; then
        local file_size=$(du -h "${db_backup_compressed}" | cut -f1)
        log_success "Резервная копия БД создана: ${db_backup_compressed} (${file_size})"
    else
        log_error "Ошибка создания резервной копии БД"
        return 1
    fi
}

# Backup application files
backup_app_files() {
    log_info "Создание резервной копии файлов приложения..."
    
    local app_backup_file="${BACKUP_DIR}/app_files.tar.gz"
    
    # Create application backup excluding cache and logs
    tar -czf "${app_backup_file}" \
        -C "$(dirname ${APP_DIR})" \
        --exclude="${APP_NAME}/storage/logs/*" \
        --exclude="${APP_NAME}/storage/framework/cache/*" \
        --exclude="${APP_NAME}/storage/framework/sessions/*" \
        --exclude="${APP_NAME}/storage/framework/views/*" \
        --exclude="${APP_NAME}/node_modules" \
        --exclude="${APP_NAME}/vendor" \
        --exclude="${APP_NAME}/.git" \
        "${APP_NAME}"
    
    # Verify backup
    if [ -f "${app_backup_file}" ]; then
        local file_size=$(du -h "${app_backup_file}" | cut -f1)
        log_success "Резервная копия файлов создана: ${app_backup_file} (${file_size})"
    else
        log_error "Ошибка создания резервной копии файлов"
        return 1
    fi
}

# Backup storage files separately
backup_storage() {
    log_info "Создание резервной копии файлов хранилища..."
    
    local storage_backup_file="${BACKUP_DIR}/storage_files.tar.gz"
    local storage_dir="${APP_DIR}/storage/app"
    
    if [ -d "${storage_dir}" ]; then
        tar -czf "${storage_backup_file}" -C "${storage_dir}" .
        
        if [ -f "${storage_backup_file}" ]; then
            local file_size=$(du -h "${storage_backup_file}" | cut -f1)
            log_success "Резервная копия хранилища создана: ${storage_backup_file} (${file_size})"
        else
            log_error "Ошибка создания резервной копии хранилища"
            return 1
        fi
    else
        log_warning "Директория хранилища не найдена: ${storage_dir}"
    fi
}

# Create backup info file
create_backup_info() {
    log_info "Создание информационного файла..."
    
    local info_file="${BACKUP_DIR}/backup_info.txt"
    
    cat > "${info_file}" << EOF
Buildlify Backup Information
============================
Backup Date: $(date '+%Y-%m-%d %H:%M:%S')
Server: $(hostname)
Application: ${APP_NAME}
Database: ${DB_NAME}

Files in this backup:
$(ls -lah "${BACKUP_DIR}")

System Information:
OS: $(lsb_release -d | cut -f2)
PHP Version: $(php --version | head -n1)
PostgreSQL Version: $(sudo -u postgres psql -c "SELECT version();" | head -n3 | tail -n1)
Redis Version: $(redis-server --version)

Disk Usage:
$(df -h | grep -E '(Filesystem|/dev/)')

Memory Usage:
$(free -h)
EOF
    
    log_success "Информационный файл создан: ${info_file}"
}

# Clean old backups
cleanup_old_backups() {
    log_info "Удаление старых резервных копий (старше ${RETENTION_DAYS} дней)..."
    
    local deleted_count=0
    
    # Find and delete old backup directories
    while IFS= read -r -d '' dir; do
        rm -rf "$dir"
        deleted_count=$((deleted_count + 1))
        log_info "Удалена старая резервная копия: $(basename "$dir")"
    done < <(find "${BACKUP_BASE_DIR}" -maxdepth 1 -type d -name "20*" -mtime +${RETENTION_DAYS} -print0)
    
    if [ $deleted_count -eq 0 ]; then
        log_info "Старых резервных копий для удаления не найдено"
    else
        log_success "Удалено старых резервных копий: ${deleted_count}"
    fi
}

# Verify backup integrity
verify_backup() {
    log_info "Проверка целостности резервной копии..."
    
    local errors=0
    
    # Check database backup
    if [ -f "${BACKUP_DIR}/database.sql.gz" ]; then
        if gzip -t "${BACKUP_DIR}/database.sql.gz" 2>/dev/null; then
            log_success "Резервная копия БД прошла проверку целостности"
        else
            log_error "Резервная копия БД повреждена"
            errors=$((errors + 1))
        fi
    fi
    
    # Check app files backup
    if [ -f "${BACKUP_DIR}/app_files.tar.gz" ]; then
        if tar -tzf "${BACKUP_DIR}/app_files.tar.gz" >/dev/null 2>&1; then
            log_success "Резервная копия файлов прошла проверку целостности"
        else
            log_error "Резервная копия файлов повреждена"
            errors=$((errors + 1))
        fi
    fi
    
    return $errors
}

# Send backup notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    # Uncomment and configure if you want email notifications
    # echo "$message" | mail -s "Buildlify Backup $status" admin@your-domain.com
    
    log_info "Уведомление: $message"
}

# Main backup function
main() {
    log_info "Начало создания резервной копии Buildlify..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        log_error "Этот скрипт должен быть запущен с правами root (sudo)"
        exit 1
    fi
    
    # Create backup directory
    create_backup_dir
    
    # Perform backups
    backup_database || exit 1
    backup_app_files || exit 1
    backup_storage || exit 1
    create_backup_info
    
    # Verify backup
    if verify_backup; then
        log_success "Все резервные копии созданы и проверены успешно"
        send_notification "SUCCESS" "Резервное копирование завершено успешно: ${BACKUP_DIR}"
    else
        log_error "Обнаружены ошибки в резервных копиях"
        send_notification "ERROR" "Резервное копирование завершено с ошибками: ${BACKUP_DIR}"
        exit 1
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Final summary
    local total_size=$(du -sh "${BACKUP_DIR}" | cut -f1)
    log_success "Резервное копирование завершено. Общий размер: ${total_size}"
    log_success "Расположение: ${BACKUP_DIR}"
}

# Run main function
main "$@"
