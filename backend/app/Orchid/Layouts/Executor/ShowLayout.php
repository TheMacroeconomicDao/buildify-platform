<?php

namespace App\Orchid\Layouts\Executor;

use App\Models\User;
use Orchid\Screen\Layouts\Legend;
use Orchid\Screen\Sight;

class ShowLayout extends Legend
{
    protected $target = 'executor';

    /**
     * @return iterable
     */
    protected function columns(): iterable
    {
        return [
            Sight::make('id', 'ID'),

            Sight::make('executor_reviews_avg_rating', __('Rating'))->render(function (User $executor) {
                return $executor->executor_reviews_avg_rating ?? 'N\A';
            }),

            Sight::make('executor_reviews_count', __('Reviews count')),

//            ●	Действующий тариф @todo
//            ●	Остаток по откликам по тарифу @todo
//            ●	Остаток по заказам по тарифу @todo

            Sight::make('executor_responses', __('Order responses'))
                ->render(function (User $executor) {
                    return implode('<br/>', $executor->executorResponses()->pluck('id')->toArray());
                }),

            Sight::make('created_at', __('Registered at')),

//            ●	Дата последней активности @todo
        ];
    }
}
