# Referral System Testing Guide

## Overview

Comprehensive testing suite for the referral program covering functionality, security, performance, and integration scenarios.

## Test Structure

### 1. Basic Functionality Tests (`ReferralBasicTest.php`)
**Purpose:** Core functionality validation
**Tests:** 8 tests, 27 assertions
**Coverage:**
- Referral code creation and uniqueness
- Referral relationship establishment
- Self-referral prevention
- User type restrictions (only executors can be referrals)
- Statistics calculation accuracy
- Referral balance usage
- API authentication requirements

**Run:** `php artisan test tests/Feature/ReferralBasicTest.php`

### 2. Advanced Functionality Tests (`ReferralAdvancedTest.php`)
**Purpose:** Complex scenarios and edge cases
**Tests:** 10 tests
**Coverage:**
- Referral code generation algorithms
- Character exclusion (confusing characters like 0, O, 1, I)
- Cashback calculation with various percentages
- Maximum and minimum cashback limits
- Multiple referrals from same user
- Cashback accumulation from multiple transactions
- Referral balance usage scenarios
- Code validation edge cases
- Program enable/disable functionality
- Settings caching mechanisms

**Run:** `php artisan test tests/Feature/ReferralAdvancedTest.php`

### 3. API Endpoint Tests (`ReferralApiTest.php`)
**Purpose:** API functionality and validation
**Tests:** 7 tests
**Coverage:**
- GET `/api/referrals/my-stats` endpoint
- GET `/api/referrals/my-referrals` with pagination
- GET `/api/referrals/my-code` endpoint
- POST `/api/referrals/use-balance` endpoint
- POST `/api/referrals/validate-code` endpoint
- Authentication requirements for all endpoints
- Input validation and error handling
- Pagination parameter validation

**Run:** `php artisan test tests/Feature/ReferralApiTest.php`

### 4. Integration Tests (`ReferralIntegrationTest.php`)
**Purpose:** Integration with existing systems
**Tests:** 9 tests
**Coverage:**
- User registration integration
- Referral registration with promo codes
- Wallet service integration for cashback
- Customer registration handling (should be ignored)
- Disabled program behavior
- Transaction cancellation
- Multi-currency support
- Database relationship consistency
- Error handling in edge cases

**Run:** `php artisan test tests/Feature/ReferralIntegrationTest.php`

### 5. Security Tests (`ReferralSecurityTest.php`)
**Purpose:** Security vulnerabilities and attack prevention
**Tests:** 9 tests
**Coverage:**
- Self-referral prevention
- Duplicate relationship prevention
- API authorization checks
- SQL injection protection
- Rate limiting validation
- Balance manipulation protection
- Code case sensitivity
- Data consistency validation
- Input sanitization

**Run:** `php artisan test tests/Feature/ReferralSecurityTest.php`

### 6. Performance Tests (`ReferralPerformanceTest.php`)
**Purpose:** Performance and scalability validation
**Tests:** 8 tests (some marked as skipped for manual execution)
**Coverage:**
- Code generation performance (1000 codes < 2 seconds)
- Bulk referral creation (500 referrals < 10 seconds)
- Stats query performance (10 requests < 1 second)
- Pagination performance with large datasets
- Settings cache effectiveness
- Concurrent operations handling
- Database index effectiveness
- Memory usage optimization
- API response time under load
- Scalability with 10k+ users

**Run:** `php artisan test tests/Feature/ReferralPerformanceTest.php`

## Running All Tests

### Individual Test Suites
```bash
# Basic functionality
php artisan test tests/Feature/ReferralBasicTest.php

# Advanced features
php artisan test tests/Feature/ReferralAdvancedTest.php

# API endpoints
php artisan test tests/Feature/ReferralApiTest.php

# System integration
php artisan test tests/Feature/ReferralIntegrationTest.php

# Security validation
php artisan test tests/Feature/ReferralSecurityTest.php

# Performance testing
php artisan test tests/Feature/ReferralPerformanceTest.php
```

