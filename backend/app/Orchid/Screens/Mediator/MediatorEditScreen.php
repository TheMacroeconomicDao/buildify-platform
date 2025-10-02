<?php

declare(strict_types=1);

namespace App\Orchid\Screens\Mediator;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use App\Orchid\Layouts\Mediator\MediatorEditLayout;
use App\Orchid\Layouts\Mediator\MediatorMarginLayout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Alert;
use Orchid\Support\Facades\Layout;

class MediatorEditScreen extends Screen
{
    /**
     * @var User
     */
    public $mediator;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(User $user): iterable
    {
        $this->mediator = $user;
        return [
            'mediator' => $user->exists ? $user : new User(),
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return $this->mediator->exists ? 'Edit Mediator' : 'Create Mediator';
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        return 'Managing mediator data and margin settings';
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
                ->icon('bs.trash3')
                ->confirm('Are you sure you want to delete this mediator?')
                ->method('remove')
                ->canSee($this->mediator->exists),

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
            Layout::block(MediatorEditLayout::class)
                ->title('Basic Information')
                ->description('Basic mediator data'),

            Layout::block(MediatorMarginLayout::class)
                ->title('Margin and Price Settings')
                ->description('Manual management of margins and contract prices')
                ->canSee($this->mediator->exists),
        ];
    }

    /**
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save(User $user, Request $request)
    {
        try {
            // Валидация данных
            $request->validate([
                'mediator.name' => 'required|string|max:255',
                'mediator.email' => [
                    'required',
                    'email',
                    Rule::unique('users', 'email')
                        ->ignore($user->id)
                        ->where(function ($query) {
                            return $query->where('status', '!=', Status::Deleted->value);
                        })
                ],
                'mediator.phone' => 'nullable|string|max:20',
                'mediator.status' => 'required|integer|in:' . implode(',', [Status::Active->value, Status::Inactive->value]),
                'mediator.password' => 'nullable|string|min:6',
            ]);

            $mediatorData = $request->get('mediator');

            // Set type as mediator
            $mediatorData['type'] = Type::Mediator->value;
            
            // Убеждаемся, что статус передается корректно
            if (!isset($mediatorData['status'])) {
                $mediatorData['status'] = Status::Active->value;
            }

            // Hash password if provided
            if (!empty($mediatorData['password'])) {
                $mediatorData['password'] = Hash::make($mediatorData['password']);
            } else {
                unset($mediatorData['password']);
            }

            $user->fill($mediatorData)->save();

            Alert::info('Mediator successfully saved');

            return redirect()->route('platform.systems.mediators');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Alert::error('Validation failed: ' . implode(', ', $e->validator->errors()->all()));
            return back()->withInput();
        } catch (\Exception $e) {
            Alert::error('Error saving mediator: ' . $e->getMessage());
            return back()->withInput();
        }
    }

    /**
     * @return \Illuminate\Http\RedirectResponse
     *
     * @throws \Exception
     */
    public function remove(User $user)
    {
        $user->delete();

        Alert::info('Mediator deleted');

        return redirect()->route('platform.systems.mediators');
    }
}
