# 🤖 AI-Powered Testing Prompt for Buildify Platform

## PROMPT FOR AI ASSISTANT

```
You are a Senior QA Engineer and Test Architect specializing in comprehensive software testing. 
Your task is to perform a complete testing audit of the Buildify Platform - an enterprise-grade 
marketplace for construction services.

## PROJECT CONTEXT

**Platform:** Buildify - Construction Services Marketplace
**Architecture:** Monorepo (Backend API + Mobile App)
**Repository:** https://github.com/TheMacroeconomicDao/buildify-platform

**Technology Stack:**
- Backend: Laravel 11 (PHP 8.2), PostgreSQL 15, Redis 7
- Mobile: React Native 0.75.3 (iOS & Android)
- Infrastructure: Docker Compose, Nginx, Soketi WebSocket
- Integrations: Stripe, OpenAI GPT-4, Firebase FCM

**Scale:**
- 350+ API endpoints
- 46+ database models
- 47+ mobile screens
- 60+ UI components
- 4 user types (Customer, Executor, Mediator, Admin)

## YOUR MISSION

Perform comprehensive testing to identify ALL bugs, security vulnerabilities, and performance 
issues across the entire platform. Current test coverage is critically low (<20% backend, 
<5% mobile), making this a HIGH PRIORITY task.

## TESTING PHASES

### PHASE 1: ANALYSIS & PLANNING (Day 1-2)

1. **Codebase Analysis:**
   - Review backend code structure (Models, Services, Controllers)
   - Review mobile code structure (Components, Screens, Hooks, Redux)
   - Identify critical business logic
   - Map all API endpoints
   - Document user flows

2. **Test Strategy:**
   - Prioritize high-risk areas (payments, auth, order management)
   - Define test coverage targets (70%+ overall)
   - Create test execution plan
   - Set up test environment

**Deliverable:** Testing strategy document with prioritized test plan

### PHASE 2: UNIT TESTING (Day 3-12)

**Backend Unit Tests (Day 3-8):**

Test ALL service classes with 80%+ coverage:

1. **ReferralService** - Critical for revenue
   ```
   Test Cases:
   - createReferralCode() - generates unique 8-char code
   - processReferralRegistration() - links referrer & referred
   - processCashback() - calculates 10% correctly
   - validateCode() - validates active codes only
   - useReferralBalance() - deducts balance for subscriptions
   - getReferralStats() - returns accurate statistics
   
   Edge Cases:
   - Self-referral attempts (should fail)
   - Inactive referral codes (should reject)
   - Duplicate code usage (should prevent)
   - Cashback on $0 deposit (should skip)
   - Negative balance usage (should reject)
   - Circular referrals (A→B→A)
   ```

2. **WalletService** - Critical for payments
   ```
   Test Cases:
   - deposit() - adds funds correctly
   - charge() - deducts funds with balance check
   - hasBalance() - accurate balance checking
   - holdFunds() - escrow functionality
   - releaseFunds() - release after order completion
   - refundFunds() - refund on cancellation
   
   Edge Cases:
   - Concurrent transactions (race conditions)
   - Negative amounts (should reject)
   - Balance exactly $0 (edge case)
   - Multiple deposits same time (consistency)
   - Charge more than balance (should fail)
   - Double charge prevention
   ```

3. **SubscriptionService** - Critical for business model
   ```
   Test Cases:
   - activateSubscription() - sets all fields correctly
   - cancelSubscription() - handles cancellation
   - checkExpiration() - detects expired subscriptions
   - switchToNextTariff() - automatic tier switching
   - canCreateOrder() - enforces order limits
   - canSendContact() - enforces contact limits
   
   Edge Cases:
   - Subscription expires mid-operation
   - Upgrade/downgrade edge cases
   - Limit exactly at maximum
   - Expired but not yet switched
   - Multiple subscriptions conflict
   ```

4. **MediatorService** - Unique business logic
   ```
   Test Cases:
   - calculateCommission() - all 3 methods (%, fixed, agreed)
   - assignMediatorToOrder() - assignment logic
   - moveToNextStep() - 3-step workflow
   - completeOrderSuccessfully() - finalization
   - canTakeOrder() - eligibility check
   
   Edge Cases:
   - Commission calculation priority
   - Order already has mediator
   - Skip step attempts
   - Incomplete step data
   - Concurrent mediator assignments
   ```

**Mobile Unit Tests (Day 9-12):**

Test ALL custom hooks with 80%+ coverage:

1. **useAuth Hook:**
   ```
   - login() - handles success/failure
   - logout() - clears auth state
   - register() - multi-step process
   - refreshToken() - token refresh logic
   - checkAuthStatus() - verifies token validity
   ```

2. **useOrders Hook:**
   ```
   - fetchOrders() - loads orders with filters
   - createOrder() - creates with validation
   - updateOrder() - updates correctly
   - cancelOrder() - handles cancellation
   - completeOrder() - mutual completion
   ```

3. **useSubscription Hook:**
   ```
   - fetchTariffs() - loads all tiers
   - purchaseSubscription() - Stripe flow
   - cancelSubscription() - cancels correctly
   - checkLimits() - enforces limits
   ```

4. **Redux Reducers:**
   ```
   Test ALL actions and state changes:
   - authReducer - all auth actions
   - ordersReducer - all order actions
   - subscriptionReducer - all subscription actions
   - walletReducer - all wallet actions
   - notificationsReducer - all notification actions
   ```

**Deliverable:** 
- 200+ unit tests written
- Coverage reports (>70%)
- Bug list from unit testing

### PHASE 3: INTEGRATION TESTING (Day 13-18)

**API Endpoint Testing:**

Test ALL 350+ endpoints systematically:

**Authentication APIs (6 endpoints):**
```
1. POST /api/login
   - Valid credentials → 200 + token
   - Invalid email → 401
   - Invalid password → 401
   - Missing fields → 422
   - Rate limiting check
   
