#!/bin/bash

# Buildify Platform - Complete Testing Suite Runner
# Запускает все тесты для backend и mobile

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🧪 BUILDIFY PLATFORM - COMPREHENSIVE TEST SUITE          ║"
echo "║   Running all tests: Backend + Mobile + Integration        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Track results
BACKEND_RESULT=0
MOBILE_RESULT=0
INTEGRATION_RESULT=0

# ============================================================================
# BACKEND TESTS
# ============================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔧 BACKEND TESTING${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "backend" ]; then
    cd backend
    
    # Setup test environment
    echo -e "${YELLOW}⚙️  Setting up test environment...${NC}"
    php artisan config:clear --env=testing
    php artisan migrate:fresh --env=testing --seed --force
    
    # Run Unit Tests
    echo -e "\n${CYAN}📦 Running Unit Tests...${NC}"
    ./vendor/bin/phpunit --testsuite=Unit --testdox || BACKEND_RESULT=1
    
    # Run Feature Tests
    echo -e "\n${CYAN}🔗 Running Feature Tests...${NC}"
    ./vendor/bin/phpunit --testsuite=Feature --testdox || BACKEND_RESULT=1
    
    # Code Coverage
    echo -e "\n${CYAN}📊 Generating Coverage Report...${NC}"
    ./vendor/bin/phpunit --coverage-text --coverage-html ../test-reports/backend-coverage
    
    # Static Analysis
    echo -e "\n${CYAN}🔍 Running PHPStan Static Analysis...${NC}"
    ./vendor/bin/phpstan analyse --memory-limit=2G || echo -e "${YELLOW}⚠️  PHPStan found issues${NC}"
    
    # Code Style
    echo -e "\n${CYAN}✨ Checking Code Style (Pint)...${NC}"
    ./vendor/bin/pint --test || echo -e "${YELLOW}⚠️  Code style issues found${NC}"
    
    cd ..
else
    echo -e "${RED}❌ Backend directory not found${NC}"
    BACKEND_RESULT=1
fi

if [ $BACKEND_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}✅ Backend Tests PASSED${NC}\n"
else
    echo -e "\n${RED}❌ Backend Tests FAILED${NC}\n"
fi

# ============================================================================
# MOBILE TESTS
# ============================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📱 MOBILE TESTING${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "mobile" ]; then
    cd mobile
    
    # Run Jest Tests
    echo -e "${CYAN}🧪 Running Jest Tests...${NC}"
    npm test -- --coverage --verbose || MOBILE_RESULT=1
    
    # Copy coverage report
    if [ -d "coverage" ]; then
        mkdir -p ../test-reports/mobile-coverage
        cp -r coverage/* ../test-reports/mobile-coverage/
    fi
    
    # ESLint
    echo -e "\n${CYAN}🔍 Running ESLint...${NC}"
    npm run lint || echo -e "${YELLOW}⚠️  Lint issues found${NC}"
    
    # TypeScript Check
    echo -e "\n${CYAN}📘 Running TypeScript Check...${NC}"
    npm run tsc -- --noEmit || echo -e "${YELLOW}⚠️  TypeScript errors found${NC}"
    
    cd ..
else
    echo -e "${RED}❌ Mobile directory not found${NC}"
    MOBILE_RESULT=1
fi

if [ $MOBILE_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}✅ Mobile Tests PASSED${NC}\n"
else
    echo -e "\n${RED}❌ Mobile Tests FAILED${NC}\n"
fi

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔗 INTEGRATION TESTING${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}🌐 Testing API Health...${NC}"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$HEALTH_CHECK" == "200" ]; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${RED}❌ Backend API health check failed (HTTP $HEALTH_CHECK)${NC}"
    INTEGRATION_RESULT=1
fi

echo -e "\n${CYAN}🔌 Testing WebSocket...${NC}"
# Add WebSocket test here

# ============================================================================
# FINAL REPORT
# ============================================================================

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 FINAL TEST REPORT${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Test Component          Status"
echo "─────────────────────  ────────"

if [ $BACKEND_RESULT -eq 0 ]; then
    echo -e "Backend Tests           ${GREEN}PASSED ✅${NC}"
else
    echo -e "Backend Tests           ${RED}FAILED ❌${NC}"
fi

if [ $MOBILE_RESULT -eq 0 ]; then
    echo -e "Mobile Tests            ${GREEN}PASSED ✅${NC}"
else
    echo -e "Mobile Tests            ${RED}FAILED ❌${NC}"
fi

if [ $INTEGRATION_RESULT -eq 0 ]; then
    echo -e "Integration Tests       ${GREEN}PASSED ✅${NC}"
else
    echo -e "Integration Tests       ${RED}FAILED ❌${NC}"
fi

# Calculate overall result
TOTAL_RESULT=$(($BACKEND_RESULT + $MOBILE_RESULT + $INTEGRATION_RESULT))

echo ""
if [ $TOTAL_RESULT -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ ALL TESTS PASSED!                                 ║${NC}"
    echo -e "${GREEN}║   Your code is ready for deployment 🚀                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ SOME TESTS FAILED                                 ║${NC}"
    echo -e "${RED}║   Please fix the issues before deploying              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}📋 Test Reports Location:${NC}"
    echo "   Backend Coverage: test-reports/backend-coverage/index.html"
    echo "   Mobile Coverage:  test-reports/mobile-coverage/lcov-report/index.html"
    
    exit 1
fi

