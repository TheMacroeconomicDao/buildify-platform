<?php

namespace App\Orchid\Screens;

use App\Models\HousingOption;
use Orchid\Screen\Screen;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\CheckBox;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;
use Illuminate\Http\Request;

class HousingOptionEditScreen extends Screen
{
    /**
     * @var HousingOption
     */
    public $housingOption;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(HousingOption $housingOption): iterable
    {
        return [
            'housingOption' => $housingOption
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return $this->housingOption->exists ? 'Edit Housing Option' : 'Create Housing Option';
    }

    /**
     * The description is displayed on the user's screen under the heading
     */
    public function description(): ?string
    {
        return "Configure housing options for order creation form";
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Button::make(__('Remove'))
                ->icon('trash')
                ->confirm(__('Once the housing option is deleted, all of its resources and data will be permanently deleted.'))
                ->method('remove')
                ->canSee($this->housingOption->exists),

            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
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
            Layout::rows([
                Select::make('housingOption.type')
                    ->title('Option Type')
                    ->options([
                        'housing_type' => 'Housing Type',
                        'housing_condition' => 'Housing Condition',
                        'housing_preparation_level' => 'Housing Preparation Level',
                        'bathroom_type' => 'Bathroom Type',
                    ])
                    ->required()
                    ->help('Select the category this option belongs to'),

                Input::make('housingOption.key')
                    ->title('Option Key')
                    ->placeholder('apartment')
                    ->required()
                    ->help('Unique identifier for this option (used in code)'),

                Input::make('housingOption.label_en')
                    ->title('English Label')
                    ->placeholder('Apartment')
                    ->required()
                    ->help('Display name in English'),

                Input::make('housingOption.label_ar')
                    ->title('Arabic Label')
                    ->placeholder('شقة')
                    ->required()
                    ->help('Display name in Arabic'),

                Input::make('housingOption.sort_order')
                    ->title('Sort Order')
                    ->type('number')
                    ->value(0)
                    ->help('Order in which this option appears (lower numbers first)'),

                CheckBox::make('housingOption.is_active')
                    ->title('Active')
                    ->placeholder('Is this option available for selection?')
                    ->sendTrueOrFalse(),
            ])
        ];
    }

    /**
     * @param HousingOption    $housingOption
     * @param Request $request
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save(HousingOption $housingOption, Request $request)
    {
        $request->validate([
            'housingOption.type' => 'required|string',
            'housingOption.key' => 'required|string',
            'housingOption.label_en' => 'required|string',
            'housingOption.label_ar' => 'required|string',
            'housingOption.sort_order' => 'integer',
        ]);

        $housingOption->fill($request->get('housingOption'))->save();

        Toast::info(__('Housing option was saved.'));

        return redirect()->route('platform.housing-options');
    }

    /**
     * @param HousingOption $housingOption
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Exception
     */
    public function remove(HousingOption $housingOption)
    {
        $housingOption->delete();

        Toast::info(__('Housing option was removed'));

        return redirect()->route('platform.housing-options');
    }
}
