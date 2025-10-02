.PHONY: help install setup up down restart logs clean test backend mobile

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '$(CYAN)Buildify Platform - Available Commands$(NC)'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# =============================================================================
# INSTALLATION
# =============================================================================

install: ## Install all dependencies (backend + mobile)
	@echo '$(CYAN)Installing Backend Dependencies...$(NC)'
	cd apps/backend && composer install
	@echo '$(CYAN)Installing Mobile Dependencies...$(NC)'
	cd apps/mobile && npm install
	@echo '$(GREEN)✓ All dependencies installed$(NC)'

setup: ## Initial setup (copy env files, generate keys)
	@echo '$(CYAN)Setting up environment files...$(NC)'
	@test -f .env || cp .env.example .env
	@test -f apps/backend/.env || cp apps/backend/.env.example apps/backend/.env
	@test -f apps/mobile/.env || cp apps/mobile/env.local apps/mobile/.env
	cd apps/backend && php artisan key:generate
	@echo '$(GREEN)✓ Setup complete$(NC)'

# =============================================================================
# DOCKER
# =============================================================================

up: ## Start all services with Docker Compose
	@echo '$(CYAN)Starting Docker services...$(NC)'
	docker-compose up -d
	@echo '$(GREEN)✓ Services started$(NC)'
	@echo 'Backend: http://localhost:3000'
	@echo 'PostgreSQL: localhost:5433'
	@echo 'Redis: localhost:6380'
	@echo 'WebSocket: localhost:6001'

down: ## Stop all services
	@echo '$(YELLOW)Stopping Docker services...$(NC)'
	docker-compose down
	@echo '$(GREEN)✓ Services stopped$(NC)'

restart: ## Restart all services
	@echo '$(YELLOW)Restarting services...$(NC)'
	docker-compose restart
	@echo '$(GREEN)✓ Services restarted$(NC)'

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs only
	docker-compose logs -f backend

logs-queue: ## Show queue worker logs
	docker-compose logs -f queue

logs-db: ## Show database logs
	docker-compose logs -f postgres

# =============================================================================
# BACKEND
# =============================================================================

backend-shell: ## Open shell in backend container
	docker-compose exec backend bash

backend-migrate: ## Run database migrations
	@echo '$(CYAN)Running migrations...$(NC)'
	docker-compose exec backend php artisan migrate
	@echo '$(GREEN)✓ Migrations complete$(NC)'

backend-seed: ## Seed the database
	@echo '$(CYAN)Seeding database...$(NC)'
	docker-compose exec backend php artisan db:seed
	@echo '$(GREEN)✓ Database seeded$(NC)'

backend-fresh: ## Fresh migration with seed
	@echo '$(YELLOW)WARNING: This will drop all tables!$(NC)'
	@read -p "Continue? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose exec backend php artisan migrate:fresh --seed; \
		echo '$(GREEN)✓ Fresh migration complete$(NC)'; \
	fi

backend-test: ## Run backend tests
	@echo '$(CYAN)Running backend tests...$(NC)'
	cd apps/backend && ./vendor/bin/phpunit
	@echo '$(GREEN)✓ Tests complete$(NC)'

backend-lint: ## Run backend code linter
	@echo '$(CYAN)Running Pint...$(NC)'
	cd apps/backend && ./vendor/bin/pint
	@echo '$(GREEN)✓ Code formatted$(NC)'

backend-optimize: ## Optimize backend (caches)
	docker-compose exec backend php artisan optimize
	docker-compose exec backend php artisan config:cache
	docker-compose exec backend php artisan route:cache
	docker-compose exec backend php artisan view:cache
	@echo '$(GREEN)✓ Backend optimized$(NC)'

backend-clear: ## Clear all caches
	docker-compose exec backend php artisan optimize:clear
	@echo '$(GREEN)✓ Caches cleared$(NC)'

# =============================================================================
# MOBILE
# =============================================================================

mobile-android: ## Start mobile app on Android
	@echo '$(CYAN)Starting Android app...$(NC)'
	cd apps/mobile && npm run android

mobile-ios: ## Start mobile app on iOS
	@echo '$(CYAN)Starting iOS app...$(NC)'
	cd apps/mobile && npm run ios

mobile-start: ## Start Metro bundler
	cd apps/mobile && npm start

