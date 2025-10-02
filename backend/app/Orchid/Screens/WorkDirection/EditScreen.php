<?php

namespace App\Orchid\Screens\WorkDirection;

use App\Models\WorkDirection;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Fields\CheckBox;
use Orchid\Screen\Fields\Group;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;

class EditScreen extends Screen
{
    /**
     * @var WorkDirection
     */
    public $workDirection;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(WorkDirection $workDirection): iterable
    {
        // Для новых записей создаем пустой объект с значениями по умолчанию
        if (!$workDirection->exists) {
            $workDirection->sort_order = 0;
            $workDirection->is_active = true;
            // Устанавливаем пустую структуру для мультиязычных полей
            $workDirection->name = ['en' => '', 'ar' => ''];
        }
        
        return [
            'workDirection' => $workDirection
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return $this->workDirection->exists ? 'Edit Work Direction' : 'Create Work Direction';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Create Work Direction')
                ->icon('bs.check-circle')
                ->canSee(!$this->workDirection->exists)
                ->method('createOrUpdate'),

            Button::make('Update')
                ->icon('bs.check-circle')
                ->canSee($this->workDirection->exists)
                ->method('createOrUpdate'),

            Button::make('Remove')
                ->icon('bs.trash3')
                ->confirm(__('Are you sure you want to delete this work direction?'))
                ->method('remove')
                ->canSee($this->workDirection->exists),
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
                Input::make('workDirection.key')
                    ->title('Key')
                    ->placeholder('Enter unique key (e.g., repair_and_construction)')
                    ->help('Unique identifier for API calls')
                    ->required(),

                Group::make([
                    Input::make('workDirection.name.en')
                        ->title('Name (English)')
                        ->placeholder('Enter name in English')
                        ->required(),

                    Input::make('workDirection.name.ar')
                        ->title('Name (Arabic)')
                        ->placeholder('Enter name in Arabic')
                        ->required(),
                ]),

                TextArea::make('workDirection.description')
                    ->title('Description')
                    ->placeholder('Enter description')
                    ->rows(3),

                Group::make([
                    Select::make('workDirection.icon')
                        ->title('Icon')
                        ->options([
                            'construction' => '🏗️ Construction',
                            'home' => '🏠 Home',
                            'repair' => '🔨 Repair & Maintenance',
                            'design' => '📐 Design & Architecture',
                            'cleaning' => '🧹 Cleaning Services',
                            'gardening' => '🌱 Gardening & Landscaping',
                            'moving' => '📦 Moving & Transportation',
                            'security' => '🔒 Security & Safety',
                            'technology' => '💻 Technology & IT',
                            'automotive' => '🚗 Automotive',
                            'beauty' => '💅 Beauty & Wellness',
                            'education' => '📚 Education & Training',
                            'health' => '⚕️ Health & Medical',
                            'business' => '💼 Business Services',
                            'entertainment' => '🎭 Entertainment',
                        ])
                        ->empty('No icon', '')
                        ->help('Select an icon for this work direction'),

                                    Input::make('workDirection.sort_order')
                    ->title('Sort Order')
                    ->type('number')
                    ->value($workDirection->sort_order ?? 0)
                    ->help('Order for displaying in lists'),
                ]),

                CheckBox::make('workDirection.is_active')
                    ->title('Active')
                    ->placeholder('Is this work direction active?')
                    ->value($workDirection->is_active ?? true)
                    ->sendTrueOrFalse(),
            ]),
        ];
    }

    /**
     * @param WorkDirection $workDirection
     * @param Request $request
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function createOrUpdate(WorkDirection $workDirection, Request $request)
    {
        try {
            $validationRules = [
                'workDirection.key' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('work_directions', 'key')->ignore($workDirection->id)
                ],
                'workDirection.name.en' => 'required|string|max:255',
                'workDirection.name.ar' => 'required|string|max:255',
                'workDirection.description' => 'nullable|string',
                'workDirection.icon' => 'nullable|string|max:255',
                'workDirection.sort_order' => 'nullable|integer|min:0',
                'workDirection.is_active' => 'boolean',
            ];
            
            $request->validate($validationRules);

            $data = $request->get('workDirection');
            
            // Устанавливаем значения по умолчанию для новых записей
            if (!$workDirection->exists) {
                $data['sort_order'] = $data['sort_order'] ?? 0;
                $data['is_active'] = $data['is_active'] ?? true;
            }

            $workDirection->fill($data)->save();

            Toast::info(__('Work direction was saved.'));

            return redirect()->route('platform.work-directions');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Toast::error('Validation failed: ' . implode(', ', $e->validator->errors()->all()));
            return back()->withInput();
        } catch (\Exception $e) {
            \Log::error('Error saving work direction: ' . $e->getMessage());
            Toast::error('Error saving work direction: ' . $e->getMessage());
            return back()->withInput();
        }
    }

    /**
     * @param WorkDirection $workDirection
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Exception
     */
    public function remove(WorkDirection $workDirection)
    {
        $workDirection->delete();

        Toast::info(__('Work direction was removed'));

        return redirect()->route('platform.work-directions');
    }
}