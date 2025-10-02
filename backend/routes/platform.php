<?php

declare(strict_types=1);

use App\Models\Tariff;
use App\Orchid\Screens\Examples\ExampleActionsScreen;
use App\Orchid\Screens\Examples\ExampleCardsScreen;
use App\Orchid\Screens\Examples\ExampleChartsScreen;
use App\Orchid\Screens\Examples\ExampleFieldsAdvancedScreen;
use App\Orchid\Screens\Examples\ExampleFieldsScreen;
use App\Orchid\Screens\Examples\ExampleGridScreen;
use App\Orchid\Screens\Examples\ExampleLayoutsScreen;
use App\Orchid\Screens\Examples\ExampleScreen;
use App\Orchid\Screens\Examples\ExampleTextEditorsScreen;
use App\Orchid\Screens\Banner;
use App\Orchid\Screens\Customer;
use App\Orchid\Screens\Executor;
use App\Orchid\Screens\Mediator;
use App\Orchid\Screens\Order;
use App\Orchid\Screens\Payment\PaymentListScreen;
use App\Orchid\Screens\PlatformScreen;
use App\Orchid\Screens\User\UserEditScreen;
use App\Orchid\Screens\User\UserListScreen;
use App\Orchid\Screens\User\UserProfileScreen;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Tabuna\Breadcrumbs\Trail;
use App\Orchid\Screens\Subscription\SubscriptionListScreen;
use App\Orchid\Screens\Subscription\SubscriptionEditScreen;
use App\Orchid\Screens\Complaint;
use App\Orchid\Screens\Analytics\AnalyticsScreen;
use App\Orchid\Screens\Notification\NotificationListScreen;
use App\Orchid\Screens\Reports\ReportsScreen;
use App\Orchid\Screens\License;
use App\Orchid\Screens\WorkDirection;
use App\Orchid\Screens\WorkType;
use App\Orchid\Screens\HousingOptionsScreen;
use App\Orchid\Screens\HousingOptionEditScreen;

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the need "dashboard" middleware group. Now create something great!
|
*/



// Main
Route::screen('dashboard', PlatformScreen::class)
    ->name('platform.main')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->push('Dashboard'));

// Logout
Route::post('logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect('/admin/login');
})->name('platform.logout');

// Platform > Profile
Route::screen('profile', UserProfileScreen::class)
    ->name('platform.profile')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push(__('Profile'), route('platform.profile')));


// Platform > System > Executors
Route::screen('executors', Executor\ListScreen::class)
    ->name('platform.systems.executors')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push(__('Executors'), route('platform.systems.executors')));
Route::screen('executors/{executor}/edit', Executor\EditScreen::class)
    ->name('platform.systems.executors.edit')
    ->breadcrumbs(fn (Trail $trail, $executor) => $trail
        ->parent('platform.systems.executors')
        ->push($executor->name, route('platform.systems.executors.edit', $executor)));
Route::screen('executors/create', Executor\CreateScreen::class)
    ->name('platform.systems.executors.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.systems.executors')
        ->push(__('Create executor'), route('platform.systems.executors.create')));

// Platform > System > Customers
Route::screen('customers', Customer\ListScreen::class)
    ->name('platform.systems.customers')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push(__('Customers'), route('platform.systems.customers')));
Route::screen('customers/{customer}/edit', Customer\EditScreen::class)
    ->name('platform.systems.customers.edit')
    ->breadcrumbs(fn (Trail $trail, $customer) => $trail
        ->parent('platform.systems.customers')
        ->push($customer->name, route('platform.systems.customers.edit', $customer)));
Route::screen('customers/create', Customer\CreateScreen::class)
    ->name('platform.systems.customers.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.systems.customers')
        ->push(__('Create customer'), route('platform.systems.customers.create')));

// Platform > System > Mediators
Route::screen('mediators', Mediator\MediatorListScreen::class)
    ->name('platform.systems.mediators')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push(__('Mediators'), route('platform.systems.mediators')));
Route::screen('mediators/{user}/edit', Mediator\MediatorEditScreen::class)
    ->name('platform.systems.mediators.edit')
    ->breadcrumbs(fn (Trail $trail, $user) => $trail
        ->parent('platform.systems.mediators')
        ->push($user->name, route('platform.systems.mediators.edit', $user)));
Route::screen('mediators/create', Mediator\MediatorCreateScreen::class)
    ->name('platform.systems.mediators.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.systems.mediators')
        ->push(__('Create mediator'), route('platform.systems.mediators.create')));

// Platform > System > Banners
Route::screen('banners', Banner\ListScreen::class)
    ->name('platform.systems.banners')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push(__('Banners'), route('platform.systems.banners')));
Route::screen('banners/{banner}/edit', Banner\EditScreen::class)
    ->name('platform.systems.banners.edit')
    ->breadcrumbs(fn (Trail $trail, $banner) => $trail
        ->parent('platform.systems.banners')
        ->push(__('Edit banner'), route('platform.systems.banners.edit', $banner)));
