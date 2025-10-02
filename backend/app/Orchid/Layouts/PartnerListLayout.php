<?php

namespace App\Orchid\Layouts;

use App\Models\Partner;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class PartnerListLayout extends Table
{
    /**
     * Data source.
     *
     * The name of the key to fetch it from the query.
     * The results of which will be elements of the table.
     *
     * @var string
     */
    protected $target = 'partners';

    /**
     * Get the table cells to be displayed.
     *
     * @return TD[]
     */
    protected function columns(): iterable
    {
        return [
            TD::make('id', 'ID')
                ->sort()
                ->cantHide()
                ->width('80px'),

            TD::make('partner_id', 'Partner ID')
                ->sort()
                ->cantHide()
                ->render(function (Partner $partner) {
                    return Link::make($partner->partner_id)
                        ->route('platform.partners.edit', $partner->id);
                }),

            TD::make('name', 'Name')
                ->sort()
                ->render(function (Partner $partner) {
                    return $partner->name;
                }),

            TD::make('email', 'Email')
                ->render(function (Partner $partner) {
                    return $partner->email;
                }),

            TD::make('manager', 'Manager')
                ->render(function (Partner $partner) {
                    return $partner->manager ? $partner->manager->name : 'No Manager';
                }),

            TD::make('total_referrals', 'Referrals')
                ->render(function (Partner $partner) {
                    return "{$partner->total_referrals} ({$partner->active_referrals} active)";
                })
                ->sort()
                ->width('120px'),

            TD::make('total_earnings', 'Earnings')
                ->render(function (Partner $partner) {
                    return number_format($partner->total_earnings, 2) . ' AED';
                })
                ->sort()
                ->width('120px'),

            TD::make('pending_earnings', 'Pending')
                ->render(function (Partner $partner) {
                    return number_format($partner->pending_earnings, 2) . ' AED';
                })
                ->sort()
                ->width('100px'),

            TD::make('reward_type', 'Reward')
                ->render(function (Partner $partner) {
                    $type = $partner->reward_type === 'fixed' ? 'Fixed' : 'Percentage';
                    return "{$type}: {$partner->reward_value}" . ($partner->reward_type === 'percentage' ? '%' : ' AED');
                })
                ->width('120px'),

            TD::make('is_active', 'Status')
                ->render(function (Partner $partner) {
                    return $partner->is_active 
                        ? '<span class="badge bg-success">Active</span>'
                        : '<span class="badge bg-danger">Inactive</span>';
                })
                ->sort()
                ->width('100px'),

            TD::make('last_activity_at', 'Last Activity')
                ->render(function (Partner $partner) {
                    return $partner->last_activity_at 
                        ? $partner->last_activity_at->format('d.m.Y H:i')
                        : 'Never';
                })
                ->sort()
                ->width('150px'),

            TD::make(__('Actions'))
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (Partner $partner) {
                    return DropDown::make()
                        ->icon('bs.three-dots-vertical')
                        ->list([
                            Link::make(__('Edit'))
                                ->route('platform.partners.edit', $partner->id)
                                ->icon('bs.pencil'),

                            Link::make(__('View Stats'))
                                ->route('platform.partners.stats', $partner->id)
                                ->icon('bs.graph-up'),

                            Button::make($partner->is_active ? __('Deactivate') : __('Activate'))
                                ->icon($partner->is_active ? 'bs.pause' : 'bs.play')
                                ->confirm(__('Are you sure?'))
                                ->method('toggleStatus')
                                ->parameters(['id' => $partner->id]),

                            Button::make(__('Delete'))
                                ->icon('bs.trash3')
                                ->confirm(__('Are you sure you want to delete this partner?'))
                                ->method('remove')
                                ->parameters(['id' => $partner->id]),
                        ]);
                }),
        ];
    }
}
