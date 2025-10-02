#!/bin/bash

# Buildify Platform - Security Audit Script
# Performs comprehensive security checks

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🔒 BUILDIFY SECURITY AUDIT                               ║"
echo "║   Comprehensive security vulnerability scan                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

ISSUES_FOUND=0

# ============================================================================
# DEPENDENCY VULNERABILITIES
# ============================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📦 CHECKING DEPENDENCY VULNERABILITIES${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Backend (Composer)
if [ -d "backend" ]; then
    echo -e "${CYAN}🔍 Auditing Backend Dependencies (Composer)...${NC}"
    cd backend
    if composer audit; then
        echo -e "${GREEN}✅ No vulnerabilities found in backend dependencies${NC}"
    else
        echo -e "${RED}❌ Vulnerabilities found in backend dependencies!${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    cd ..
fi

# Mobile (npm)
if [ -d "mobile" ]; then
    echo -e "\n${CYAN}🔍 Auditing Mobile Dependencies (npm)...${NC}"
    cd mobile
    if npm audit --audit-level=moderate; then
        echo -e "${GREEN}✅ No vulnerabilities found in mobile dependencies${NC}"
    else
        echo -e "${YELLOW}⚠️  Vulnerabilities found in mobile dependencies${NC}"
        echo -e "${CYAN}Run 'npm audit fix' to attempt automatic fixes${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    cd ..
fi

# ============================================================================
# SECRET SCANNING
# ============================================================================

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔐 SCANNING FOR EXPOSED SECRETS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}🔍 Checking for exposed API keys and secrets...${NC}"

# Check for common secret patterns
SECRETS_FOUND=0

# Stripe keys
if grep -r "sk_live_" backend/ mobile/ 2>/dev/null | grep -v ".git" | grep -v "node_modules" | grep -v "vendor"; then
    echo -e "${RED}❌ Found Stripe live keys in code!${NC}"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
fi

# OpenAI keys
if grep -r "sk-proj-" backend/ mobile/ 2>/dev/null | grep -v ".git" | grep -v "node_modules" | grep -v "vendor" | grep -v "SECRETS.md"; then
    echo -e "${RED}❌ Found OpenAI keys in code!${NC}"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
fi

# AWS keys
if grep -r "AKIA" backend/ mobile/ 2>/dev/null | grep -v ".git"; then
    echo -e "${RED}❌ Found AWS keys in code!${NC}"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
fi

# Database passwords
if grep -r "password.*=" backend/.env mobile/.env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  .env files contain passwords (expected, but verify they're not in git)${NC}"
fi

if [ $SECRETS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No exposed secrets found${NC}"
else
    echo -e "${RED}❌ Found $SECRETS_FOUND secret exposure issues!${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# ============================================================================
# CODE QUALITY CHECKS
# ============================================================================

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}✨ CODE QUALITY ANALYSIS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Backend - PHPStan
if [ -d "backend" ]; then
    echo -e "${CYAN}🔍 Running PHPStan (Backend)...${NC}"
    cd backend
    if ./vendor/bin/phpstan analyse --memory-limit=2G; then
        echo -e "${GREEN}✅ PHPStan analysis passed${NC}"
    else
        echo -e "${YELLOW}⚠️  PHPStan found potential issues${NC}"
    fi
    cd ..
fi

# Mobile - ESLint
if [ -d "mobile" ]; then
    echo -e "\n${CYAN}🔍 Running ESLint (Mobile)...${NC}"
    cd mobile
    if npm run lint; then
        echo -e "${GREEN}✅ ESLint passed${NC}"
    else
        echo -e "${YELLOW}⚠️  ESLint found issues${NC}"
    fi
    cd ..
fi

# ============================================================================
# SECURITY HEADERS CHECK
# ============================================================================

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🛡️  CHECKING SECURITY HEADERS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${CYAN}🔍 Checking HTTP security headers...${NC}"
    
    HEADERS=$(curl -s -I http://localhost:3000)
    
    # Check for security headers
    if echo "$HEADERS" | grep -i "X-Frame-Options" > /dev/null; then
        echo -e "${GREEN}✅ X-Frame-Options header present${NC}"
    else
        echo -e "${RED}❌ X-Frame-Options header missing!${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if echo "$HEADERS" | grep -i "X-Content-Type-Options" > /dev/null; then
        echo -e "${GREEN}✅ X-Content-Type-Options header present${NC}"
    else
        echo -e "${RED}❌ X-Content-Type-Options header missing!${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if echo "$HEADERS" | grep -i "X-XSS-Protection" > /dev/null; then
        echo -e "${GREEN}✅ X-XSS-Protection header present${NC}"
    else
        echo -e "${YELLOW}⚠️  X-XSS-Protection header missing${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Server not running, skipping header checks${NC}"
fi

# ============================================================================
# COMMON SECURITY MISCONFIGURATIONS
# ============================================================================

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}⚙️  CHECKING SECURITY CONFIGURATIONS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check for debug mode in production
if [ -f "backend/.env" ]; then
    if grep "APP_DEBUG=true" backend/.env > /dev/null; then
        echo -e "${YELLOW}⚠️  APP_DEBUG is true (should be false in production)${NC}"
    else
        echo -e "${GREEN}✅ APP_DEBUG is properly configured${NC}"
    fi
fi

# Check for default passwords
if grep -i "password.*=.*password" backend/.env 2>/dev/null; then
    echo -e "${RED}❌ Default passwords found in .env!${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No default passwords found${NC}"
fi

# Check for exposed .git directory
if [ -d "backend/public/.git" ] || [ -d "mobile/.git" ]; then
    echo -e "${RED}❌ .git directory exposed in public folder!${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# ============================================================================
# FINAL REPORT
# ============================================================================

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 SECURITY AUDIT SUMMARY${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ SECURITY AUDIT PASSED                             ║${NC}"
    echo -e "${GREEN}║   No critical security issues found                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ SECURITY ISSUES FOUND: $ISSUES_FOUND                           ║${NC}"
    echo -e "${RED}║   Please address these issues before deployment       ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi

