<?php

use App\Http\Controllers\ExecutorController;
use App\Http\Controllers\ExecutorReviewController;
use App\Http\Controllers\MediatorController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderResponseController;
use App\Http\Controllers\PortfolioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserNotificationController;
use App\Http\Controllers\BannerController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Middleware\UserLang;
use App\Http\Middleware\CheckExecutorVerification;
use App\Http\Middleware\CheckAdmin;
use App\Http\Controllers\FileController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CustomerReviewController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DesignGenerationController;
use App\Http\Controllers\DesignImageGenerationController;
use App\Http\Controllers\ReviewReplyController;
use App\Http\Controllers\HousingOptionController;
use App\Http\Controllers\ReferralController;

Route::post('/login', [AuthController::class, 'login'])->middleware([UserLang::class]); //API-18 Авторизация
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum', UserLang::class]); //API-39 Разлогин
Route::post('/registration/start', [RegistrationController::class, 'start'])->middleware([UserLang::class]); //API-22 Регистрация
Route::post('/registration/end', [RegistrationController::class, 'end'])->middleware([UserLang::class]); //API-21 Завершение регистрации
Route::post('/password-recovery', [RegistrationController::class, 'passwordRecovery'])->middleware([UserLang::class]); //API-19 Восстановление пароля (Шаг 1)
Route::post('/change-password', [RegistrationController::class, 'changePassword'])->middleware([UserLang::class]); //API-20 Смена пароля

// Публичные маршруты для получения данных приложения
Route::get('/get-app-settings', [UserController::class, 'getAppSettings'])->middleware([UserLang::class]); //API-23 Получить данные приложения

Route::controller(UserController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('user')
    ->group(function () {
        Route::post('/delete', 'delete'); //API-31 Удалить аккаунт | API-6 Удалить профиль исполнителя - возможно имелось другое
        Route::post('/me', 'me'); //нет в документации
        Route::get('/{id}', 'show')->whereNumber('id'); //Получить данные пользователя по ID
        Route::post('/change-password', 'changePassword'); //нет в документации (старый метод)
        Route::post('/change-password/send-code', 'changePasswordSendCode'); //Отправка кода для смены пароля
        Route::post('/change-password/confirm', 'changePasswordConfirm'); //Подтверждение смены пароля с кодом
        Route::post('/upload-license', 'uploadLicense'); //Загрузка файла лицензии
        Route::post('/edit', 'edit'); ////API-17 Редактировать профиль заказчика API-30 Редактировать профиль исполнителя
        Route::post('/update-avatar', 'updateAvatar'); //API-26 Редактировать аватар
        Route::get('/settings-get', 'settingsGet'); //API-27 Получить локализацию
        Route::post('/settings-update', 'settingsUpdate'); //API-28 Изменить локализацию
        Route::post('/set-work-settings', 'setWorkSettings'); //API-29 Сохранить список направлений и типы работ для исполнителя
        Route::get('/get-work-settings', 'getWorkSettings'); //API-30 Получить список направлений и типы работ исполнителя
    });


Route::controller(UserNotificationController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('notification')
    ->group(function () {
        Route::post('/get-count-notifications', 'getCountUnreadNotifications'); //нет в документации
        Route::get('/get-notifications', 'getNotifications'); //нет в документации
        Route::post('/read-notifications', 'readNotifications'); //нет в документации
    });

Route::controller(SubscriptionController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('subscription')
    ->group(function () {
        Route::get('/get-all', 'getAll'); //API-14 Получить список подписок @TODO дорабоать
        Route::get('/get', 'get'); //нет в документации
        Route::post('/pay', 'paySubscription'); //API-35 Оплатить подписку @TODO дорабоать
        Route::post('/cancel', 'cancelSubscription'); //API-40 Отменить подписку @TODO дорабоать
    });

Route::controller(BannerController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('banners')
    ->group(function () {
        Route::get('/', 'index'); //API-8 Получить баннеры для главной
    });

Route::controller(ExecutorController::class)
    ->middleware([UserLang::class])
    ->prefix('executors')
    ->group(function () {
        Route::get('/', 'index'); // Получить список всех исполнителей (публичный доступ)
        Route::get('/{id}', 'show'); //API-36 Получить профиль исполнителя (публичный доступ)
    });
Route::controller(ExecutorReviewController::class)
    ->prefix('executors/{executor_id}/reviews')
    ->group(function () {
        Route::post('/', 'store')->middleware(['auth:sanctum', UserLang::class]); //API-13 Оставить отзыв на исполнителя
        Route::get('/', 'index')->middleware([UserLang::class]); //API-37 Получить отзывы на исполнителя (публичный доступ)
    });

Route::controller(OrderController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('orders')
    ->group(function () {
        Route::get('/', 'index'); //API-11 Получить заказы поиска
        Route::post('/', 'store'); //API-16 Создание заказа
        Route::get('/active', 'active'); //API-15 Получить активные заказы заказчика; API-1 Получить активные заказы исполнителя
        Route::get('/archived', 'archived'); // Получить архив завершенных заказов
        Route::get('/{id}', 'show')->whereNumber('id'); //API-12 Получить данные заказа
        Route::post('/{id}', 'update')->whereNumber('id'); //API-38 Редактировать заказ
        Route::post('/{id}/cancel', 'cancel')->whereNumber('id'); //API-42 Отменить заказ
        Route::post('/{id}/complete', 'complete')->whereNumber('id')->middleware(CheckExecutorVerification::class); //Завершить заказ исполнителем
        Route::post('/{id}/refuse', 'refuse')->whereNumber('id')->middleware(CheckExecutorVerification::class); //Отказаться от заказа исполнителем
        Route::post('/{id}/archive-by-executor', 'archiveByExecutor')->whereNumber('id')->middleware(CheckExecutorVerification::class); //Архивировать заказ исполнителем
        Route::post('/{id}/archive-by-customer', 'archiveByCustomer')->whereNumber('id'); //Архивировать заказ заказчиком
        Route::post('/{id}/accept', 'accept')->whereNumber('id'); //Принять работы заказчиком
        Route::post('/{id}/reject', 'reject')->whereNumber('id'); //Отклонить работы заказчиком
        Route::post('/{id}/complete-by-customer', 'completeByCustomer')->whereNumber('id'); //Завершить заказ заказчиком
    });
Route::controller(OrderResponseController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('orders/{orderId}/responses')
    ->whereNumber('orderId')
    ->group(function () {
        Route::get('/', 'index'); //API-25 Получить отклики на заказ
        Route::post('/', 'store')->middleware(CheckExecutorVerification::class); //API-9 Откликнуться на заказ
        Route::post('/{responseId}/send-contact', 'sendContact'); //API-33 Отправить контакты исполнителю
        Route::post('/{responseId}/send-executor-contact', 'sendExecutorContact')->middleware(CheckExecutorVerification::class); //API-35 Отправить контакты исполнителя заказчику
        Route::post('/{responseId}/select', 'select'); //API-32 Выбрать исполнителя
        Route::post('/{responseId}/reject', 'reject'); //API-34 Отклонить отклик исполнителя
        Route::post('/{responseId}/revoke', 'revoke')->middleware(CheckExecutorVerification::class); //API-10 Отозвать отклик на заказ исполнителем
        Route::post('/{responseId}/take-on-work', 'takeOnWork')->middleware(CheckExecutorVerification::class); //API-4 Взять заказ в работу
    });

// Отдельный маршрут для получения количества новых откликов
Route::get('/order-responses/new-count', [OrderResponseController::class, 'getNewResponsesCount'])
    ->middleware(['auth:sanctum', UserLang::class]);

// Маршруты для работы с исполнителями
Route::controller(ExecutorController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('executors')
    ->group(function () {
        Route::get('/', 'index'); // Получить список исполнителей
        Route::get('/{id}', 'show')->whereNumber('id'); // Получить профиль исполнителя
    });

Route::controller(FileController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('files')
    ->group(function () {
        Route::post('/store', 'store'); //API-24 Загрузка вложения при создании заказа
    });

Route::controller(WalletController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('wallet')
    ->group(function () {
        Route::get('/me', 'me');
        Route::post('/topup', 'topup');
        Route::get('/transactions', 'transactions');
    });

// Админские API маршруты
Route::middleware(['auth:sanctum', 'check.admin'])->prefix('admin')->group(function () {
    // Управление подписками пользователей
    Route::get('/tariffs', [App\Http\Controllers\AdminSubscriptionController::class, 'getTariffs']);
    Route::get('/users/{userId}/subscription', [App\Http\Controllers\AdminSubscriptionController::class, 'getUserSubscription']);
    Route::put('/users/{userId}/subscription', [App\Http\Controllers\AdminSubscriptionController::class, 'updateUserSubscription']);
    Route::post('/users/{userId}/subscription/extend', [App\Http\Controllers\AdminSubscriptionController::class, 'extendUserSubscription']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::get('/subscriptions/my', [SubscriptionController::class, 'mySubscription']);
    Route::post('/subscriptions/{tariff}/checkout', [SubscriptionController::class, 'checkout']);
    Route::post('/subscriptions/{tariff}/pay-from-wallet', [SubscriptionController::class, 'payFromWallet']);
    Route::post('/subscriptions/unsubscribe', [SubscriptionController::class, 'unsubscribe']);
});

// Маршруты для работы с посредниками
Route::controller(MediatorController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('mediators')
    ->group(function () {
        Route::get('/', 'index'); // Список посредников
        Route::get('/{id}', 'show'); // Информация о посреднике
        Route::post('/calculate-commission', 'calculateCommission'); // Расчет комиссии (для админки)
    });

Route::controller(PortfolioController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('portfolio')
    ->group(function () {
        Route::get('/', 'index'); // Получить портфолио исполнителя
        Route::post('/', 'store'); // Создать портфолио
        Route::get('/{id}', 'show')->whereNumber('id'); // Показать портфолио
        Route::put('/{id}', 'update')->whereNumber('id'); // Обновить портфолио
        Route::delete('/{id}', 'destroy')->whereNumber('id'); // Удалить портфолио
    });

// Административные маршруты
Route::controller(AdminController::class)
    ->middleware(['auth:sanctum', 'check.admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/executors/pending', 'getPendingExecutors'); //Список исполнителей ожидающих верификации
        Route::get('/executors', 'getAllExecutors'); //Все исполнители с их статусами
        Route::post('/executors/verify', 'verifyExecutor'); //Верифицировать исполнителя
        Route::get('/executors/{executorId}/license', 'downloadExecutorLicense'); //Скачать лицензию исполнителя
    });

// Роуты для жалоб
Route::controller(ComplaintController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('complaints')
    ->group(function () {
        Route::post('/', 'store'); // Подать жалобу
        Route::get('/', 'index'); // Получить список своих жалоб
        Route::get('/reasons', 'getReasons'); // Получить возможные причины для жалоб
        Route::get('/{complaint}', 'show')->whereNumber('complaint'); // Получить детали жалобы
    });

    // Маршруты для отзывов о заказчиках
    Route::prefix('customer-reviews')->name('customer-reviews.')->controller(CustomerReviewController::class)
        ->middleware(['auth:sanctum', UserLang::class])
        ->group(function () {
            Route::post('/', 'store'); // Создать отзыв о заказчике
            Route::get('/customer/{customerId}', 'index')->whereNumber('customerId'); // Получить список отзывов о заказчике
            Route::get('/{reviewId}', 'show')->whereNumber('reviewId'); // Получить детали отзыва
            Route::get('/order/{orderId}/can-review', 'canReview')->whereNumber('orderId'); // Проверить возможность оставить отзыв
        });

    // Маршруты для отзывов об исполнителях
    Route::prefix('executor-reviews')->name('executor-reviews.')->controller(ExecutorReviewController::class)
        ->middleware(['auth:sanctum', UserLang::class])
        ->group(function () {
            Route::post('/', 'store'); // Создать отзыв об исполнителе
            Route::get('/executor/{executorId}', 'index')->whereNumber('executorId'); // Получить список отзывов об исполнителе
            Route::get('/{reviewId}', 'show')->whereNumber('reviewId'); // Получить детали отзыва
            Route::get('/order/{orderId}/can-review', 'canReview')->whereNumber('orderId'); // Проверить возможность оставить отзыв
        });

    // Маршруты для посредников
    Route::prefix('mediator')->name('mediator.')->controller(MediatorController::class)
        ->middleware(['auth:sanctum', UserLang::class])
        ->group(function () {
            Route::get('/available-orders', 'getAvailableOrders'); // Получить доступные заказы
            Route::get('/active-deals', 'getActiveDeals'); // Получить активные сделки
            Route::get('/stats', 'getStats'); // Получить статистику посредника
            Route::post('/orders/{orderId}/take', 'takeOrder')->whereNumber('orderId'); // Взять заказ в работу
            Route::post('/orders/{orderId}/update-status', 'updateOrderStatus')->whereNumber('orderId'); // Обновить статус заказа
            Route::get('/orders/{orderId}', 'getOrderDetails')->whereNumber('orderId'); // Получить детали заказа
            Route::get('/transactions', 'getTransactionHistory'); // Получить историю транзакций
            Route::post('/commission-settings', 'updateCommissionSettings'); // Обновить настройки комиссии
            
            // Новые маршруты для 3-шагового workflow
            Route::get('/orders/{orderId}/steps', 'getOrderStepDetails')->whereNumber('orderId'); // Получить детали этапов заказа
            Route::post('/orders/{orderId}/next-step', 'moveToNextStep')->whereNumber('orderId'); // Перейти к следующему этапу
            Route::post('/orders/{orderId}/archive', 'archiveOrder')->whereNumber('orderId'); // Архивировать заказ
            Route::post('/orders/{orderId}/return-to-app', 'returnOrderToApp')->whereNumber('orderId'); // Вернуть заказ в приложение
            Route::put('/orders/{orderId}/steps/{step}', 'updateStepData')->whereNumber(['orderId', 'step']); // Обновить данные этапа
            Route::post('/orders/{orderId}/complete-success', 'completeOrderSuccessfully')->whereNumber('orderId'); // Завершить заказ успешно
            Route::post('/orders/{orderId}/complete-rejection', 'completeOrderWithRejection')->whereNumber('orderId'); // Завершить заказ с отказом
            
            // Маршруты для комментариев
            Route::get('/orders/{orderId}/comments', 'getOrderComments')->whereNumber('orderId'); // Получить историю комментариев
            Route::post('/orders/{orderId}/comments', 'addOrderComment')->whereNumber('orderId'); // Добавить комментарий
        });

// Design Generation API Routes
Route::controller(DesignGenerationController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('design')
    ->group(function () {
        Route::post('/generate', 'generateDesign'); // Генерация дизайна
        Route::post('/variations', 'generateVariations'); // Генерация вариаций
        Route::get('/options', 'getGenerationOptions'); // Получить опции для генерации
    });

// Design Image Generation API Routes
Route::controller(DesignImageGenerationController::class)
    ->middleware([UserLang::class])
    ->prefix('design/images')
    ->group(function () {
        Route::get('/status/{generationId}', 'getGenerationStatus'); // Получить статус генерации
        Route::get('/get/{generationId}', 'getGenerationImages'); // Получить готовые изображения
        Route::get('/my-generations', 'getUserGenerations')->middleware('auth:sanctum'); // Список генераций пользователя
    });

// Push Notification API Routes
Route::controller(PushNotificationController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('push')
    ->group(function () {
        Route::post('/token', 'updateToken'); // Обновить push токен
        Route::post('/settings', 'updateSettings'); // Обновить настройки push
        Route::get('/settings', 'getSettings'); // Получить настройки push
        Route::post('/test', 'sendTest'); // Отправить тестовое уведомление
        
        // Админские роуты
        Route::post('/scheduled', 'createScheduled'); // Создать запланированное уведомление
        Route::get('/scheduled', 'getScheduled'); // Список запланированных уведомлений
        Route::delete('/scheduled/{id}', 'cancelScheduled'); // Отменить уведомление
    });

// Partner Program API Routes
Route::controller(PartnerProgramController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('partner')
    ->group(function () {
        Route::get('/stats', 'getPartnerStats'); // Статистика партнера
        Route::post('/payout', 'requestPayout'); // Запрос выплаты
        Route::get('/qr-code', 'getQRCode'); // QR код реферальной ссылки
        Route::post('/register-user', 'registerWithPartner'); // Регистрация через партнера
    });

Route::post('/stripe/webhook', function (Request $request) {
    return \Laravel\Cashier\Http\Controllers\WebhookController::class;
});

// Маршруты для ответов на отзывы
Route::controller(ReviewReplyController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->group(function () {
        Route::post('/executor-reviews/{reviewId}/reply', 'replyToExecutorReview'); // Ответить на отзыв об исполнителе
        Route::post('/customer-reviews/{reviewId}/reply', 'replyToCustomerReview'); // Ответить на отзыв о заказчике
        Route::get('/review-replies/{reviewType}/{reviewId}', 'getReplies'); // Получить ответы на отзыв
    });

// Housing Options
Route::get('/housing-options', [HousingOptionController::class, 'index'])->middleware([UserLang::class]);
Route::get('/housing-options/{type}', [HousingOptionController::class, 'getByType'])->middleware([UserLang::class]);

// Referral System API Routes
Route::controller(ReferralController::class)
    ->middleware(['auth:sanctum', UserLang::class])
    ->prefix('referrals')
    ->group(function () {
        Route::get('/my-stats', 'getMyStats'); // Статистика рефералов пользователя
        Route::get('/my-referrals', 'getMyReferrals'); // Список рефералов пользователя
        Route::get('/my-code', 'getMyReferralCode'); // Получить промокод пользователя
        Route::post('/use-balance', 'useBalance'); // Использовать реферральный баланс
        Route::post('/validate-code', 'validateCode'); // Валидация промокода
    });

// Broadcasting routes for WebSocket authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/broadcasting/auth', [App\Http\Controllers\BroadcastController::class, 'authenticate']);
});
