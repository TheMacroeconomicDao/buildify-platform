<?php

namespace App\Providers;

use App\Listeners\StripeEventListener;
use App\Models\Order;
use App\Models\Complaint;
use App\Observers\OrderObserver;
use App\Observers\ComplaintObserver;
use App\Observers\PartnerProgramObserver;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Laravel\Cashier\Events\WebhookReceived;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        WebhookReceived::class => [
            StripeEventListener::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();

        // Регистрируем observers
        Order::observe(OrderObserver::class);
        Order::observe(PartnerProgramObserver::class); // Партнерская программа
        Complaint::observe(ComplaintObserver::class);
    }
}

