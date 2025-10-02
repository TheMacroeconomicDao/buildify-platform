<?php

declare(strict_types=1);

namespace App\Orchid;

use Orchid\Platform\Dashboard;
use Orchid\Platform\ItemPermission;
use Orchid\Platform\Models\User;
use Orchid\Platform\OrchidServiceProvider;
use Orchid\Screen\Actions\Menu;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Button;

class PlatformProvider extends OrchidServiceProvider
{
    /**
     * Bootstrap the application services.
     *
     * @param Dashboard $dashboard
     *
     * @return void
     */
    public function boot(Dashboard $dashboard): void
    {
        parent::boot($dashboard);
        Dashboard::useModel(User::class, \App\Models\User::class);

        // ...
    }

    /**
     * Register the application menu.
     *
     * @return Menu[]
     */
    public function menu(): array
    {
        return [
            Menu::make(__('Executors'))
                ->icon('bs.collection')
                ->route('platform.systems.executors')
                ->divider(),
            Menu::make(__('Customers'))
                ->icon('bs.collection')
                ->route('platform.systems.customers')
                ->divider(),
            Menu::make(__('Mediators'))
                ->icon('bs.people')
                ->route('platform.systems.mediators')
                ->divider(),
            Menu::make(__('Banners'))
                ->icon('bs.collection')
                ->route('platform.systems.banners')
                ->divider(),

            Menu::make(__('Orders'))
                ->icon('bs.collection')
                ->route('platform.systems.orders')
                ->active(function() {
                    return request()->routeIs('platform.systems.orders*') && 
                           !request()->routeIs('platform.systems.orders.responses*');
                }),
            Menu::make(__('Orders responses'))
                ->icon('bs.collection')
                ->route('platform.systems.orders.responses'),
            Menu::make()->divider(),

            Menu::make('Subscriptions')
                ->icon('credit-card')
                ->route('platform.subscriptions.list'),

            Menu::make('Wallets')
                ->icon('bs.wallet2')
                ->route('platform.wallet.list'),

            Menu::make('Payments')
                ->icon('wallet')
                ->route('platform.payments.list'),

            Menu::make('Complaints')
                ->icon('bs.exclamation-triangle')
                ->route('platform.systems.complaints'),

            Menu::make('Licenses')
                ->icon('bs.file-earmark-check')
                ->route('platform.systems.licenses')
                ->badge(function () {
                    return \App\Models\User::where('type', \App\Enums\Users\Type::Executor->value)
                        ->where('verification_status', \App\Enums\Users\VerificationStatus::Pending->value)
                        ->whereNotNull('license_file_path')
                        ->count() ?: null;
                }),

            Menu::make('Analytics')
                ->icon('bs.graph-up')
                ->route('platform.analytics'),

            Menu::make('Notifications')
                ->icon('bs.bell')
                ->route('platform.admin-notifications')
                ->badge(function () {
                    return \App\Models\AdminNotification::whereNull('read_at')
                        ->count() ?: null;
                }),

            Menu::make('Reports')
                ->icon('bs.file-earmark-text')
                ->route('platform.reports')
                ->divider(),

            Menu::make('Work Management')
                ->icon('bs.tools')
                ->title('Work Management'),

            Menu::make('Work Directions')
                ->icon('bs.diagram-3')
                ->route('platform.work-directions'),

            Menu::make('Work Types')
                ->icon('bs.list-task')
                ->route('platform.work-types'),

            Menu::make('Housing Options')
                ->icon('bs.house-gear')
                ->route('platform.housing-options')
                ->divider(),

            Menu::make('User Management')
                ->icon('bs.people-fill')
                ->route('platform.users.list')
                ->title('User Management'),

            Menu::make('Referral System')
                ->icon('bs.share')
                ->title('Referral Program'),

            Menu::make('Referral Settings')
                ->icon('bs.gear')
                ->route('platform.referrals.settings'),

            Menu::make('Referral Statistics')
                ->icon('bs.graph-up')
                ->route('platform.referrals.stats'),

            Menu::make('Manage Referrals')
                ->icon('bs.people')
                ->route('platform.referrals.list')
                ->divider(),

            Menu::make('Push Notifications')
                ->icon('bs.bell-fill')
                ->route('platform.push-notifications')
                ->title('Communications')
                ->badge(function () {
                    return \App\Models\ScheduledNotification::where('status', 'pending')
                        ->where('scheduled_at', '<=', now())
                        ->count() ?: null;
                })
                ->divider(),

            Menu::make('Partner Program')
                ->icon('bs.people-fill')
                ->route('platform.partners')
                ->title('Partner Program')
                ->badge(function () {
                    return \App\Models\PartnerReward::where('status', 'pending')
                        ->count() ?: null;
                }),
        ];
    }

    /**
     * Register permissions for the application.
     *
     * @return ItemPermission[]
     */
    public function permissions(): array
    {
        return [
            ItemPermission::group(__('System'))
                ->addPermission('platform.systems.banners', __('Banners'))
                ->addPermission('platform.systems.customers', __('Customers'))
                ->addPermission('platform.systems.executors', __('Executors'))
                ->addPermission('platform.systems.mediators', __('Mediators'))
                ->addPermission('platform.systems.orders', __('Orders'))
                ->addPermission('platform.systems.subscriptions', __('Subscriptions'))
                ->addPermission('platform.systems.wallets', __('Wallets'))
                ->addPermission('platform.systems.payments', __('Payments'))
                ->addPermission('platform.systems.complaints', 'Complaints')
                ->addPermission('platform.systems.licenses', 'Licenses')
                ->addPermission('platform.systems.analytics', 'Analytics')
                ->addPermission('platform.systems.notifications', 'Notifications')
                ->addPermission('platform.systems.reports', 'Reports')
                ->addPermission('platform.systems.work-directions', 'Work Directions')
                ->addPermission('platform.systems.work-types', 'Work Types')
                ->addPermission('platform.systems.housing-options', 'Housing Options')
                ->addPermission('platform.users.manage', 'User Management')
                ->addPermission('platform.referrals.manage', 'Referral System')
                ->addPermission('platform.push-notifications', 'Push Notifications'),
        ];
    }

    /**
     * Register the application profile menu.
     *
     * @return Menu[]
     */
    public function profile(): array
    {
        return [
            Menu::make('Profile')
                ->route('platform.profile')
                ->icon('bs.person'),

            Menu::make('Logout')
                ->route('platform.logout')
                ->icon('bs.box-arrow-right')
                ->method('POST'),
        ];
    }
}