2. POST /api/logout
   - With valid token → 200
   - Without token → 401
   - Token revoked check
   
3. POST /api/registration/start
   - Valid data → 200 + verification_id
   - Duplicate email → 422
   - Duplicate phone → 422
   - Invalid phone format → 422
   - Missing required fields → 422
   
4. POST /api/registration/end
   - Valid code → 201 + user + token
   - Invalid code → 401
   - Expired code → 401
   - Missing verification_id → 422
   
5. POST /api/password-recovery
   - Valid phone → 200 + code sent
   - Invalid phone → 404
   - Rate limiting check
   
6. POST /api/change-password
   - Valid code + password → 200
   - Invalid code → 401
   - Weak password → 422
```

**Order APIs (20+ endpoints):**
```
For EACH endpoint, test:
✅ Happy path (success case)
✅ Authentication required
✅ Authorization (correct user only)
✅ Validation (all fields)
✅ Edge cases (boundary values)
✅ Error handling
✅ Rate limiting (if applicable)
✅ Response format (JSON structure)
✅ Database state changes
✅ Notifications triggered
```

**Continue for ALL 350+ endpoints...**

### PHASE 4: E2E TESTING (Day 19-23)

**Critical User Flows:**

1. **Complete Customer Journey (Mobile App):**
   ```
   Test on iOS AND Android:
   
   1. Open app (first launch)
   2. Select "Customer" type
   3. Register new account
      - Enter phone, email, name
      - Receive SMS code
      - Enter code
      - Set password
      - Account created ✓
   4. Login
      - Token saved ✓
      - Redirect to home ✓
   5. Browse subscriptions
      - View all tiers ✓
      - Compare features ✓
   6. Purchase "Pro" subscription
      - Select Pro tier ✓
      - Open Stripe checkout ✓
      - Enter test card: 4242 4242 4242 4242 ✓
      - Payment processed ✓
      - Webhook received ✓
      - Subscription activated ✓
      - Return to app ✓
   7. Create first order
      - Fill all fields ✓
      - Upload photos ✓
      - Set budget ✓
      - Publish order ✓
   8. Wait for responses (simulate executor)
   9. View responses
      - See executor profiles ✓
      - Compare prices ✓
      - Check ratings ✓
   10. Select best executor
       - Executor notified ✓
       - Order status updated ✓
   11. Track progress
       - Real-time updates ✓
       - WebSocket notifications ✓
   12. Complete order
       - Accept work ✓
       - Mutual completion ✓
       - Status = completed ✓
   13. Leave review
       - Rate 5 stars ✓
       - Write comment ✓
       - Review submitted ✓
   14. Check executor rating updated ✓
   
   END - Full flow completed successfully!
   ```

2. **Complete Executor Journey:**
   ```
   Similar detailed flow for executor role...
   ```

3. **Complete Mediator Journey:**
   ```
   3-step mediator workflow testing...
   ```

4. **Cross-Platform Testing:**
   ```
   Run SAME tests on:
   - iOS Simulator (multiple versions)
   - Android Emulator (multiple API levels)
   - Physical iOS device
   - Physical Android device
   ```

### PHASE 5: SECURITY TESTING (Day 24-26)

**OWASP Top 10 Testing:**

1. **Injection Attacks:**
   ```
   SQL Injection:
   - Test all endpoints with: '; DROP TABLE users; --
   - Test search with: ' OR '1'='1
   - Test filters with: 1' UNION SELECT * FROM users--
   
   Expected: All should be safely escaped/rejected
   ```

2. **Broken Authentication:**
   ```
   - Try accessing protected routes without token
   - Try using expired/invalid tokens
   - Try token from different user
   - Test password reset flow for bypasses
   - Test session fixation
   ```

3. **Sensitive Data Exposure:**
   ```
   - Check API responses for password hashes
   - Verify encryption in transit (HTTPS only)
   - Check error messages for data leaks
   - Verify file upload privacy
   ```

4. **Broken Access Control:**
   ```
   - Customer trying executor-only endpoints
   - Executor trying customer-only endpoints
   - User A accessing User B's data
   - Non-admin accessing admin routes
   - IDOR (Insecure Direct Object Reference) testing
   ```

5. **XSS (Cross-Site Scripting):**
   ```
   Test all text inputs with:
   - <script>alert('XSS')</script>
   - <img src=x onerror=alert('XSS')>
   - javascript:alert('XSS')
   - <iframe src="javascript:alert('XSS')">
   
   Expected: All should be sanitized
   ```

### PHASE 6: PERFORMANCE TESTING (Day 27-28)

**Load Testing Scenarios:**

1. **Normal Load (50 concurrent users):**
   ```bash
   artillery run tests/load/artillery-normal-load.yml
   
   Expected Metrics:
   - Response Time P95 < 500ms
   - Error Rate < 1%
   - Throughput > 100 req/sec
   ```

2. **Peak Load (100 concurrent users):**
   ```
   Expected:
   - Response Time P95 < 800ms
   - Error Rate < 2%
   - No crashes
   ```

3. **Stress Test (200 concurrent users):**
   ```
   Expected:
   - System remains stable
   - Graceful degradation
   - No data corruption
   ```

**Database Performance:**
```
- Measure query times
- Identify N+1 queries
- Check index usage
- Monitor connection pool
```

**Mobile Performance:**
```
- App launch time < 3s
- Screen load time < 1s
- Smooth scrolling (60fps)
- Memory usage < 200MB
- No memory leaks
```

### PHASE 7: REGRESSION TESTING (Day 29)

**Re-test Critical Flows:**
- All bugs fixed should be re-tested
- Ensure fixes don't break other features
- Run full test suite again

### PHASE 8: REPORTING (Day 30)

**Generate Comprehensive Report:**

```markdown
# Buildify Platform - Testing Report

