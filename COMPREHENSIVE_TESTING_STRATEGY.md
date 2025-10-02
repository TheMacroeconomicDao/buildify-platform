# Buildify Platform - Comprehensive Testing & QA Strategy

**Дата создания:** 2 октября 2025  
**Аналитик:** Senior QA Engineer & Test Architect  
**Версия документа:** 1.0  
**Цель:** Выявление всех багов, уязвимостей и проблем производительности

---

## 📋 EXECUTIVE SUMMARY

Данный документ представляет **полную стратегию тестирования** enterprise-grade marketplace платформы Buildify, включающую:

- ✅ **Backend Testing** (Laravel 11 API - 350+ endpoints)
- ✅ **Mobile Testing** (React Native - 47+ screens, 60+ components)
- ✅ **Integration Testing** (API ↔ Mobile ↔ Database)
- ✅ **Security Testing** (Penetration testing, OWASP Top 10)
- ✅ **Performance Testing** (Load testing, Stress testing)
- ✅ **E2E Testing** (Complete user journeys)

**Целевое покрытие тестами:** 70%+  
**Критичность:** HIGH - Production система требует comprehensive testing

---

## 🎯 TESTING OBJECTIVES

### Primary Goals

1. **Functional Correctness** ✅
   - Все фичи работают согласно требованиям
   - API endpoints возвращают корректные данные
   - Mobile UI отображает правильную информацию
   - Бизнес-логика выполняется корректно

2. **Data Integrity** 🔒
   - Транзакции атомарны и консистентны
   - Нет data corruption
   - Foreign keys работают правильно
   - Referential integrity сохраняется

3. **Security** 🛡️
   - Нет SQL injection уязвимостей
   - XSS protection работает
   - Authentication не обходится
   - Authorization правильно проверяется
   - Secrets не экспонируются

4. **Performance** ⚡
   - API response time < 500ms (P95)
   - Mobile app responsive (<16ms per frame)
   - Database queries optimized
   - No memory leaks

5. **User Experience** 🎨
   - UI интуитивный и понятный
   - Нет crashes или freezes
   - Error messages понятные
   - Navigation логичная

---

## 🏗️ TESTING ARCHITECTURE

### Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E Tests │  (5-10%)
                    │  (Detox)    │
                    └─────────────┘
                  ┌───────────────────┐
                  │ Integration Tests │  (20-30%)
                  │  (API + Mobile)   │
                  └───────────────────┘
              ┌─────────────────────────────┐
              │     Component Tests         │  (30-40%)
              │  (Jest + React Testing Lib) │
              └─────────────────────────────┘
          ┌───────────────────────────────────────┐
          │          Unit Tests                   │  (40-50%)
          │   (PHPUnit + Jest)                    │
          └───────────────────────────────────────┘
```

### Testing Layers

**Layer 1: Unit Tests** (40-50% coverage)
- Тестирование отдельных функций, методов, классов
- Backend: PHPUnit для Services, Models, Helpers
- Mobile: Jest для hooks, utils, reducers

**Layer 2: Component Tests** (30-40% coverage)
- Backend: API Resources, Middleware, Validators
- Mobile: React components, Screens

**Layer 3: Integration Tests** (20-30% coverage)
- API endpoint testing
- Database interactions
- External service mocking (Stripe, OpenAI)
- WebSocket communication

**Layer 4: E2E Tests** (5-10% coverage)
- Complete user flows
- Critical business scenarios
- Cross-platform testing (iOS + Android)

---

## 🔧 BACKEND TESTING STRATEGY

### 1. Unit Testing (PHPUnit)

#### 1.1 Service Layer Testing

**Target Coverage:** 80%+

**Test Files to Create:**

```php
// tests/Unit/Services/ReferralServiceTest.php
class ReferralServiceTest extends TestCase {
    
    /** @test */
    public function it_creates_referral_code_for_new_user() {
        $user = User::factory()->create();
        $service = app(ReferralService::class);
        
        $code = $service->createReferralCode($user);
        
        $this->assertNotNull($code);
        $this->assertEquals(8, strlen($code->code));
        $this->assertEquals($user->id, $code->user_id);
        $this->assertTrue($code->is_active);
    }
    
    /** @test */
    public function it_processes_cashback_correctly() {
        $referrer = User::factory()->create(['referral_balance' => 0]);
        $referred = User::factory()->create();
        
        Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'status' => 'active'
        ]);
        
        $transaction = WalletTransaction::create([
            'user_id' => $referred->id,
            'type' => 'deposit',
            'amount' => 10000, // 100 AED
        ]);
        
        $service = app(ReferralService::class);
        $cashback = $service->processCashback($transaction);
        
        $this->assertNotNull($cashback);
        $this->assertEquals(1000, $cashback->cashback_amount); // 10%
        $referrer->refresh();
        $this->assertEquals(1000, $referrer->referral_balance);
    }
    
    /** @test */
    public function it_validates_referral_code() {
        $user = User::factory()->create();
        $code = ReferralCode::create([
            'code' => 'TEST1234',
            'user_id' => $user->id,
            'is_active' => true
        ]);
        
        $service = app(ReferralService::class);
        
        // Valid code
        $this->assertTrue($service->validateCode('TEST1234'));
        
        // Invalid code
        $this->assertFalse($service->validateCode('INVALID1'));
        
        // Inactive code
        $code->update(['is_active' => false]);
        $this->assertFalse($service->validateCode('TEST1234'));
    }
}
```

```php
// tests/Unit/Services/WalletServiceTest.php
class WalletServiceTest extends TestCase {
    
    /** @test */
    public function it_deposits_funds_correctly() {
        $user = User::factory()->create(['wallet_balance' => 5000]);
        $service = app(WalletService::class);
        
        $transaction = $service->deposit($user, 10000, 'aed');
        
        $this->assertEquals(10000, $transaction->amount);
        $this->assertEquals(5000, $transaction->balance_before);
        $this->assertEquals(15000, $transaction->balance_after);
        
        $user->refresh();
        $this->assertEquals(15000, $user->wallet_balance);
    }
    
    /** @test */
    public function it_charges_user_account() {
        $user = User::factory()->create(['wallet_balance' => 10000]);
        $service = app(WalletService::class);
        
        $transaction = $service->charge($user, 3000);
        
        $user->refresh();
        $this->assertEquals(7000, $user->wallet_balance);
    }
    
    /** @test */
    public function it_throws_exception_on_insufficient_balance() {
        $user = User::factory()->create(['wallet_balance' => 1000]);
        $service = app(WalletService::class);
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Insufficient wallet balance');
        
        $service->charge($user, 5000);
    }
    
    /** @test */
    public function it_holds_funds_in_escrow() {
        $user = User::factory()->create(['wallet_balance' => 10000]);
        $order = Order::factory()->create(['max_amount' => 5000]);
        $service = app(WalletService::class);
        
        $result = $service->holdFunds($user, 5000, $order->id);
        
        $this->assertTrue($result);
        $order->refresh();
        $this->assertEquals(5000, $order->payment_held);
    }
}
```

```php
// tests/Unit/Services/SubscriptionServiceTest.php
class SubscriptionServiceTest extends TestCase {
    
