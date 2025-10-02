<?php

declare(strict_types=1);

namespace App\Orchid\Screens\Mediator;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use App\Orchid\Layouts\Mediator\MediatorCreateLayout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Alert;
use Orchid\Support\Facades\Layout;

class MediatorCreateScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): iterable
    {
        return [
            'mediator' => new User(),
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Create Mediator';
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        return 'Creating a new mediator in the system';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('bs.check-circle')
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
            Layout::block(MediatorCreateLayout::class)
                ->title('Basic Information')
                ->description('Basic data of the new mediator'),
        ];
    }

    /**
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save(Request $request)
    {
        try {
            // Валидация данных
            $request->validate([
                'mediator.name' => 'required|string|max:255',
                'mediator.email' => [
                    'required',
                    'email',
                    Rule::unique('users', 'email')->where(function ($query) {
                        return $query->where('status', '!=', Status::Deleted->value);
                    })
                ],
                'mediator.phone' => 'nullable|string|max:20',
                'mediator.password' => 'required|string|min:6',
            ]);

            $mediatorData = $request->get('mediator');

            // Set type as mediator
            $mediatorData['type'] = Type::Mediator->value;
            $mediatorData['status'] = Status::Active->value;

            // Hash password
            if (!empty($mediatorData['password'])) {
                $mediatorData['password'] = Hash::make($mediatorData['password']);
            } else {
                // Если пароль пустой при создании, генерируем случайный
                $mediatorData['password'] = Hash::make('password123');
            }

            $mediator = new User();
            $mediator->fill($mediatorData)->save();

            Alert::info('Mediator successfully created');

            return redirect()->route('platform.systems.mediators.edit', $mediator);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Alert::error('Validation failed: ' . implode(', ', $e->validator->errors()->all()));
            return back()->withInput();
        } catch (\Exception $e) {
            Alert::error('Error creating mediator: ' . $e->getMessage());
            return back()->withInput();
        }
    }
}