Route::screen('banners/create', Banner\CreateScreen::class)
    ->name('platform.systems.banners.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.systems.banners')
        ->push(__('Create banner'), route('platform.systems.banners.create')));

// Platform > System > Orders
Route::screen('orders', Order\ListScreen::class)
    ->name('platform.systems.orders')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push(__('Orders'), route('platform.systems.orders')));
Route::screen('orders/{order}/edit', Order\TestEditScreen::class)
    ->name('platform.systems.orders.edit')
    ->breadcrumbs(fn (Trail $trail, $order) => $trail
        ->parent('platform.systems.orders')
        ->push('Edit Order #' . (is_object($order) ? $order->id : $order), route('platform.systems.orders.edit', is_object($order) ? $order->id : $order)));
Route::screen('orders/create', Order\CreateScreen::class)
    ->name('platform.systems.orders.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.systems.orders')
        ->push(__('Create order'), route('platform.systems.orders.create')));

// Platform > System > Orders > Responses
Route::screen('orders/responses', Order\Response\ListScreen::class)
    ->name('platform.systems.orders.responses')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push(__('Orders responses'), route('platform.systems.orders.responses')));
Route::screen('orders/responses/{orderResponse}/edit', Order\Response\EditScreen::class)
    ->name('platform.systems.orders.responses.edit')
    ->breadcrumbs(fn (Trail $trail, $orderResponse) => $trail
        ->parent('platform.systems.orders.responses')
        ->push(__('Order response'), route('platform.systems.orders.responses.edit', $orderResponse)));




Route::screen('subscriptions', SubscriptionListScreen::class)
    ->name('platform.subscriptions.list')
    ->breadcrumbs(fn(Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Подписки'));

Route::screen('subscriptions/create', \App\Orchid\Screens\Subscription\SubscriptionCreateScreen::class)
    ->name('platform.subscriptions.create')
    ->breadcrumbs(fn(Trail $trail) => $trail
        ->parent('platform.subscriptions.list')
        ->push('Создание подписки'));

Route::screen('subscriptions/{subscription}/edit', SubscriptionEditScreen::class)
    ->name('platform.subscriptions.edit')
    ->breadcrumbs(fn(Trail $trail, Tariff $subscription) => $trail
        ->parent('platform.subscriptions.list')
        ->push('Редактирование: ' . $subscription->name));

Route::screen('payments', PaymentListScreen::class)
    ->name('platform.payments.list')
    ->breadcrumbs(fn(Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Платежи'));

// Platform > System > Complaints
Route::screen('complaints', Complaint\ListScreen::class)
    ->name('platform.systems.complaints')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Жалобы', route('platform.systems.complaints')));

Route::screen('complaints/{complaint}/edit', Complaint\EditScreen::class)
    ->name('platform.systems.complaints.edit')
    ->breadcrumbs(fn (Trail $trail, $complaint) => $trail
        ->parent('platform.systems.complaints')
        ->push("Жалоба #{$complaint->id}", route('platform.systems.complaints.edit', $complaint)));

// Platform > Analytics
Route::screen('analytics', AnalyticsScreen::class)
    ->name('platform.analytics')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Аналитика', route('platform.analytics')));

// Platform > Admin Notifications
Route::screen('admin-notifications', NotificationListScreen::class)
    ->name('platform.admin-notifications')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Уведомления', route('platform.admin-notifications')));



// Platform > Reports
Route::screen('reports', ReportsScreen::class)
    ->name('platform.reports')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Отчеты', route('platform.reports')));

// Platform > System > Licenses
Route::screen('licenses', License\ListScreen::class)
    ->name('platform.systems.licenses')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Лицензии', route('platform.systems.licenses')));

Route::screen('licenses/{user}/view', License\ViewScreen::class)
    ->name('platform.systems.licenses.view')
    ->breadcrumbs(fn (Trail $trail, $user) => $trail
        ->parent('platform.systems.licenses')
        ->push('Лицензия: ' . $user->name, route('platform.systems.licenses.view', $user)));

// Platform > System > Work Directions
Route::screen('work-directions', WorkDirection\ListScreen::class)
    ->name('platform.work-directions')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Work Directions', route('platform.work-directions')));

Route::screen('work-directions/create', WorkDirection\EditScreen::class)
    ->name('platform.work-directions.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.work-directions')
        ->push('Create Work Direction', route('platform.work-directions.create')));

Route::screen('work-directions/{workDirection}/edit', WorkDirection\EditScreen::class)
    ->name('platform.work-directions.edit')
    ->breadcrumbs(fn (Trail $trail, $workDirection) => $trail
        ->parent('platform.work-directions')
        ->push('Edit: ' . $workDirection->getLocalizedName('en'), route('platform.work-directions.edit', $workDirection)));

// Platform > System > Work Types
Route::screen('work-types', WorkType\ListScreen::class)
    ->name('platform.work-types')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Work Types', route('platform.work-types')));

Route::screen('work-types/create', WorkType\EditScreen::class)
    ->name('platform.work-types.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.work-types')
        ->push('Create Work Type', route('platform.work-types.create')));

Route::screen('work-types/{workType}/edit', WorkType\EditScreen::class)
    ->name('platform.work-types.edit')
    ->breadcrumbs(fn (Trail $trail, $workType) => $trail
        ->parent('platform.work-types')
        ->push('Edit: ' . $workType->getLocalizedName('en'), route('platform.work-types.edit', $workType)));

// Housing Options Management
Route::screen('housing-options', HousingOptionsScreen::class)
    ->name('platform.housing-options')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Housing Options', route('platform.housing-options')));

Route::screen('housing-options/create', HousingOptionEditScreen::class)
    ->name('platform.housing-options.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.housing-options')
        ->push('Create Housing Option', route('platform.housing-options.create')));

Route::screen('housing-options/{housingOption}/edit', HousingOptionEditScreen::class)
    ->name('platform.housing-options.edit')
    ->breadcrumbs(fn (Trail $trail, $housingOption) => $trail
        ->parent('platform.housing-options')
        ->push('Edit: ' . $housingOption->label_en, route('platform.housing-options.edit', $housingOption)));

// Wallet Management
Route::screen('wallet', \App\Orchid\Screens\Wallet\WalletListScreen::class)
    ->name('platform.wallet.list')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Wallet Management'));

Route::screen('wallet/{user}/transactions', \App\Orchid\Screens\Wallet\WalletTransactionsScreen::class)
    ->name('platform.wallet.transactions')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.wallet.list')
        ->push('User Transactions'));

