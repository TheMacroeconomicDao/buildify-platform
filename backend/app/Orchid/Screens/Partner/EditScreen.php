<?php

namespace App\Orchid\Screens\Partner;

use App\Models\Partner;
use App\Models\Manager;
use App\Models\User;
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
     * @var Partner
     */
    public $partner;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(Partner $partner): iterable
    {
        if (!$partner->exists) {
            $partner->partner_id = Partner::generatePartnerId();
            $partner->reward_type = Partner::REWARD_TYPE_PERCENTAGE;
            $partner->reward_value = 5.00; // 5% по умолчанию
            $partner->min_payout = 100.00;
            $partner->is_active = true;
        }
        
        return [
            'partner' => $partner
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return $this->partner->exists ? 'Edit Partner' : 'Create Partner';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Create Partner')
                ->icon('bs.check-circle')
                ->canSee(!$this->partner->exists)
                ->method('createOrUpdate'),

            Button::make('Update')
                ->icon('bs.check-circle')
                ->canSee($this->partner->exists)
                ->method('createOrUpdate'),

            Button::make('Remove')
                ->icon('bs.trash3')
                ->confirm(__('Are you sure you want to delete this partner?'))
                ->method('remove')
                ->canSee($this->partner->exists),
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
                Group::make([
                    Input::make('partner.partner_id')
                        ->title('Partner ID')
                        ->placeholder('Auto-generated unique ID')
                        ->readonly()
                        ->help('Unique identifier for referral links'),

                    Select::make('partner.manager_id')
                        ->title('Manager')
                        ->options(function () {
                            return Manager::active()
                                ->get()
                                ->mapWithKeys(function ($manager) {
                                    return [$manager->id => $manager->name];
                                })
                                ->toArray();
                        })
                        ->empty('No Manager')
                        ->help('Assign this partner to a manager'),
                ]),

                Group::make([
                    Input::make('partner.name')
                        ->title('Partner Name')
                        ->placeholder('Enter partner name')
                        ->required(),

                    Input::make('partner.email')
                        ->title('Email')
                        ->type('email')
                        ->placeholder('Enter email address')
                        ->required(),
                ]),

                Group::make([
                    Input::make('partner.phone')
                        ->title('Phone')
                        ->placeholder('Enter phone number'),

                    Select::make('partner.user_id')
                        ->title('Linked User Account')
                        ->options(function () {
                            return User::where('type', \App\Enums\Users\Type::Executor->value)
                                ->get()
                                ->mapWithKeys(function ($user) {
                                    return [$user->id => "{$user->name} ({$user->email})"];
                                })
                                ->toArray();
                        })
                        ->empty('No Linked Account')
                        ->help('Link to executor account for balance payouts'),
                ]),

                TextArea::make('partner.description')
                    ->title('Description')
                    ->placeholder('Enter partner description')
                    ->rows(3),

                Group::make([
                    Select::make('partner.reward_type')
                        ->title('Reward Type')
                        ->options([
                            Partner::REWARD_TYPE_PERCENTAGE => 'Percentage',
                            Partner::REWARD_TYPE_FIXED => 'Fixed Amount',
                        ])
                        ->required(),

                    Input::make('partner.reward_value')
                        ->title('Reward Value')
                        ->type('number')
                        ->step(0.01)
                        ->placeholder('5.00')
                        ->required()
                        ->help('Percentage (%) or fixed amount (AED)'),
                ]),

                Group::make([
                    Input::make('partner.min_payout')
                        ->title('Minimum Payout (AED)')
                        ->type('number')
                        ->step(0.01)
                        ->placeholder('100.00')
                        ->required(),

                    CheckBox::make('partner.auto_approve')
                        ->title('Auto Approve Rewards')
                        ->placeholder('Automatically approve partner rewards')
                        ->sendTrueOrFalse(),
                ]),

                Group::make([
                    CheckBox::make('partner.is_active')
                        ->title('Active')
                        ->placeholder('Is this partner active?')
                        ->value($this->partner->is_active ?? true)
                        ->sendTrueOrFalse(),

                    Input::make('partner.source')
                        ->title('Source')
                        ->placeholder('How did we acquire this partner?')
                        ->help('e.g., direct, website, referral'),
                ]),
            ]),
        ];
    }

    /**
     * @param Partner $partner
     * @param Request $request
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function createOrUpdate(Partner $partner, Request $request)
    {
        try {
            $validationRules = [
                'partner.partner_id' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('partners', 'partner_id')->ignore($partner->id)
                ],
                'partner.name' => 'required|string|max:255',
                'partner.email' => [
                    'required',
                    'email',
                    Rule::unique('partners', 'email')->ignore($partner->id)
                ],
                'partner.phone' => 'nullable|string|max:20',
                'partner.description' => 'nullable|string',
                'partner.manager_id' => 'nullable|exists:managers,id',
                'partner.user_id' => 'nullable|exists:users,id',
                'partner.reward_type' => 'required|in:fixed,percentage',
                'partner.reward_value' => 'required|numeric|min:0',
                'partner.min_payout' => 'required|numeric|min:1',
                'partner.auto_approve' => 'boolean',
                'partner.is_active' => 'boolean',
                'partner.source' => 'nullable|string|max:100',
            ];
            
            $request->validate($validationRules);

            $data = $request->get('partner');
            
            // Генерируем partner_id для новых записей
            if (!$partner->exists) {
                $data['partner_id'] = Partner::generatePartnerId();
            }

            $partner->fill($data)->save();

            // Обновляем статистику
            $partner->updateStats();

            Toast::info(__('Partner was saved.'));

            return redirect()->route('platform.partners');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Toast::error('Validation failed: ' . implode(', ', $e->validator->errors()->all()));
            return back()->withInput();
        } catch (\Exception $e) {
            \Log::error('Error saving partner: ' . $e->getMessage());
            Toast::error('Error saving partner: ' . $e->getMessage());
            return back()->withInput();
        }
    }

    /**
     * @param Partner $partner
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Exception
     */
    public function remove(Partner $partner)
    {
        $partner->delete();

        Toast::info(__('Partner was removed'));

        return redirect()->route('platform.partners');
    }
}
