<?php

namespace App\Orchid\Screens\Customer;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use App\Orchid\Layouts\Customer\EditLayout;
use App\Rules\PhoneNumberCheck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class CreateScreen extends Screen
{
    public function query(): iterable
    {
        return ['customer' => null];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Create customer');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
                ->route('platform.systems.customers.create'),
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
            EditLayout::class,
        ];
    }

    public function save(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer.email' => [
                'required',
                Rule::unique('users', 'email')->where(function ($query) {
                    return $query->where('status', '!=', Status::Deleted->value);
                })
            ],
            'customer.phone' => [
                'required',
                Rule::unique('users', 'phone')->where(function ($query) {
                    return $query->where('status', '!=', Status::Deleted->value);
                }),
                new PhoneNumberCheck,
            ],
            'customer.name' => ['required', 'string',],
            'customer.telegram' => ['nullable', 'string',],
            'customer.whatsApp' => ['nullable', new PhoneNumberCheck,],
            'customer.facebook' => ['nullable', 'string',],
            'customer.viber' => ['nullable', 'string',],
        ])['customer'];

        $data['type'] = Type::Customer->value;

        $customer = User::create($data);

        Toast::info(__('Customer created'));

        return redirect()->route('platform.systems.customers.edit', ['customer' => $customer->id,]);
    }
}
