<?php

namespace App\Orchid\Screens\WorkType;

use App\Models\WorkDirection;
use App\Models\WorkType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Fields\CheckBox;
use Orchid\Screen\Fields\Group;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;

class EditScreen extends Screen
{
    /**
     * @var WorkType
     */
    public $workType;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(WorkType $workType): iterable
    {
        // Для новых записей создаем пустой объект с значениями по умолчанию
        if (!$workType->exists) {
            $workType->sort_order = 0;
            $workType->is_active = true;
            // Устанавливаем пустую структуру для мультиязычных полей
            $workType->name = ['en' => '', 'ar' => ''];
        }
        
        return [
            'workType' => $workType
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return $this->workType->exists ? 'Edit Work Type' : 'Create Work Type';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Create Work Type')
                ->icon('bs.check-circle')
                ->canSee(!$this->workType->exists)
                ->method('createOrUpdate'),

            Button::make('Update')
                ->icon('bs.check-circle')
                ->canSee($this->workType->exists)
                ->method('createOrUpdate'),

            Button::make('Remove')
                ->icon('bs.trash3')
                ->confirm(__('Are you sure you want to delete this work type?'))
                ->method('remove')
                ->canSee($this->workType->exists),
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
                Select::make('workType.work_direction_id')
                    ->title('Work Direction')
                    ->options(function () {
                        return WorkDirection::active()
                            ->ordered()
                            ->get()
                            ->mapWithKeys(function ($direction) {
                                return [$direction->id => $direction->getLocalizedName('en')];
                            })
                            ->toArray();
                    })
                    ->required()
                    ->help('Select the work direction this type belongs to'),

                Input::make('workType.key')
                    ->title('Key')
                    ->placeholder('Enter unique key (e.g., bathroom_renovation)')
                    ->help('Unique identifier for API calls')
                    ->required(),

                Group::make([
                    Input::make('workType.name.en')
                        ->title('Name (English)')
                        ->placeholder('Enter name in English')
                        ->required(),

                    Input::make('workType.name.ar')
                        ->title('Name (Arabic)')
                        ->placeholder('Enter name in Arabic')
                        ->required(),
                ]),

                TextArea::make('workType.description')
                    ->title('Description')
                    ->placeholder('Enter description')
                    ->rows(3),

                Group::make([
                    Select::make('workType.icon')
                        ->title('Icon')
                        ->options([
                            'construction' => '🏗️ Construction',
                            'home' => '🏠 Home',
                            'plumbing' => '🔧 Plumbing',
                            'electrical' => '⚡ Electrical',
                            'painting' => '🎨 Painting',
                            'cleaning' => '🧹 Cleaning',
                            'gardening' => '🌱 Gardening',
                            'repair' => '🔨 Repair',
                            'design' => '📐 Design',
                            'renovation' => '🏘️ Renovation',
                            'bathroom' => '🚿 Bathroom',
                            'kitchen' => '🍳 Kitchen',
                            'flooring' => '🪟 Flooring',
                            'roofing' => '🏠 Roofing',
                            'hvac' => '🌡️ HVAC',
                            'security' => '🔒 Security',
                            'moving' => '📦 Moving',
                            'furniture' => '🪑 Furniture',
                            'lighting' => '💡 Lighting',
                            'windows' => '🪟 Windows',
                            'doors' => '🚪 Doors',
                            'tiles' => '🧱 Tiles',
                            'wallpaper' => '🖼️ Wallpaper',
                            'carpet' => '🪚 Carpet',
                            'marble' => '⚪ Marble',
                            'wood' => '🌳 Wood',
                            'metal' => '⚙️ Metal',
                            'glass' => '🔍 Glass',
                            'stone' => '🪨 Stone',
                        ])
                        ->empty('No icon', '')
                        ->help('Select an icon for this work type'),

                    Input::make('workType.sort_order')
                        ->title('Sort Order')
                        ->type('number')
                        ->value($workType->sort_order ?? 0)
                        ->help('Order for displaying in lists'),
                ]),

                CheckBox::make('workType.is_active')
                    ->title('Active')
                    ->placeholder('Is this work type active?')
                    ->value($workType->is_active ?? true)
                    ->sendTrueOrFalse(),
            ]),
        ];
    }

    /**
     * @param WorkType $workType
     * @param Request $request
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function createOrUpdate(WorkType $workType, Request $request)
    {
        try {
            $validationRules = [
                'workType.work_direction_id' => 'required|exists:work_directions,id',
                'workType.key' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('work_types', 'key')->ignore($workType->id)
                ],
                'workType.name.en' => 'required|string|max:255',
                'workType.name.ar' => 'required|string|max:255',
                'workType.description' => 'nullable|string',
                'workType.icon' => 'nullable|string|max:255',
                'workType.sort_order' => 'nullable|integer|min:0',
                'workType.is_active' => 'boolean',
            ];
            
            $request->validate($validationRules);

            $data = $request->get('workType');
            
            // Устанавливаем значения по умолчанию для новых записей
            if (!$workType->exists) {
                $data['sort_order'] = $data['sort_order'] ?? 0;
                $data['is_active'] = $data['is_active'] ?? true;
            }

            $workType->fill($data)->save();

            Toast::info(__('Work type was saved.'));

            return redirect()->route('platform.work-types');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Toast::error('Validation failed: ' . implode(', ', $e->validator->errors()->all()));
            return back()->withInput();
        } catch (\Exception $e) {
            \Log::error('Error saving work type: ' . $e->getMessage());
            Toast::error('Error saving work type: ' . $e->getMessage());
            return back()->withInput();
        }
    }

    /**
     * @param WorkType $workType
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Exception
     */
    public function remove(WorkType $workType)
    {
        $workType->delete();

        Toast::info(__('Work type was removed'));

        return redirect()->route('platform.work-types');
    }
}