<?php

namespace App\Orchid\Layouts\Executor;

use App\Enums\Order\Status as OrderStatus;
use App\Enums\Users\Status;
use App\Enums\Users\VerificationStatus;
use App\Models\User;
use App\Models\UserWork;
use App\Models\WorkDirection;
use App\Models\WorkType;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class ListLayout extends Table
{
    /**
     * @var string
     */
    public $target = 'executors';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make()
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (User $executor) {
                    return DropDown::make()
                        ->icon('options-vertical')
                        ->list([
                            Link::make(__('Edit'))
                                ->route('platform.systems.executors.edit', $executor->id)
                                ->icon('pencil'),

                            Button::make(__('Delete'))
                                ->icon('trash')
                                ->confirm(__('Are you sure?'))
                                ->method('remove', [
                                    'executor' => $executor->id,
                                ]),
                        ]);
                }),

            TD::make('id', __('ID'))->sort(),
            TD::make('name', __('Name'))->sort(),
            TD::make('phone', __('Phone')),
            TD::make('email', __('Email'))->sort(),
            TD::make('telegram', __('Telegram')),
            TD::make('whatsApp', __('WhatsApp')),
            TD::make('facebook', __('Facebook')),
            TD::make('viber', __('Viber')),
                    TD::make('verification_status', 'License')
            ->render(function (User $executor) {
                if (!$executor->license_file_path) {
                    return '<span class="badge bg-secondary">Not uploaded</span>';
                }
                
                $badgeClass = match($executor->verification_status) {
                    VerificationStatus::Pending->value => 'bg-warning text-dark',
                    VerificationStatus::Approved->value => 'bg-success text-white',
                    VerificationStatus::Rejected->value => 'bg-danger text-white',
                    default => 'bg-secondary text-white'
                };
                
                $statusText = match($executor->verification_status) {
                    VerificationStatus::Pending->value => 'Under Review',
                    VerificationStatus::Approved->value => 'Verified',
                    VerificationStatus::Rejected->value => 'Rejected',
                    default => 'Not Required'
                };
                
                return "<span class='badge {$badgeClass}' style='font-size: 11px; padding: 3px 6px;'>{$statusText}</span>";
            }),

//            Attachments count @todo
//            TD::make('attachments_count', __('Attachments count'))
//                ->render(function (User $executor) {
//                    return '';
//                }),

            TD::make('works', __('Works'))
                ->width('300px')
                ->render(function (User $executor) {
                if (!$executor->works()->exists()) {
                    return 'N/A';
                }
                
                $works = $executor->works()->get()->map(function (UserWork $work) {
                    // Получаем направление и тип из БД
                    $direction = WorkDirection::where('key', $work->direction)->first();
                    $workType = WorkType::where('key', $work->type)->first();
                    
                    $directionName = $direction ? $direction->getLocalizedName('en') : ucfirst(str_replace('_', ' ', $work->direction));
                    $typeName = $workType ? $workType->getLocalizedName('en') : ucfirst(str_replace('_', ' ', $work->type));
                    
                    if ($work->direction === $work->type) {
                        return $directionName;
                    }

                    return $directionName . ' - ' . $typeName;
                })->toArray();
                
                $worksHtml = implode('<br/>', $works);
                
                return '<div style="max-height: 150px; overflow-y: auto; padding-right: 5px;">' . $worksHtml . '</div>';
            }),

            TD::make('executor_reviews_avg_rating', __('Rating'))->render(function (User $executor) {
                return $executor->executor_reviews_avg_rating ?? 'N\A';
            }),

            TD::make('executor_reviews_count', __('Reviews count')),
//            ●	Active tariff @todo
//            ●	Remaining responses by tariff @todo
//            ●	Remaining orders by tariff @todo
            TD::make('active_orders', __('Active orders'))->render(function (User $executor) {
                $query = $executor->executorOrders()
                    ->whereIn('status', OrderStatus::activeStatuses());

                return $query->exists()
                    ? implode('<br/>',
                        $query->get()->map(function ($order) {
                            return $order->id . '|' . $order->title;
                        })->toArray())
                    : 'N/A';
            }),
            TD::make('executor_responses_count', __('Order responses count')),

            TD::make('created_at', __('Registered at')),

//            ●	Last activity date @todo

            TD::make('status', __('Status'))->render(function (User $executor) {
                return __('user.status.' . Status::from($executor->status)->name);
            }),
        ];
    }
}