## Executive Summary
- Total Tests Run: XXXX
- Tests Passed: XXXX (XX%)
- Tests Failed: XXX (XX%)
- Code Coverage: XX%

## Bugs Found

### Critical (P0) - X bugs
| ID | Component | Description | Status |
|----|-----------|-------------|--------|
| BUG-001 | Payment | Double charge possible | Fixed |

### High (P1) - X bugs
...

### Medium (P2) - X bugs
...

### Low (P3) - X bugs
...

## Security Findings

### Critical
- [List all critical security issues]

### Recommendations
- [List security improvements]

## Performance Issues

### Response Time Issues
- [List slow endpoints]

### Database Issues
- [List N+1 queries]

### Mobile Performance
- [List UI performance issues]

## Test Coverage Report

- Backend: XX%
- Mobile: XX%
- Integration: XX%
- E2E: XX flows tested

## Recommendations

### Must Fix Before Production
1. [Critical issue 1]
2. [Critical issue 2]

### Should Fix Soon
1. [High priority issue 1]
2. [High priority issue 2]

### Nice to Have
1. [Medium priority improvement]

## Conclusion

[Overall assessment of platform readiness]
```

## SPECIFIC TESTING INSTRUCTIONS

### For Backend Testing:

1. **Test Every Service Method:**
   - ReferralService (12 methods)
   - WalletService (8 methods)
   - SubscriptionService (10 methods)
   - MediatorService (8 methods)
   - All 21 services total

2. **Test Every Model:**
   - User model (15+ relationships, computed properties)
   - Order model (9+ relationships, scopes)
   - All 46 models total

3. **Test Every API Endpoint:**
   - Authentication (6)
   - Users (10+)
   - Orders (20+)
   - Order Responses (10+)
   - Subscriptions (6)
   - Wallet (3)
   - Referrals (5)
   - Reviews (10+)
   - Portfolio (5)
   - Mediator (15+)
   - AI Design (5)
   - Push (4)
   - Admin (10+)

### For Mobile Testing:

1. **Test Every Component:**
   - All 60+ custom components
   - Props validation
   - Event handlers
   - Rendering with different data
   - Edge cases (empty data, errors)

2. **Test Every Screen:**
   - All 47+ screens
   - Navigation flows
   - Form validation
   - API integration
   - Error handling
   - Loading states

3. **Test Every Hook:**
   - All 37+ custom hooks
   - Return values
   - Side effects
   - Error handling
   - Dependency changes

4. **Test Redux:**
   - All actions dispatch correctly
   - All reducers update state correctly
   - Selectors return correct data
   - Persistence works
   - Middleware functions

### Critical Bug Hunting Areas:

**🚨 HIGH PRIORITY - Test These Thoroughly:**

1. **Payment Processing:**
   - Double charge prevention
   - Stripe webhook idempotency
   - Refund handling
   - Currency conversion
   - Transaction atomicity

2. **Order Management:**
   - Mutual completion logic
   - Status transitions
   - Subscription limit enforcement
   - Concurrent order operations
   - Order cancellation with payments

3. **Referral System:**
   - Cashback calculation accuracy
   - Prevent self-referral
   - Prevent circular referrals
   - Balance consistency
   - Transaction atomicity

4. **Authentication:**
   - Token expiration handling
   - Password reset security
   - Session management
   - Concurrent login prevention
   - Token revocation

5. **Authorization:**
   - Role-based access control
   - IDOR vulnerabilities
   - Privilege escalation attempts
   - Customer ↔ Executor separation
   - Admin route protection

6. **Data Integrity:**
   - Foreign key constraints
   - Cascade deletions
   - Transaction rollbacks
   - Concurrent updates
   - Race conditions

### Test Data Requirements:

Create comprehensive test data:
```
Users:
- 10 Customers (various subscription states)
- 10 Executors (verified, unverified, various ratings)
- 5 Mediators (different commission models)
- 2 Admins