    /** @test */
    public function it_activates_subscription_correctly() {
        $user = User::factory()->create();
        $tariff = Tariff::factory()->create([
            'price' => 9900,
            'duration_days' => 30,
            'max_orders' => 5,
            'max_contacts' => 20
        ]);
        
        $service = app(SubscriptionService::class);
        $service->activateSubscription($user, $tariff);
        
        $user->refresh();
        $this->assertEquals($tariff->id, $user->current_tariff_id);
        $this->assertNotNull($user->subscription_started_at);
        $this->assertNotNull($user->subscription_ends_at);
        $this->assertEquals(0, $user->used_orders_count);
        $this->assertEquals(0, $user->used_contacts_count);
    }
    
    /** @test */
    public function it_checks_if_user_can_create_order() {
        $tariff = Tariff::factory()->create(['max_orders' => 5]);
        $user = User::factory()->create([
            'current_tariff_id' => $tariff->id,
            'used_orders_count' => 3,
            'subscription_ends_at' => now()->addDays(10)
        ]);
        
        $service = app(SubscriptionService::class);
        
        $this->assertTrue($service->canCreateOrder($user));
        
        // Exceeded limit
        $user->update(['used_orders_count' => 5]);
        $this->assertFalse($service->canCreateOrder($user));
        
        // Expired subscription
        $user->update([
            'used_orders_count' => 3,
            'subscription_ends_at' => now()->subDays(1)
        ]);
        $this->assertFalse($service->canCreateOrder($user));
    }
}
```

```php
// tests/Unit/Services/MediatorServiceTest.php
class MediatorServiceTest extends TestCase {
    
    /** @test */
    public function it_calculates_commission_with_fixed_fee() {
        $mediator = User::factory()->create([
            'type' => 2,
            'mediator_fixed_fee' => 500.00
        ]);
        $order = Order::factory()->create(['max_amount' => 10000]);
        
        $service = app(MediatorService::class);
        $commission = $service->calculateCommission($order, $mediator);
        
        $this->assertEquals(500.00, $commission);
    }
    
    /** @test */
    public function it_calculates_commission_with_percentage() {
        $mediator = User::factory()->create([
            'type' => 2,
            'mediator_margin_percentage' => 15.0
        ]);
        $order = Order::factory()->create(['max_amount' => 10000]);
        
        $service = app(MediatorService::class);
        $commission = $service->calculateCommission($order, $mediator);
        
        $this->assertEquals(1500.00, $commission);
    }
    
    /** @test */
    public function it_uses_default_commission_when_not_set() {
        $mediator = User::factory()->create(['type' => 2]);
        $order = Order::factory()->create(['max_amount' => 10000]);
        
        $service = app(MediatorService::class);
        $commission = $service->calculateCommission($order, $mediator);
        
        // Default 10%
        $this->assertEquals(1000.00, $commission);
    }
}
```

#### 1.2 Model Testing

```php
// tests/Unit/Models/UserTest.php
class UserTest extends TestCase {
    
    /** @test */
    public function it_creates_user_with_default_values() {
        $user = User::factory()->create();
        
        $this->assertNotNull($user->id);
        $this->assertEquals(0, $user->wallet_balance);
        $this->assertEquals('aed', $user->wallet_currency);
        $this->assertEquals(0, $user->referral_balance);
    }
    
    /** @test */
    public function it_recalculates_executor_rating() {
        $executor = User::factory()->create(['type' => 0]);
        
        // Create reviews
        ExecutorReview::factory()->count(3)->create([
            'executor_id' => $executor->id,
            'rating' => 5
        ]);
        ExecutorReview::factory()->count(2)->create([
            'executor_id' => $executor->id,
            'rating' => 4
        ]);
        
        $executor->recalculateRating();
        
        // (5*3 + 4*2) / 5 = 4.6
        $this->assertEquals(4.6, $executor->executor_rating);
        $this->assertEquals(5, $executor->executor_reviews_count);
    }
    
    /** @test */
    public function it_has_active_subscription() {
        $user = User::factory()->create([
            'subscription_ends_at' => now()->addDays(10)
        ]);
        
        $this->assertTrue($user->hasActiveSubscription());
        
        $user->update(['subscription_ends_at' => now()->subDays(1)]);
        $this->assertFalse($user->hasActiveSubscription());
    }
}
```

```php
// tests/Unit/Models/OrderTest.php
class OrderTest extends TestCase {
    
    /** @test */
    public function it_creates_order_with_required_fields() {
        $customer = User::factory()->create(['type' => 1]);
        
        $order = Order::create([
            'author_id' => $customer->id,
            'title' => 'Test Order',
            'work_direction' => 1,
            'work_type' => 1,
            'city' => 'Dubai',
            'max_amount' => 5000,
            'status' => 'draft'
        ]);
        
        $this->assertNotNull($order->id);
        $this->assertEquals('draft', $order->status);
        $this->assertEquals($customer->id, $order->author_id);
    }
    
    /** @test */
    public function it_can_be_completed_by_both_parties() {
        $executor = User::factory()->create(['type' => 0]);
        $customer = User::factory()->create(['type' => 1]);
        
        $order = Order::factory()->create([
            'author_id' => $customer->id,
            'executor_id' => $executor->id,
            'status' => 'in_progress'
        ]);
        
        // Executor completes
        $order->update([
            'completed_by_executor' => true,
            'executor_completed_at' => now()
        ]);
        
        $this->assertTrue($order->completed_by_executor);
        $this->assertEquals('in_progress', $order->status);
        
        // Customer completes
        $order->update([
            'completed_by_customer' => true,
            'customer_completed_at' => now()
        ]);
        
        $order->markAsCompleted();
        
        $this->assertEquals('completed', $order->status);
    }
}
```

### 2. Integration Testing (Feature Tests)

#### 2.1 Authentication Flow

```php
// tests/Feature/AuthenticationTest.php
class AuthenticationTest extends TestCase {
    
    /** @test */
    public function user_can_register_with_valid_data() {
        // Step 1: Start registration
        $response = $this->postJson('/api/registration/start', [
            'phone' => '+971501234567',
            'email' => 'test@example.com',
            'name' => 'Test User',
            'type' => 1 // Customer
        ]);
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => ['code_sent', 'verification_id']
        ]);
        
        $verificationId = $response->json('data.verification_id');
        
        // Step 2: Complete registration
        $completeResponse = $this->postJson('/api/registration/end', [
            'verification_id' => $verificationId,
            'code' => '1234', // Mock code
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!'
        ]);
        
        $completeResponse->assertStatus(201);
        $completeResponse->assertJsonStructure([
            'data' => ['user', 'token']
        ]);
        
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'phone' => '+971501234567',
            'type' => 1
        ]);
    }
    
    /** @test */
    public function user_cannot_register_with_existing_email() {
        User::factory()->create(['email' => 'existing@example.com']);
        
        $response = $this->postJson('/api/registration/start', [
            'phone' => '+971501234567',
            'email' => 'existing@example.com',
            'name' => 'Test User',
            'type' => 1
        ]);
        
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }
    
    /** @test */
    public function user_can_login_with_valid_credentials() {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('password123')
        ]);
        
        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'password123'
        ]);
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['user', 'token']
        ]);
    }
    
    /** @test */
    public function user_cannot_login_with_invalid_credentials() {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('password123')
        ]);
        
        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'wrongpassword'
        ]);
        
        $response->assertStatus(401);
    }
    
    /** @test */
    public function authenticated_user_can_logout() {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        
        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/logout');
        
        $response->assertStatus(200);
        $this->assertEquals(0, $user->tokens()->count());
    }
}
```

#### 2.2 Order Lifecycle Testing

```php
// tests/Feature/OrderLifecycleTest.php
class OrderLifecycleTest extends TestCase {
    
