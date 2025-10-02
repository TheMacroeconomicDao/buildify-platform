<?php

declare(strict_types=1);

namespace App\Orchid\Layouts\Subscription;

use App\Models\Direction;
use Orchid\Screen\Field;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Picture;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Fields\Upload;
use Orchid\Screen\Layouts\Rows;

class SubscriptionEditLayout extends Rows
{
    /**
     * The screen's layout elements.
     *
     * @return Field[]
     */
    public function fields(): array
    {
        $subscription = $this->query->get('subscription');
        $amount = $subscription->amount / 100;
        return [
            Select::make('subscription.month')
                ->title('Period')
                ->options([
                    1 => 'Month',
                    3 => 'Quarter (3 months)',
                    6 => 'Six months (6 months)',
                    12 => 'Year (12 months)',
                ])
                ->horizontal(),


            Input::make('subscription.name')
                ->type('text')
                ->max(255)
                ->required()
                ->title(__('Name'))
                ->placeholder('subscription name')->horizontal(),

            Input::make('subscription.amount_render')
                ->type('text')
                ->max(255)
                ->required()
                ->title(__('Amount'))
                ->placeholder('100')
                ->value($amount)
                ->horizontal(),

            Select::make('subscription.directory.')
                ->fromModel(Direction::class, 'name_en-US')
                ->multiple()
                ->title(__('Directory'))
                ->help('Specify which groups this subscription should belong to')->horizontal(),
        ];
    }
}