Orders:
- 50 Published orders (various types, cities)
- 30 In-progress orders
- 20 Completed orders
- 10 Cancelled orders

Subscriptions:
- All 4 tariff tiers
- Active, expired, and pending subscriptions

Referrals:
- Multiple referral chains (A→B→C)
- Active and inactive referrals

Wallet Transactions:
- Deposits, charges, refunds
- Various amounts and currencies

Reviews:
- Executor reviews (1-5 stars)
- Customer reviews (1-5 stars)
```

## OUTPUT FORMAT

For each bug/issue found, provide:

```markdown
### BUG-XXX: [Short Description]

**Severity:** P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
**Component:** Backend API / Mobile iOS / Mobile Android / Database
**Type:** Functional / Security / Performance / UI

**Description:**
[Clear description of the bug]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Impact:**
[How this affects users/business]

**Evidence:**
```php
// Code snippet or API response showing the bug
```

**Recommended Fix:**
```php
// Proposed solution
```

**Test Case:**
```php
/** @test */
public function it_should_not_allow_xxx() {
    // PHPUnit test to verify fix
}
```
```

## EVALUATION CRITERIA

Rate the platform on these dimensions:

1. **Functional Correctness** (/10)
   - Do all features work as intended?
   - Are there critical bugs?

2. **Security** (/10)
   - OWASP Top 10 compliance
   - Authentication/Authorization strength
   - Data protection

3. **Performance** (/10)
   - API response times
   - Mobile app responsiveness
   - Database query efficiency

4. **Code Quality** (/10)
   - Test coverage
   - Code organization
   - Best practices adherence

5. **Reliability** (/10)
   - Error handling
   - Data consistency
   - Fault tolerance

**Overall Score:** Average of above

**Production Readiness:** Yes/No + justification

## TOOLS TO USE

- **Backend Testing:** PHPUnit, PHPStan, Laravel Pint
- **Mobile Testing:** Jest, React Testing Library, Detox
- **API Testing:** Postman/Insomnia, cURL
- **Load Testing:** Artillery, k6
- **Security:** OWASP ZAP, Burp Suite, SQLMap
- **Coverage:** PHPUnit coverage, Jest coverage
- **Static Analysis:** PHPStan, ESLint, TypeScript

## DELIVERABLES

1. **Test Suite:**
   - 200+ backend unit tests
   - 150+ mobile component tests
   - 50+ integration tests
   - 20+ E2E test scenarios

2. **Bug Reports:**
   - Categorized by severity
   - With reproduction steps
   - With proposed fixes

3. **Coverage Reports:**
   - Backend: HTML coverage report
   - Mobile: LCOV coverage report

4. **Security Audit:**
   - Vulnerability report
   - Penetration test results
   - Recommendations

5. **Performance Report:**
   - Load test results
   - Database query analysis
   - Mobile performance metrics

6. **Final Report:**
   - Executive summary
   - Overall score
   - Production readiness assessment
   - Roadmap for improvements

## SUCCESS CRITERIA

### Minimum Requirements:

- [ ] Code coverage > 70% (both backend and mobile)
- [ ] All P0 bugs fixed
- [ ] All P1 bugs documented with fix plan
- [ ] Security audit passed (no critical vulnerabilities)
- [ ] Load testing passed (meets performance targets)
- [ ] E2E tests passing on both iOS and Android
- [ ] No data corruption issues
- [ ] No authentication bypasses
- [ ] All critical flows working

### Ideal State:

- [ ] Code coverage > 80%
- [ ] All P0 and P1 bugs fixed
- [ ] Zero security vulnerabilities
- [ ] Performance exceeds targets
- [ ] Comprehensive test documentation
- [ ] Automated testing pipeline configured
- [ ] Monitoring and alerting set up

## TIMELINE

**Total Duration:** 30 working days

- Days 1-2: Analysis & Planning
- Days 3-12: Unit Testing (Backend + Mobile)
- Days 13-18: Integration Testing (All APIs)
- Days 19-23: E2E Testing (User Journeys)
- Days 24-26: Security Audit (Penetration Testing)
- Days 27-28: Performance Testing (Load & Stress)
- Day 29: Regression Testing
- Day 30: Final Report & Documentation

## BEGIN TESTING

You have access to the complete codebase at:
https://github.com/TheMacroeconomicDao/buildify-platform

**Start with Phase 1 (Analysis) and proceed systematically through all phases.**

**Document every bug, security issue, and performance problem you find.**

**Be thorough. Be systematic. Miss nothing.**

🚀 **START TESTING NOW!**
```

---

## 📋 QUICK REFERENCE COMMANDS

### Setup Test Environment

```bash
# Clone repository
git clone https://github.com/TheMacroeconomicDao/buildify-platform.git
cd buildify-platform

# Start services
make up

# Run all tests
./scripts/run-all-tests.sh

# Run security audit
./scripts/security-audit.sh
```

### Individual Test Commands

```bash
# Backend unit tests
cd backend && ./vendor/bin/phpunit --testsuite=Unit

# Backend feature tests
cd backend && ./vendor/bin/phpunit --testsuite=Feature

# Mobile tests
cd mobile && npm test

# E2E tests (iOS)
cd mobile && detox test -c ios.sim.debug

# E2E tests (Android)
cd mobile && detox test -c android.emu.debug

# Load tests
artillery run tests/load/artillery-normal-load.yml

# Security scan
npm audit
composer audit
```

---

**Prepared by:** Senior QA Engineer & Test Architect  
**Date:** October 2, 2025  
**Version:** 1.0  
**Status:** Ready for immediate execution

**This prompt is designed to be used with AI assistants (ChatGPT, Claude, etc.) for comprehensive automated testing analysis.**