    /** @test */
    public function complete_order_workflow_from_creation_to_completion() {
        // Setup users
        $customer = User::factory()->create(['type' => 1]);
        $executor = User::factory()->create([
            'type' => 0,
            'verification_status' => 'verified'
        ]);
        
        // Give customer subscription
        $tariff = Tariff::factory()->create([
            'max_orders' => 10,
            'max_contacts' => 20
        ]);
        $customer->update([
            'current_tariff_id' => $tariff->id,
            'subscription_ends_at' => now()->addDays(30)
        ]);
        
        // Step 1: Customer creates order
        $createResponse = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/orders', [
                'title' => 'Bathroom Renovation',
                'description' => 'Need complete bathroom renovation',
                'work_direction' => 1,
                'work_type' => 1,
                'city' => 'Dubai',
                'address' => 'Downtown Dubai',
                'max_amount' => 15000,
                'status' => 'published'
            ]);
        
        $createResponse->assertStatus(201);
        $orderId = $createResponse->json('data.id');
        
        // Step 2: Executor submits response
        $responseData = $this->actingAs($executor, 'sanctum')
            ->postJson("/api/orders/{$orderId}/responses", [
                'executor_cost' => 12000,
                'comment' => 'I can complete this in 2 weeks',
                'estimated_days' => 14
            ]);
        
        $responseData->assertStatus(201);
        $responseId = $responseData->json('data.id');
        
        // Step 3: Customer selects executor
        $selectResponse = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/orders/{$orderId}/responses/{$responseId}/select");
        
        $selectResponse->assertStatus(200);
        
        $order = Order::find($orderId);
        $this->assertEquals($executor->id, $order->executor_id);
        $this->assertEquals('in_progress', $order->status);
        
        // Step 4: Executor completes work
        $completeExecutor = $this->actingAs($executor, 'sanctum')
            ->postJson("/api/orders/{$orderId}/complete");
        
        $completeExecutor->assertStatus(200);
        
        $order->refresh();
        $this->assertTrue($order->completed_by_executor);
        $this->assertNotNull($order->executor_completed_at);
        
        // Step 5: Customer accepts work
        $acceptResponse = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/orders/{$orderId}/accept");
        
        $acceptResponse->assertStatus(200);
        
        $order->refresh();
        $this->assertTrue($order->completed_by_customer);
        $this->assertNotNull($order->customer_completed_at);
        $this->assertEquals('completed', $order->status);
        
        // Step 6: Customer leaves review
        $reviewResponse = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/executor-reviews", [
                'executor_id' => $executor->id,
                'order_id' => $orderId,
                'rating' => 5,
                'text' => 'Excellent work!'
            ]);
        
        $reviewResponse->assertStatus(201);
        
        $this->assertDatabaseHas('executor_reviews', [
            'executor_id' => $executor->id,
            'author_id' => $customer->id,
            'order_id' => $orderId,
            'rating' => 5
        ]);
    }
    
    /** @test */
    public function customer_cannot_create_order_without_active_subscription() {
        $customer = User::factory()->create([
            'type' => 1,
            'subscription_ends_at' => now()->subDays(1)
        ]);
        
        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/orders', [
                'title' => 'Test Order',
                'work_direction' => 1,
                'work_type' => 1,
                'city' => 'Dubai',
                'max_amount' => 5000
            ]);
        
        $response->assertStatus(403);
    }
}
```

#### 2.3 Subscription Flow Testing

```php
// tests/Feature/SubscriptionFlowTest.php
class SubscriptionFlowTest extends TestCase {
    
    /** @test */
    public function user_can_purchase_subscription_via_stripe() {
        $user = User::factory()->create();
        $tariff = Tariff::factory()->create([
            'stripe_product_id' => 'prod_test',
            'stripe_price_id' => 'price_test',
            'price' => 9900
        ]);
        
        // Mock Stripe
        Stripe::fake();
        
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscription/pay', [
                'tariff_id' => $tariff->id
            ]);
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['checkout_url', 'session_id']
        ]);
    }
    
    /** @test */
    public function subscription_activates_after_successful_payment() {
        $user = User::factory()->create();
        $tariff = Tariff::factory()->create([
            'price' => 9900,
            'duration_days' => 30,
            'max_orders' => 5
        ]);
        
        // Simulate Stripe webhook
        $response = $this->postJson('/stripe/webhook', [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'customer' => $user->stripe_id,
                    'metadata' => [
                        'user_id' => $user->id,
                        'tariff_id' => $tariff->id
                    ]
                ]
            ]
        ]);
        
        $user->refresh();
        $this->assertEquals($tariff->id, $user->current_tariff_id);
        $this->assertNotNull($user->subscription_started_at);
    }
}
```

#### 2.4 Referral System Testing

```php
// tests/Feature/ReferralSystemTest.php
class ReferralSystemTest extends TestCase {
    
    /** @test */
    public function new_user_gets_referral_code_automatically() {
        $user = User::factory()->create();
        
        $this->assertDatabaseHas('referral_codes', [
            'user_id' => $user->id,
            'is_active' => true
        ]);
        
        $code = $user->referralCode;
        $this->assertEquals(8, strlen($code->code));
    }
    
    /** @test */
    public function user_can_register_with_referral_code() {
        $referrer = User::factory()->create();
        $referralCode = ReferralCode::create([
            'code' => 'REF12345',
            'user_id' => $referrer->id,
            'is_active' => true
        ]);
        
        // Register with referral code
        $response = $this->postJson('/api/registration/start', [
            'phone' => '+971501234567',
            'email' => 'referred@example.com',
            'name' => 'Referred User',
            'type' => 1,
            'referral_code' => 'REF12345'
        ]);
        
        $response->assertStatus(200);
        
        // Complete registration
        // ... (verification code process)
        
        $referred = User::where('email', 'referred@example.com')->first();
        
        $this->assertDatabaseHas('referrals', [
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'status' => 'active'
        ]);
    }
    
    /** @test */
    public function referrer_gets_cashback_when_referred_deposits() {
        $referrer = User::factory()->create(['referral_balance' => 0]);
        $referred = User::factory()->create();
        
        Referral::create([
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'status' => 'active'
        ]);
        
        // Referred user deposits 100 AED (10000 cents)
        $walletService = app(WalletService::class);
        $walletService->deposit($referred, 10000, 'aed');
        
        // Check cashback (10% = 1000 cents)
        $referrer->refresh();
        $this->assertEquals(1000, $referrer->referral_balance);
        
        $this->assertDatabaseHas('referral_transactions', [
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'cashback_amount' => 1000,
            'status' => 'processed'
        ]);
    }
}
```

### 3. API Endpoint Testing

**Тестировать ВСЕ 350+ endpoints:**

```php
// tests/Feature/Api/OrderApiTest.php
class OrderApiTest extends TestCase {
    
