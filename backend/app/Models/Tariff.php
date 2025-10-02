<?php
// app/Models/Subscription.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Orchid\Attachment\Attachable;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class Tariff extends Model
{
    use AsSource, Filterable, Attachable;

    protected $fillable = [
        'name',
        'stripe_product_id',
        'stripe_price_id',
        'duration_days',
        'max_orders',
        'max_contacts',
        'price',
        'is_active',
        'is_test'
    ];

   // protected $allowedFilters = [
   //     'name',
   //     'price',
   //     'duration_days',
   //     'is_active'
   // ];

    protected $allowedSorts = [
        'name',
        'price',
        'duration_days',
        'created_at'
    ];
}
