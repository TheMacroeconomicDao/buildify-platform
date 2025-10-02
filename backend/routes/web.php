<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Enums\Users\Type;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\SubscriptionController;

Route::get('/', function () {
    return view('welcome');
});

// Простой тест админки
Route::get('/test-admin', function () {
    return response()->json([
        'status' => 'ok',
        'app_env' => config('app.env'),
        'platform_domain' => config('platform.domain'),
        'platform_prefix' => config('platform.prefix'),
    ]);
});

// Редирект с /admin на соответствующую страницу
Route::get('/admin', function () {
    if (auth()->check()) {
        return redirect('admin/dashboard');
    }
    return redirect('admin/login');
});

// Маршруты аутентификации для админки
Route::get('/admin/login', [App\Http\Controllers\AdminAuthController::class, 'showLoginForm'])->name('admin.login');
Route::post('/admin/login', [App\Http\Controllers\AdminAuthController::class, 'login']);
Route::post('/admin/logout', [App\Http\Controllers\AdminAuthController::class, 'logout'])->name('admin.logout');

// Маршруты для Stripe redirect после оплаты подписки
Route::get('/subscription/success', [SubscriptionController::class, 'success'])->name('subscription.success');
Route::get('/subscription/cancel', [SubscriptionController::class, 'cancel'])->name('subscription.cancel');

// Временный маршрут для быстрого входа администратора (для разработки)
Route::get('/admin-quick-login', function () {
    $admin = User::where('type', Type::Admin->value)->first();
    
    if ($admin) {
        Auth::login($admin);
        return redirect('/admin')->with('success', 'Быстрый вход выполнен как администратор');
    }
    
    return response('Администратор не найден', 404);
});

// Партнерские реферальные ссылки
Route::get('/ref/{partnerId}', [App\Http\Controllers\PartnerProgramController::class, 'handleReferralLink'])
    ->name('partner.referral');

// Маршруты экспорта данных (защищены middleware)
Route::middleware(['auth', 'check.admin'])->group(function () {
    Route::get('/admin/export/analytics', [App\Http\Controllers\ExportController::class, 'exportAnalytics'])
        ->name('admin.export.analytics');
    Route::get('/admin/export/reports', [App\Http\Controllers\ExportController::class, 'exportReports'])
        ->name('admin.export.reports');
    
    // Скачивание лицензии исполнителя
    Route::get('/admin/download-executor-license/{executorId}', [App\Http\Controllers\AdminController::class, 'downloadExecutorLicense'])
        ->name('admin.download-executor-license');
});