    /** @test */
    public function it_returns_paginated_orders() {
        Order::factory()->count(25)->create(['status' => 'published']);
        
        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/orders?page=1&per_page=20');
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'title', 'status', 'city']
            ],
            'meta' => ['total', 'per_page', 'current_page']
        ]);
        
        $this->assertCount(20, $response->json('data'));
    }
    
    /** @test */
    public function it_filters_orders_by_status() {
        Order::factory()->count(10)->create(['status' => 'published']);
        Order::factory()->count(5)->create(['status' => 'completed']);
        
        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/orders?status=published');
        
        $response->assertStatus(200);
        $data = $response->json('data');
        
        $this->assertTrue(count($data) >= 10);
        foreach ($data as $order) {
            $this->assertEquals('published', $order['status']);
        }
    }
    
    /** @test */
    public function it_returns_order_with_relations() {
        $customer = User::factory()->create(['type' => 1]);
        $executor = User::factory()->create(['type' => 0]);
        
        $order = Order::factory()->create([
            'author_id' => $customer->id,
            'executor_id' => $executor->id
        ]);
        
        $response = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/orders/{$order->id}");
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'author' => ['id', 'name', 'email'],
                'executor' => ['id', 'name', 'rating'],
                'orderResponses'
            ]
        ]);
    }
}
```

#### 3.1 Critical API Endpoints Checklist

**Authentication (6 endpoints):**
- [ ] POST /api/login
- [ ] POST /api/logout
- [ ] POST /api/registration/start
- [ ] POST /api/registration/end
- [ ] POST /api/password-recovery
- [ ] POST /api/change-password

**Orders (20+ endpoints):**
- [ ] GET /api/orders (with filters, pagination)
- [ ] POST /api/orders (validation, subscription check)
- [ ] GET /api/orders/{id} (with relations)
- [ ] POST /api/orders/{id} (update, authorization)
- [ ] POST /api/orders/{id}/cancel
- [ ] POST /api/orders/{id}/complete (executor only)
- [ ] POST /api/orders/{id}/accept (customer only)
- [ ] POST /api/orders/{id}/reject (customer only)

**Order Responses (10+ endpoints):**
- [ ] GET /api/orders/{orderId}/responses
- [ ] POST /api/orders/{orderId}/responses (verification check)
- [ ] POST /api/orders/{orderId}/responses/{id}/select
- [ ] POST /api/orders/{orderId}/responses/{id}/reject
- [ ] POST /api/orders/{orderId}/responses/{id}/send-contact
- [ ] POST /api/orders/{orderId}/responses/{id}/revoke

**Subscriptions (6 endpoints):**
- [ ] GET /api/subscription/get-all
- [ ] GET /api/subscription/get
- [ ] POST /api/subscription/pay (Stripe integration)
- [ ] POST /api/subscription/cancel
- [ ] GET /api/subscriptions/my
- [ ] POST /api/subscriptions/{tariff}/checkout

**Wallet (3 endpoints):**
- [ ] GET /api/wallet/me
- [ ] POST /api/wallet/topup (Stripe integration)
- [ ] GET /api/wallet/transactions

**Referrals (5 endpoints):**
- [ ] GET /api/referrals/my-stats
- [ ] GET /api/referrals/my-referrals
- [ ] GET /api/referrals/my-code
- [ ] POST /api/referrals/use-balance
- [ ] POST /api/referrals/validate-code

**Reviews (10+ endpoints):**
- [ ] POST /api/executor-reviews
- [ ] GET /api/executor-reviews/executor/{id}
- [ ] POST /api/customer-reviews
- [ ] GET /api/customer-reviews/customer/{id}
- [ ] POST /api/executor-reviews/{id}/reply
- [ ] POST /api/customer-reviews/{id}/reply

### 4. Database Testing

```php
// tests/Feature/DatabaseIntegrityTest.php
class DatabaseIntegrityTest extends TestCase {
    
    /** @test */
    public function foreign_keys_cascade_properly() {
        $user = User::factory()->create();
        $order = Order::factory()->create(['author_id' => $user->id]);
        OrderAttachment::factory()->count(3)->create(['order_id' => $order->id]);
        
        $this->assertEquals(3, $order->attachments()->count());
        
        // Delete order
        $order->delete();
        
        // Attachments should also be deleted (cascade)
        $this->assertEquals(0, OrderAttachment::where('order_id', $order->id)->count());
    }
    
    /** @test */
    public function unique_constraints_are_enforced() {
        $user = User::factory()->create(['email' => 'unique@example.com']);
        
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        User::factory()->create(['email' => 'unique@example.com']);
    }
    
    /** @test */
    public function indexes_improve_query_performance() {
        // Create 1000 orders
        Order::factory()->count(1000)->create();
        
        // Query with indexed column should be fast
        $start = microtime(true);
        Order::where('status', 'published')->get();
        $time = microtime(true) - $start;
        
        $this->assertLessThan(0.1, $time); // < 100ms
    }
}
```

---

## 📱 MOBILE TESTING STRATEGY

### 1. Component Testing (Jest + React Testing Library)

```javascript
// __tests__/components/OrderCard.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OrderCard from '../../src/components/OrderCard';

describe('OrderCard Component', () => {
  const mockOrder = {
    id: 1,
    title: 'Bathroom Renovation',
    city: 'Dubai',
    max_amount: 15000,
    status: 'published',
    work_direction: 'Renovation',
    created_at: '2025-10-01T10:00:00Z'
  };
  
  it('renders order information correctly', () => {
    const { getByText } = render(<OrderCard order={mockOrder} />);
    
    expect(getByText('Bathroom Renovation')).toBeTruthy();
    expect(getByText('Dubai')).toBeTruthy();
    expect(getByText(/15000/)).toBeTruthy();
  });
  
  it('calls onPress when card is tapped', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <OrderCard order={mockOrder} onPress={onPressMock} />
    );
    
    fireEvent.press(getByTestId('order-card'));
    
    expect(onPressMock).toHaveBeenCalledWith(mockOrder.id);
  });
  
  it('displays correct status badge', () => {
    const { getByText } = render(<OrderCard order={mockOrder} />);
    
    expect(getByText('Published')).toBeTruthy();
  });
  
  it('formats currency correctly', () => {
    const { getByText } = render(<OrderCard order={mockOrder} />);
    
    expect(getByText('150.00 AED')).toBeTruthy();
  });
});
```

```javascript
// __tests__/components/TariffCard.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TariffCard from '../../src/components/TariffCard';

describe('TariffCard Component', () => {
  const mockTariff = {
    id: 1,
    name: 'Pro',
    price: 29900,
    duration_days: 30,
    max_orders: 20,
    max_contacts: 100
  };
  
  it('renders tariff details', () => {
    const { getByText } = render(<TariffCard tariff={mockTariff} />);
    
    expect(getByText('Pro')).toBeTruthy();
    expect(getByText('299.00 AED')).toBeTruthy();
    expect(getByText(/20 orders/)).toBeTruthy();
    expect(getByText(/100 contacts/)).toBeTruthy();
  });
  
  it('highlights current tariff', () => {
    const { getByTestId } = render(
      <TariffCard tariff={mockTariff} isCurrentTariff={true} />
    );
    
    const card = getByTestId('tariff-card');
    expect(card.props.style).toContainEqual(
      expect.objectContaining({ borderColor: expect.any(String) })
    );
  });
  
  it('handles select button press', () => {
    const onSelectMock = jest.fn();
    const { getByText } = render(
      <TariffCard tariff={mockTariff} onSelect={onSelectMock} />
    );
    
    fireEvent.press(getByText('Select'));
    
    expect(onSelectMock).toHaveBeenCalledWith(mockTariff.id);
  });
});
```

### 2. Hook Testing

```javascript
// __tests__/hooks/useAuth.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import useAuth from '../../src/hooks/useAuth';

