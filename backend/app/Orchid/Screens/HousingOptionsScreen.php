<?php

namespace App\Orchid\Screens;

use App\Models\HousingOption;
use Orchid\Screen\Screen;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\TD;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;
use Illuminate\Http\Request;

class HousingOptionsScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): iterable
    {
        return [
            'housing_options' => HousingOption::orderBy('type')->orderBy('sort_order')->paginate()
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return 'Housing Options';
    }

    /**
     * The description is displayed on the user's screen under the heading
     */
    public function description(): ?string
    {
        return "Manage housing options for order creation";
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Create new')
                ->icon('plus')
                ->route('platform.housing-options.create')
        ];
    }

    /**
     * The screen's layout elements.
     *
     * @return \Orchid\Screen\Layout[]|string[]
     */
    public function layout(): iterable
    {
        return [
            Layout::table('housing_options', [
                TD::make('type', 'Type')
                    ->sort()
                    ->cantHide()
                    ->filter(TD::FILTER_TEXT)
                    ->render(function (HousingOption $option) {
                        return ucwords(str_replace('_', ' ', $option->type));
                    }),

                TD::make('key', 'Key')
                    ->sort()
                    ->cantHide()
                    ->filter(TD::FILTER_TEXT),

                TD::make('label_en', 'English Label')
                    ->sort()
                    ->cantHide()
                    ->filter(TD::FILTER_TEXT),

                TD::make('label_ar', 'Arabic Label')
                    ->sort()
                    ->cantHide()
                    ->filter(TD::FILTER_TEXT),

                TD::make('sort_order', 'Order')
                    ->sort()
                    ->cantHide(),

                TD::make('is_active', 'Status')
                    ->sort()
                    ->render(function (HousingOption $option) {
                        return $option->is_active 
                            ? '<span class="badge bg-success">Active</span>'
                            : '<span class="badge bg-danger">Inactive</span>';
                    }),

                TD::make('created_at', 'Created')
                    ->sort()
                    ->render(function (HousingOption $option) {
                        return $option->created_at->toDateTimeString();
                    }),

                TD::make(__('Actions'))
                    ->align(TD::ALIGN_CENTER)
                    ->width('100px')
                    ->render(function (HousingOption $option) {
                        return DropDown::make()
                            ->icon('options-vertical')
                            ->list([

                                Link::make(__('Edit'))
                                    ->route('platform.housing-options.edit', $option->id)
                                    ->icon('pencil'),

                                Button::make(__('Delete'))
                                    ->icon('trash')
                                    ->confirm(__('Once the option is deleted, all of its resources and data will be permanently deleted.'))
                                    ->method('remove')
                                    ->parameters([
                                        'id' => $option->id,
                                    ]),
                            ]);
                    }),
            ])
        ];
    }

    /**
     * @param Request $request
     */
    public function remove(Request $request): void
    {
        HousingOption::findOrFail($request->get('id'))->delete();

        Toast::info(__('Housing option was removed'));
    }
}
