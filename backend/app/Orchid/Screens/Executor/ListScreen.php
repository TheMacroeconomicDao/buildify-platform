<?php

namespace App\Orchid\Screens\Executor;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use App\Orchid\Layouts\Executor\FilterLayout;
use App\Orchid\Layouts\Executor\ListLayout;
use Orchid\Screen\Action;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class ListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): iterable
    {
        return [
            'executors' => User::with('roles')
                ->filters(FilterLayout::class)
                ->where('type', Type::Executor->value)
                ->where('status', '!=', Status::Deleted->value)
                ->withCount(['executorReviews', 'executorResponses',])
                ->withAvg('executorReviews', 'rating')
                ->defaultSort('id', 'desc')
                ->paginate(),
        ];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Executors');
    }

    /**
     * Button commands.
     *
     * @return Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make(__('Create'))
                ->icon('plus')
                ->route('platform.systems.executors.create'),
        ];
    }

    /**
     * Views.
     *
     * @return Layout[]|string[]
     */
    public function layout(): iterable
    {
        return [
            FilterLayout::class,
            ListLayout::class,
        ];
    }

    public function remove(User $executor): void
    {
        //-- проверка на активные подписки
//        if (!) {
//            Toast::warning(__('Executor has subscriptions'));
//            return;
//        }

        $executor->update([
            'status' => Status::Deleted->value,
        ]);

        Toast::info(__('Deleted'));
    }
}