const mockStore = configureMockStore();

describe('useAuth Hook', () => {
  let store;
  
  beforeEach(() => {
    store = mockStore({
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      }
    });
  });
  
  it('returns authentication state', () => {
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
  
  it('handles login correctly', async () => {
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login('user@example.com', 'password');
    });
    
    const actions = store.getActions();
    expect(actions[0].type).toBe('LOGIN_REQUEST');
  });
});
```

### 3. Redux Testing

```javascript
// __tests__/redux/reducers/auth.test.js
import authReducer from '../../../src/redux/reducers/auth';

describe('Auth Reducer', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  };
  
  it('returns initial state', () => {
    expect(authReducer(undefined, {})).toEqual(initialState);
  });
  
  it('handles LOGIN_REQUEST', () => {
    const action = { type: 'LOGIN_REQUEST' };
    const state = authReducer(initialState, action);
    
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });
  
  it('handles LOGIN_SUCCESS', () => {
    const user = { id: 1, email: 'user@example.com' };
    const token = 'mock_token';
    
    const action = {
      type: 'LOGIN_SUCCESS',
      payload: { user, token }
    };
    
    const state = authReducer(initialState, action);
    
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.token).toEqual(token);
    expect(state.isLoading).toBe(false);
  });
  
  it('handles LOGIN_FAILURE', () => {
    const error = 'Invalid credentials';
    const action = {
      type: 'LOGIN_FAILURE',
      payload: error
    };
    
    const state = authReducer(initialState, action);
    
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toEqual(error);
    expect(state.isLoading).toBe(false);
  });
});
```

### 4. E2E Testing (Detox)

```javascript
// e2e/orderFlow.test.js
describe('Complete Order Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });
  
  it('should complete full order creation to completion flow', async () => {
    // Step 1: Login
    await element(by.id('email-input')).typeText('customer@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Step 2: Navigate to Create Order
    await element(by.id('create-order-button')).tap();
    
    // Step 3: Fill order form
    await element(by.id('order-title-input')).typeText('Bathroom Renovation');
    await element(by.id('order-description-input')).typeText('Need complete renovation');
    await element(by.id('work-type-select')).tap();
    await element(by.text('Renovation')).tap();
    await element(by.id('city-input')).typeText('Dubai');
    await element(by.id('max-amount-input')).typeText('15000');
    
    // Step 4: Submit order
    await element(by.id('submit-order-button')).tap();
    
    await waitFor(element(by.text('Order created successfully')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Step 5: Verify order appears in My Orders
    await element(by.id('my-orders-tab')).tap();
    await expect(element(by.text('Bathroom Renovation'))).toBeVisible();
  });
  
  it('should handle executor response submission', async () => {
    // Login as executor
    await device.launchApp({ newInstance: true });
    await element(by.id('email-input')).typeText('executor@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Navigate to orders
    await element(by.id('search-orders-tab')).tap();
    
    // Select an order
    await element(by.id('order-card-1')).tap();
    
    // Submit response
    await element(by.id('submit-response-button')).tap();
    await element(by.id('executor-cost-input')).typeText('12000');
    await element(by.id('comment-input')).typeText('Can complete in 2 weeks');
    await element(by.id('confirm-response-button')).tap();
    
    await waitFor(element(by.text('Response submitted')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

---

## 🔒 SECURITY TESTING

### 1. Authentication & Authorization

**Test Cases:**

```php
// tests/Feature/Security/AuthorizationTest.php
class AuthorizationTest extends TestCase {
    
    /** @test */
    public function unauthorized_user_cannot_access_protected_routes() {
        $response = $this->getJson('/api/orders');
        $response->assertStatus(401);
    }
    
    /** @test */
    public function user_cannot_access_other_users_data() {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $order = Order::factory()->create(['author_id' => $user1->id]);
        
        $response = $this->actingAs($user2, 'sanctum')
            ->postJson("/api/orders/{$order->id}", [
                'title' => 'Modified Title'
            ]);
        
        $response->assertStatus(403);
    }
    
    /** @test */
    public function customer_cannot_access_executor_only_endpoints() {
        $customer = User::factory()->create(['type' => 1]);
        $order = Order::factory()->create();
        
        $response = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/orders/{$order->id}/responses", [
                'executor_cost' => 5000,
                'comment' => 'Test'
            ]);
        
        $response->assertStatus(403);
    }
    
    /** @test */
    public function unverified_executor_cannot_submit_responses() {
        $executor = User::factory()->create([
            'type' => 0,
            'verification_status' => 'pending'
        ]);
        $order = Order::factory()->create();
        
        $response = $this->actingAs($executor, 'sanctum')
            ->postJson("/api/orders/{$order->id}/responses", [
                'executor_cost' => 5000,
                'comment' => 'Test'
            ]);
        
        $response->assertStatus(403);
    }
    
    /** @test */
    public function non_admin_cannot_access_admin_endpoints() {
        $user = User::factory()->create(['type' => 1]);
        
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/executors/pending');
        
        $response->assertStatus(403);
    }
}
```

### 2. SQL Injection Protection

```php
// tests/Feature/Security/SqlInjectionTest.php
class SqlInjectionTest extends TestCase {
    
    /** @test */
    public function api_is_protected_from_sql_injection_in_search() {
        $user = User::factory()->create();
        
        $maliciousInput = "'; DROP TABLE users; --";
        
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/orders?search=' . urlencode($maliciousInput));
        
        // Should not crash, should return empty or sanitized results
        $response->assertStatus(200);
        
        // Table should still exist
        $this->assertTrue(Schema::hasTable('users'));
    }
    
    /** @test */
    public function order_creation_sanitizes_input() {
        $customer = User::factory()->create(['type' => 1]);
        
        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/orders', [
                'title' => "<script>alert('xss')</script>",
                'description' => "'; DELETE FROM orders; --",
                'work_direction' => 1,
                'work_type' => 1,
                'city' => 'Dubai',
                'max_amount' => 5000
            ]);
        
        if ($response->status() === 201) {
            $order = Order::find($response->json('data.id'));
            // Should be sanitized
            $this->assertStringNotContainsString('<script>', $order->title);
        }
    }
}
```

### 3. XSS Protection

```php
// tests/Feature/Security/XssProtectionTest.php
class XssProtectionTest extends TestCase {
    
    /** @test */
    public function user_input_is_sanitized_against_xss() {
        $user = User::factory()->create();
        
        $xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
            '<iframe src="javascript:alert(\'XSS\')"></iframe>'
        ];
        
        foreach ($xssPayloads as $payload) {
            $response = $this->actingAs($user, 'sanctum')
                ->postJson('/api/user/edit', [
                    'about_me' => $payload
                ]);
            
            if ($response->status() === 200) {
                $user->refresh();
                $this->assertStringNotContainsString('<script>', $user->about_me);
                $this->assertStringNotContainsString('javascript:', $user->about_me);
            }
        }
    }
}
```

---

## ⚡ PERFORMANCE TESTING

### 1. Load Testing (Artillery / K6)

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Spike test"
      
scenarios:
  - name: "Order Search Flow"
    flow:
      - post:
          url: "/api/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.data.token"
              as: "token"
      - get:
          url: "/api/orders"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
            - contentType: json
      - think: 2
      - get:
          url: "/api/orders/{{ $randomNumber(1, 100) }}"
          headers:
            Authorization: "Bearer {{ token }}"
```

```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'errors': ['rate<0.1'],              // Error rate should be below 10%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function() {
  // Login
  const loginRes = http.post(`${BASE_URL}/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'password'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('data.token') !== undefined,
  }) || errorRate.add(1);
  
  const token = loginRes.json('data.token');
  
  // Get orders
  const ordersRes = http.get(`${BASE_URL}/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });
  
  check(ordersRes, {
    'orders retrieved': (r) => r.status === 200,
    'has data array': (r) => Array.isArray(r.json('data')),
  }) || errorRate.add(1);
  
  sleep(1);
}
```

### 2. Database Performance

```php
// tests/Feature/Performance/DatabasePerformanceTest.php
class DatabasePerformanceTest extends TestCase {
    
    /** @test */
    public function order_search_query_is_optimized() {
        // Create test data
        User::factory()->count(100)->create(['type' => 1]);
        Order::factory()->count(500)->create();
        
        // Enable query logging
        DB::enableQueryLog();
        
        $user = User::first();
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/orders?city=Dubai&status=published');
        
        $queries = DB::getQueryLog();
        
        // Should not have N+1 queries
        $this->assertLessThan(10, count($queries), 'Too many queries executed');
        
        $response->assertStatus(200);
    }
    
    /** @test */
    public function order_with_relations_uses_eager_loading() {
        $order = Order::factory()->create();
        OrderResponse::factory()->count(5)->create(['order_id' => $order->id]);
        
        DB::enableQueryLog();
        
        $user = User::factory()->create();
        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/orders/{$order->id}");
        
        $queries = DB::getQueryLog();
        
        // With eager loading, should be ~2-3 queries
        // Without, would be 6+ queries (N+1)
        $this->assertLessThan(5, count($queries));
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['orderResponses']
        ]);
    }
}
```

---

## 🧪 TESTING EXECUTION PLAN

### Phase 1: Setup Testing Environment (Day 1-2)

**Backend:**
```bash
# Install testing dependencies
cd backend
composer require --dev phpunit/phpunit
composer require --dev mockery/mockery
composer require --dev pestphp/pest

# Configure PHPUnit
cp phpunit.xml.example phpunit.xml

# Create test database
createdb buildify_test

# Configure .env.testing
cp .env .env.testing
# Set DB_DATABASE=buildify_test
```

**Mobile:**
```bash
# Install testing dependencies
cd mobile
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/react-hooks
npm install --save-dev jest-expo
npm install --save-dev detox

# Configure Detox
detox init

# Create test configuration
```

### Phase 2: Write Unit Tests (Day 3-10)

**Priority Order:**

1. **Critical Services** (Day 3-4)
   - [ ] ReferralService (100% coverage)
   - [ ] WalletService (100% coverage)
   - [ ] SubscriptionService (100% coverage)
   - [ ] MediatorService (100% coverage)

2. **Core Models** (Day 5-6)
   - [ ] User model (90% coverage)
   - [ ] Order model (90% coverage)
   - [ ] OrderResponse model (80% coverage)
   - [ ] Tariff model (80% coverage)

3. **Utilities & Helpers** (Day 7)
   - [ ] All helper functions
   - [ ] Utility classes
   - [ ] Custom validators

4. **Mobile Hooks** (Day 8-9)
   - [ ] useAuth (100%)
   - [ ] useOrders (100%)
   - [ ] useSubscription (100%)
   - [ ] useWallet (100%)
   - [ ] useReferrals (100%)

5. **Redux** (Day 10)
   - [ ] All reducers (100%)
   - [ ] All actions (100%)

### Phase 3: Integration Tests (Day 11-15)

**API Endpoints Testing:**

```php
// tests/Feature/Api/CompleteApiTest.php
class CompleteApiTest extends TestCase {
    
    /** @test */
    public function test_all_authentication_endpoints() {
        // POST /api/login
        // POST /api/logout
        // POST /api/registration/start
        // POST /api/registration/end
        // POST /api/password-recovery
        // POST /api/change-password
    }
    
    /** @test */
    public function test_all_order_endpoints() {
        // GET /api/orders
        // POST /api/orders
        // GET /api/orders/{id}
        // POST /api/orders/{id}
        // POST /api/orders/{id}/cancel
        // ... (all 20+ endpoints)
    }
    
    /** @test */
    public function test_all_subscription_endpoints() {
        // All 6 subscription endpoints
    }
    
    /** @test */
    public function test_all_wallet_endpoints() {
        // All 3 wallet endpoints
    }
    
    /** @test */
    public function test_all_referral_endpoints() {
        // All 5 referral endpoints
    }
}
```

### Phase 4: Component Tests (Day 16-20)

**Mobile Components:**

- [ ] OrderCard (full coverage)
- [ ] TariffCard (full coverage)
- [ ] ReviewCard (full coverage)
- [ ] NotificationItem (full coverage)
- [ ] StandardButton (full coverage)
- [ ] StandardInput (full coverage)
- [ ] All 60+ components

### Phase 5: E2E Tests (Day 21-25)

**Critical User Journeys:**

1. **Customer Journey:**
   - Registration → Login → Create Order → Review Responses → Select Executor → Complete → Leave Review

2. **Executor Journey:**
   - Registration → Verification → Browse Orders → Submit Response → Get Selected → Complete Work → Receive Payment

3. **Mediator Journey:**
   - Login → Take Order → Search Executor → Monitor Progress → Complete → Receive Commission

4. **Subscription Journey:**
   - Select Tariff → Pay via Stripe → Subscription Activated → Use Features → Renewal

### Phase 6: Security Audit (Day 26-28)

**OWASP Top 10 Testing:**

1. **Injection** ✅
   - SQL Injection testing
   - NoSQL Injection (if applicable)
   - Command Injection

2. **Broken Authentication** ✅
   - Password policy testing
   - Session management
   - Token expiration

3. **Sensitive Data Exposure** ✅
   - Check for exposed secrets
   - HTTPS enforcement
   - Encrypted storage

4. **XML External Entities (XXE)** ⚠️
   - Not applicable (JSON API)

5. **Broken Access Control** ✅
   - Authorization testing
   - IDOR vulnerabilities
   - Privilege escalation

6. **Security Misconfiguration** ✅
   - Default credentials
   - Error messages exposure
   - CORS configuration

7. **Cross-Site Scripting (XSS)** ✅
   - Reflected XSS
   - Stored XSS
   - DOM-based XSS

8. **Insecure Deserialization** ⚠️
   - JSON payload validation

9. **Using Components with Known Vulnerabilities** ✅
   - `composer audit`
   - `npm audit`
   - Dependency scanning

10. **Insufficient Logging & Monitoring** ✅
    - Error logging
    - Security event logging
    - Audit trails

### Phase 7: Performance Testing (Day 29-30)

**Load Testing Scenarios:**

```bash
# Scenario 1: Normal Load
artillery run artillery-normal-load.yml

# Scenario 2: Peak Load
artillery run artillery-peak-load.yml

# Scenario 3: Stress Test
artillery run artillery-stress-test.yml

# Scenario 4: Spike Test
artillery run artillery-spike-test.yml

# Scenario 5: Endurance Test (24 hours)
artillery run artillery-endurance-test.yml
```

---

## 🐛 BUG HUNTING CHECKLIST

### Critical Bugs to Look For

#### Backend

**Authentication & Authorization:**
- [ ] Можно ли обойти аутентификацию?
- [ ] Токены истекают правильно?
- [ ] Можно ли получить доступ к чужим данным?
- [ ] Password reset безопасен?
- [ ] Можно ли создать admin пользователя через API?

**Order Management:**
- [ ] Можно ли создать заказ без подписки?
- [ ] Можно ли превысить лимиты подписки?
- [ ] Mutual completion работает правильно?
- [ ] Статусы меняются корректно?
- [ ] Можно ли отменить завершенный заказ?

**Payment System:**
- [ ] Двойное списание средств возможно?
- [ ] Можно ли пополнить кошелек на отрицательную сумму?
- [ ] Escrow работает корректно?
- [ ] Stripe webhooks обрабатываются правильно?
- [ ] Можно ли потратить больше, чем на балансе?

**Referral System:**
- [ ] Кэшбэк начисляется правильно?
- [ ] Можно ли использовать referral code несколько раз?
- [ ] Можно ли получить cashback за свои депозиты?
- [ ] Circular referrals обрабатываются?

**Subscription System:**
- [ ] Подписка истекает правильно?
- [ ] Можно ли создать заказ после истечения?
- [ ] Счетчики использования работают?
- [ ] Можно ли отменить подписку и вернуть деньги?

#### Mobile

**Authentication:**
- [ ] Token сохраняется в secure storage?
- [ ] Auto-logout работает при 401?
- [ ] Можно ли использовать app без логина?

**Navigation:**
- [ ] Deep links работают?
- [ ] Back button работает корректно?
- [ ] Tab navigation не сбрасывает state?
- [ ] Modal dialogs закрываются правильно?

**Forms:**
- [ ] Validation работает на всех полях?
- [ ] Error messages отображаются?
- [ ] Можно ли submit пустую форму?
- [ ] File uploads работают?

**Real-time:**
- [ ] WebSocket reconnect работает?
- [ ] Push notifications доставляются?
- [ ] Notifications badge обновляется?

**Performance:**
- [ ] App не freezes на длинных списках?
- [ ] Images загружаются лениво?
- [ ] Memory leaks отсутствуют?
- [ ] Smooth 60fps scrolling?

---

## 🔬 EDGE CASES & CORNER CASES

### 1. Concurrent Operations

```php
// tests/Feature/EdgeCases/ConcurrencyTest.php
class ConcurrencyTest extends TestCase {
    
    /** @test */
    public function multiple_users_cannot_select_same_executor_for_same_order() {
        $order = Order::factory()->create(['status' => 'published']);
        $response1 = OrderResponse::factory()->create(['order_id' => $order->id]);
        $response2 = OrderResponse::factory()->create(['order_id' => $order->id]);
        
        $customer = $order->author;
        
        // Try to select both responses simultaneously
        $select1 = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/orders/{$order->id}/responses/{$response1->id}/select");
        
        $select2 = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/orders/{$order->id}/responses/{$response2->id}/select");
        
        // Only one should succeed
        $this->assertTrue(
            ($select1->status() === 200 && $select2->status() === 422) ||
            ($select1->status() === 422 && $select2->status() === 200)
        );
    }
    
    /** @test */
    public function wallet_balance_is_consistent_under_concurrent_transactions() {
        $user = User::factory()->create(['wallet_balance' => 10000]);
        
        // Simulate 10 concurrent charges of 1000 each
        $service = app(WalletService::class);
        
        DB::transaction(function() use ($user, $service) {
            for ($i = 0; $i < 10; $i++) {
                try {
                    $service->charge($user, 1000);
                } catch (\Exception $e) {
                    // Expected to fail after balance depleted
                }
            }
        });
        
        $user->refresh();
        // Should be exactly 0, not negative
        $this->assertEquals(0, $user->wallet_balance);
    }
}
```

### 2. Boundary Value Testing

```php
// tests/Feature/EdgeCases/BoundaryValueTest.php
class BoundaryValueTest extends TestCase {
    
    /** @test */
    public function order_amount_boundaries() {
        $customer = User::factory()->create(['type' => 1]);
        
        // Minimum (0)
        $response1 = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/orders', [
                'title' => 'Test',
                'work_direction' => 1,
                'work_type' => 1,
                'city' => 'Dubai',
                'max_amount' => 0
            ]);
        
        $this->assertContains($response1->status(), [200, 201, 422]);
        
        // Maximum (999999999.99)
        $response2 = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/orders', [
                'title' => 'Test',
                'work_direction' => 1,
                'work_type' => 1,
                'city' => 'Dubai',
                'max_amount' => 999999999.99
            ]);
        
        $this->assertContains($response2->status(), [200, 201]);
        
        // Negative (should fail)
        $response3 = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/orders', [
                'title' => 'Test',
                'work_direction' => 1,
                'work_type' => 1,
                'city' => 'Dubai',
                'max_amount' => -100
            ]);
        
        $response3->assertStatus(422);
    }
    
    /** @test */
    public function referral_code_validation() {
        // Exactly 8 characters
        $code = ReferralCode::create([
            'code' => 'ABCD1234',
            'user_id' => 1,
            'is_active' => true
        ]);
        
        $this->assertEquals(8, strlen($code->code));
        
        // Less than 8 should fail
        $this->expectException(\Exception::class);
        ReferralCode::create([
            'code' => 'ABC123',
            'user_id' => 2,
            'is_active' => true
        ]);
    }
}
```

### 3. Data Integrity Tests

```php
// tests/Feature/EdgeCases/DataIntegrityTest.php
class DataIntegrityTest extends TestCase {
    