mobile-test: ## Run mobile tests
	@echo '$(CYAN)Running mobile tests...$(NC)'
	cd apps/mobile && npm test
	@echo '$(GREEN)✓ Tests complete$(NC)'

mobile-lint: ## Run mobile linter
	@echo '$(CYAN)Running ESLint...$(NC)'
	cd apps/mobile && npm run lint
	@echo '$(GREEN)✓ Linting complete$(NC)'

mobile-build-android: ## Build Android APK
	@echo '$(CYAN)Building Android APK...$(NC)'
	cd apps/mobile/android && ./gradlew assembleRelease
	@echo '$(GREEN)✓ APK built$(NC)'

mobile-build-ios: ## Build iOS bundle
	@echo '$(CYAN)Building iOS bundle...$(NC)'
	cd apps/mobile && npm run build-ios
	@echo '$(GREEN)✓ iOS bundle built$(NC)'

# =============================================================================
# DATABASE
# =============================================================================

db-backup: ## Backup PostgreSQL database
	@echo '$(CYAN)Creating database backup...$(NC)'
	mkdir -p backups
	docker-compose exec -T postgres pg_dump -U buildify buildify > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo '$(GREEN)✓ Backup created in backups/$(NC)'

db-restore: ## Restore database from backup (specify FILE=path/to/backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo '$(RED)Error: Please specify FILE=path/to/backup.sql$(NC)'; \
		exit 1; \
	fi
	@echo '$(YELLOW)Restoring database from $(FILE)...$(NC)'
	docker-compose exec -T postgres psql -U buildify buildify < $(FILE)
	@echo '$(GREEN)✓ Database restored$(NC)'

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U buildify buildify

# =============================================================================
# TESTING
# =============================================================================

test: backend-test mobile-test ## Run all tests (backend + mobile)

test-coverage: ## Run tests with coverage report
	@echo '$(CYAN)Running backend tests with coverage...$(NC)'
	cd apps/backend && ./vendor/bin/phpunit --coverage-html coverage
	@echo '$(CYAN)Running mobile tests with coverage...$(NC)'
	cd apps/mobile && npm test -- --coverage
	@echo '$(GREEN)✓ Coverage reports generated$(NC)'

# =============================================================================
# CLEAN
# =============================================================================

clean: ## Clean all generated files
	@echo '$(YELLOW)Cleaning...$(NC)'
	rm -rf apps/backend/vendor
	rm -rf apps/backend/node_modules
	rm -rf apps/mobile/node_modules
	rm -rf apps/mobile/ios/Pods
	@echo '$(GREEN)✓ Cleaned$(NC)'

clean-docker: ## Remove all Docker containers and volumes
	@echo '$(RED)WARNING: This will remove all containers and volumes!$(NC)'
	@read -p "Continue? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo '$(GREEN)✓ Docker cleaned$(NC)'; \
	fi

# =============================================================================
# PRODUCTION
# =============================================================================

prod-up: ## Start production services
	docker-compose -f docker-compose.prod.yml up -d
	@echo '$(GREEN)✓ Production services started$(NC)'

prod-down: ## Stop production services
	docker-compose -f docker-compose.prod.yml down
	@echo '$(GREEN)✓ Production services stopped$(NC)'

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-deploy: ## Deploy to production
	@echo '$(CYAN)Deploying to production...$(NC)'
	git pull origin main
	docker-compose -f docker-compose.prod.yml build
	docker-compose -f docker-compose.prod.yml up -d
	docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --force
	docker-compose -f docker-compose.prod.yml exec backend php artisan optimize
	@echo '$(GREEN)✓ Deployment complete$(NC)'

# =============================================================================
# UTILITIES
# =============================================================================

ps: ## Show running containers
	docker-compose ps

status: ## Show service status
	@echo '$(CYAN)Service Status:$(NC)'
	@docker-compose ps

health: ## Check health of services
	@echo '$(CYAN)Checking service health...$(NC)'
	@curl -s http://localhost:3000/health | jq . || echo 'Backend not running'

version: ## Show versions of all components
	@echo '$(CYAN)Component Versions:$(NC)'
	@echo 'PHP: $$(cd apps/backend && php -v | head -n 1)'
	@echo 'Composer: $$(cd apps/backend && composer -V)'
	@echo 'Node: $$(node -v)'
	@echo 'npm: $$(npm -v)'
	@echo 'Docker: $$(docker -v)'