### All Referral Tests
```bash
php artisan test tests/Feature/Referral*
```

### With Coverage Report
```bash
php artisan test tests/Feature/Referral* --coverage
```

## Test Data Requirements

### Database Setup
Tests use `RefreshDatabase` trait and create:
- Test users (executors, customers, mediators)
- Referral codes and relationships
- Wallet transactions
- System settings

### Required Seeders
```bash
php artisan db:seed --class=ReferralSettingsSeeder
```

## Performance Benchmarks

### Expected Performance Metrics
- **Code Generation:** 1000 codes in < 2 seconds
- **API Response Time:** < 500ms under normal load
- **Stats Loading:** < 1 second with 1000+ referrals
- **Pagination:** < 1 second for any page
- **Cashback Processing:** < 100ms per transaction
- **Memory Usage:** < 50MB for 1000 users

### Load Testing Scenarios
1. **High Referral Volume:** 1000+ referrals per user
2. **Concurrent Cashback:** Multiple simultaneous transactions
3. **API Burst:** 100+ requests per second
4. **Large Dataset:** 10,000+ users with cross-referrals

## Test Environment Setup

### Local Testing
```bash
# Setup test database
cp .env .env.testing
# Update DB_DATABASE to testing database

# Run migrations
php artisan migrate --env=testing

# Run tests
php artisan test --env=testing
```

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run Referral Tests
  run: |
    php artisan migrate --force
    php artisan db:seed --class=ReferralSettingsSeeder --force
    php artisan test tests/Feature/Referral* --stop-on-failure
```

## Debugging Failed Tests

### Common Issues
1. **Missing Settings:** Run `ReferralSettingsSeeder`
2. **Database State:** Ensure `RefreshDatabase` is working
3. **Cache Issues:** Clear cache between tests
4. **Timing Issues:** Increase timeout for performance tests

### Debug Commands
```bash
# Check test database state
php artisan tinker --env=testing
>>> App\Models\ReferralSetting::count()
>>> App\Models\User::count()

# Run specific test with verbose output
php artisan test tests/Feature/ReferralBasicTest.php::test_referral_code_is_created_for_new_user --verbose

# Run with debugging
php artisan test --debug
```

## Test Coverage Goals

### Minimum Coverage Requirements
- **Functionality:** 95% of core features
- **API Endpoints:** 100% of public methods
- **Security:** 100% of attack vectors
- **Integration:** 90% of system interactions
- **Performance:** Key operations benchmarked

### Coverage Report
```bash
php artisan test tests/Feature/Referral* --coverage-html coverage/referral
```

## Continuous Testing

### Pre-commit Hooks
```bash
#!/bin/sh
# Run referral tests before commit
php artisan test tests/Feature/ReferralBasicTest.php --stop-on-failure
```

### Automated Testing Schedule
- **Every commit:** Basic and API tests
- **Daily:** All tests including integration
- **Weekly:** Performance and scalability tests
- **Before release:** Full test suite with coverage

## Test Data Cleanup

### After Testing
```bash
# Clear test data
php artisan migrate:refresh --env=testing

# Reset cache
php artisan cache:clear
```

### Production Safety
- Tests use separate database
- No production data is modified
- All tests are isolated and reversible

## Monitoring Test Results

### Key Metrics to Track
1. **Test Execution Time:** Should remain stable
2. **Memory Usage:** Should not increase over time
3. **Database Query Count:** Should be optimized
4. **API Response Times:** Should meet benchmarks

### Alerting Thresholds
- Test failure rate > 5%
- Performance degradation > 20%
- Memory usage increase > 50%
- API response time > 1 second

## Test Documentation

Each test includes:
- Clear description of what is being tested
- Expected behavior documentation
- Error scenarios coverage
- Performance expectations
- Security considerations

This comprehensive testing suite ensures the referral system is robust, secure, and performant in all scenarios.