    /** @test */
    public function deleting_user_handles_cascading_correctly() {
        $user = User::factory()->create();
        $order = Order::factory()->create(['author_id' => $user->id]);
        $response = OrderResponse::factory()->create(['order_id' => $order->id]);
        
        $orderId = $order->id;
        $responseId = $response->id;
        
        // Delete user
        $user->delete();
        
        // Check cascade behavior
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        
        // Orders should be handled (either cascade delete or set null)
        // Verify expected behavior
    }
    
    /** @test */
    public function rating_calculation_handles_zero_reviews() {
        $executor = User::factory()->create(['type' => 0]);
        
        $executor->recalculateRating();
        
        $this->assertEquals(0, $executor->executor_rating);
        $this->assertEquals(0, $executor->executor_reviews_count);
    }
}
```

---

## 🎯 CRITICAL TEST SCENARIOS

### Scenario 1: Subscription Expiration

```php
/** @test */
public function subscription_expires_and_user_cannot_create_order() {
    $tariff = Tariff::factory()->create(['max_orders' => 5]);
    $customer = User::factory()->create([
        'type' => 1,
        'current_tariff_id' => $tariff->id,
        'subscription_ends_at' => now()->addHour() // Expires in 1 hour
    ]);
    
    // Can create now
    $response1 = $this->actingAs($customer, 'sanctum')
        ->postJson('/api/orders', $this->validOrderData());
    $response1->assertStatus(201);
    
    // Travel to future
    $this->travel(2)->hours();
    
    // Cannot create after expiration
    $response2 = $this->actingAs($customer, 'sanctum')
        ->postJson('/api/orders', $this->validOrderData());
    $response2->assertStatus(403);
}
```

### Scenario 2: Race Condition in Order Selection

```php
/** @test */
public function only_one_executor_can_be_selected_for_order() {
    $order = Order::factory()->create(['status' => 'published']);
    $response1 = OrderResponse::factory()->create(['order_id' => $order->id]);
    $response2 = OrderResponse::factory()->create(['order_id' => $order->id]);
    
    $customer = $order->author;
    
    // Simulate concurrent requests
    $select1 = $this->actingAs($customer, 'sanctum')
        ->postJson("/api/orders/{$order->id}/responses/{$response1->id}/select");
    
    $select2 = $this->actingAs($customer, 'sanctum')
        ->postJson("/api/orders/{$order->id}/responses/{$response2->id}/select");
    
    // One should succeed, one should fail
    $successCount = 0;
    if ($select1->status() === 200) $successCount++;
    if ($select2->status() === 200) $successCount++;
    
    $this->assertEquals(1, $successCount);
}
```

### Scenario 3: Wallet Balance Consistency

```php
/** @test */
public function wallet_balance_remains_consistent_after_multiple_operations() {
    $user = User::factory()->create(['wallet_balance' => 10000]);
    
    $service = app(WalletService::class);
    
    // Deposit
    $service->deposit($user, 5000, 'aed');
    $user->refresh();
    $this->assertEquals(15000, $user->wallet_balance);
    
    // Charge
    $service->charge($user, 3000);
    $user->refresh();
    $this->assertEquals(12000, $user->wallet_balance);
    
    // Multiple charges
    $service->charge($user, 1000);
    $service->charge($user, 2000);
    $user->refresh();
    $this->assertEquals(9000, $user->wallet_balance);
    
    // Verify transaction history
    $transactions = WalletTransaction::where('user_id', $user->id)->get();
    $sum = $transactions->sum(function($t) {
        return $t->type === 'deposit' ? $t->amount : -$t->amount;
    });
    
    // Balance should match sum of transactions
    $this->assertEquals($user->wallet_balance - 10000, $sum);
}
```

---

## 📊 TEST REPORTING

### Test Coverage Reports

**Backend:**
```bash
# Generate coverage report
./vendor/bin/phpunit --coverage-html coverage-report