// Example...
Route::screen('example', ExampleScreen::class)
    ->name('platform.example')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Example Screen'));

Route::screen('/examples/form/fields', ExampleFieldsScreen::class)->name('platform.example.fields');
Route::screen('/examples/form/advanced', ExampleFieldsAdvancedScreen::class)->name('platform.example.advanced');
Route::screen('/examples/form/editors', ExampleTextEditorsScreen::class)->name('platform.example.editors');
Route::screen('/examples/form/actions', ExampleActionsScreen::class)->name('platform.example.actions');

Route::screen('/examples/layouts', ExampleLayoutsScreen::class)->name('platform.example.layouts');
Route::screen('/examples/grid', ExampleGridScreen::class)->name('platform.example.grid');
Route::screen('/examples/charts', ExampleChartsScreen::class)->name('platform.example.charts');
Route::screen('/examples/cards', ExampleCardsScreen::class)->name('platform.example.cards');

// New User Management Section
Route::screen('users', \App\Orchid\Screens\User\UserListScreen::class)
    ->name('platform.users.list')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Users'));

Route::screen('users/create', \App\Orchid\Screens\User\UserCreateScreen::class)
    ->name('platform.users.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.users.list')
        ->push('Create User'));

Route::screen('users/{user}/edit', \App\Orchid\Screens\User\UserEditScreen::class)
    ->name('platform.users.edit')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.users.list')
        ->push('Edit User'));

// Platform > Referral System
Route::screen('referrals/settings', \App\Orchid\Screens\Referral\SimpleReferralSettingsScreen::class)
    ->name('platform.referrals.settings')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Referral Settings'));

Route::screen('referrals/stats', \App\Orchid\Screens\Referral\SimpleReferralStatsScreen::class)
    ->name('platform.referrals.stats')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Referral Statistics'));

Route::screen('referrals/list', \App\Orchid\Screens\Referral\SimpleReferralListScreen::class)
    ->name('platform.referrals.list')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Referral Management'));

// Platform > Push Notifications
Route::screen('push-notifications', \App\Orchid\Screens\PushNotification\ListScreen::class)
    ->name('platform.push-notifications')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Push Notifications'));

Route::screen('push-notifications/{notification}/edit', \App\Orchid\Screens\PushNotification\EditScreen::class)
    ->name('platform.push-notifications.edit')
    ->breadcrumbs(fn (Trail $trail, $notification) => $trail
        ->parent('platform.push-notifications')
        ->push('Edit Notification'));

Route::screen('push-notifications/create', \App\Orchid\Screens\PushNotification\EditScreen::class)
    ->name('platform.push-notifications.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.push-notifications')
        ->push('Create Notification'));

// Platform > Partner Program
Route::screen('partners', \App\Orchid\Screens\Partner\ListScreen::class)
    ->name('platform.partners')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.main')
        ->push('Partners'));

Route::screen('partners/{partner}/edit', \App\Orchid\Screens\Partner\EditScreen::class)
    ->name('platform.partners.edit')
    ->breadcrumbs(fn (Trail $trail, $partner) => $trail
        ->parent('platform.partners')
        ->push('Edit Partner'));

Route::screen('partners/create', \App\Orchid\Screens\Partner\EditScreen::class)
    ->name('platform.partners.create')
    ->breadcrumbs(fn (Trail $trail) => $trail
        ->parent('platform.partners')
        ->push('Create Partner'));