# View report
open coverage-report/index.html

# Coverage thresholds
# - Overall: 70%+
# - Services: 80%+
# - Models: 75%+
# - Controllers: 60%+
```

**Mobile:**
```bash
# Generate coverage
npm test -- --coverage

# View report
open coverage/lcov-report/index.html

# Coverage thresholds
# - Overall: 70%+
# - Components: 75%+
# - Hooks: 80%+
# - Reducers: 90%+
```

### Bug Tracking Template

```markdown
## Bug Report #XXX

**Severity:** Critical / High / Medium / Low
**Component:** Backend / Mobile iOS / Mobile Android / Database
**Type:** Functional / Security / Performance / UI

**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Backend: Laravel 11, PHP 8.2, PostgreSQL 15
- Mobile: React Native 0.75.3, iOS 17 / Android 14

**Screenshots/Logs:**
[Attach screenshots or log excerpts]

**Proposed Fix:**
Suggested solution

**Priority:** P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
```

---

## ✅ TESTING CHECKLIST

### Pre-Testing Setup
- [ ] Test database created and configured
- [ ] Test environment variables set
- [ ] Mock external services (Stripe, OpenAI, FCM)
- [ ] Test data seeded
- [ ] Testing tools installed

### Backend Testing
- [ ] All service classes tested (21+ services)
- [ ] All models tested (46+ models)
- [ ] All API endpoints tested (350+ endpoints)
- [ ] Database migrations tested
- [ ] Seeders tested
- [ ] Middleware tested
- [ ] Observers tested
- [ ] Jobs tested
- [ ] Mail sending tested

### Mobile Testing
- [ ] All components tested (60+ components)
- [ ] All screens tested (47+ screens)
- [ ] All hooks tested (37+ hooks)
- [ ] Redux store tested
- [ ] Navigation tested
- [ ] API client tested
- [ ] WebSocket tested
- [ ] Push notifications tested

### Integration Testing
- [ ] Backend ↔ Database
- [ ] Mobile ↔ Backend API
- [ ] WebSocket communication
- [ ] Stripe integration
- [ ] OpenAI integration
- [ ] FCM integration

### Security Testing
- [ ] OWASP Top 10 tested
- [ ] Penetration testing completed
- [ ] Dependency vulnerabilities scanned
- [ ] API security tested
- [ ] Authentication bypass attempts
- [ ] Authorization checks verified

### Performance Testing
- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Database query optimization verified
- [ ] API response times acceptable
- [ ] Mobile app performance tested
- [ ] Memory leaks checked

### E2E Testing
- [ ] Customer journey tested
- [ ] Executor journey tested
- [ ] Mediator journey tested
- [ ] Admin workflow tested
- [ ] Cross-platform (iOS + Android)

---

## 🚀 AUTOMATED TESTING PIPELINE

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Comprehensive Testing

on: [push, pull_request]

jobs:
  backend-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Unit Tests
        run: |
          cd backend
          composer install
          ./vendor/bin/phpunit --testsuite=Unit
      
  backend-feature:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - name: Run Feature Tests
        run: |
          cd backend
          composer install
          php artisan migrate --env=testing
          ./vendor/bin/phpunit --testsuite=Feature
          
  mobile-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Mobile Tests
        run: |
          cd mobile
          npm ci
          npm test -- --coverage
          
  mobile-e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E Tests (iOS)
        run: |
          cd mobile
          npm ci
          detox build -c ios.sim.release
          detox test -c ios.sim.release
          
  mobile-e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E Tests (Android)
        run: |
          cd mobile
          npm ci
          detox build -c android.emu.release
          detox test -c android.emu.release
          
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Security Scan
        run: |
          cd backend
          composer audit
          cd ../mobile
          npm audit
```

---

## 📈 SUCCESS CRITERIA

### Coverage Targets

| Component | Target | Minimum |
|-----------|--------|---------|
| **Backend Services** | 80% | 70% |
| **Backend Models** | 75% | 65% |
| **Backend Controllers** | 60% | 50% |
| **Mobile Components** | 75% | 65% |
| **Mobile Hooks** | 80% | 70% |
| **Mobile Redux** | 90% | 80% |
| **Overall Backend** | 70% | 60% |
| **Overall Mobile** | 70% | 60% |

### Quality Gates

**Before Production:**
- ✅ All critical tests passing (100%)
- ✅ Code coverage > 70%
- ✅ No P0/P1 bugs open
- ✅ Security audit passed
- ✅ Performance tests passed
- ✅ E2E tests passing on both platforms

---

## 🔚 CONCLUSION

Это **comprehensive testing strategy** обеспечит:

1. ✅ **High Code Quality** - 70%+ test coverage
2. ✅ **Bug-Free Production** - Все критические баги найдены и исправлены
3. ✅ **Security** - OWASP Top 10 covered, penetration tested
4. ✅ **Performance** - Load tested, optimized
5. ✅ **User Confidence** - E2E tested, all journeys verified

**Estimated Timeline:** 30 working days  
**Team Required:** 2-3 QA Engineers + 1 Automation Engineer  
**Investment:** High, but critical for production readiness

---

**Составлено:** Senior QA Engineer & Test Architect  
**Дата:** 2 октября 2025  
**Версия:** 1.0.0  
**Статус:** Ready for execution

---

**END OF DOCUMENT**

