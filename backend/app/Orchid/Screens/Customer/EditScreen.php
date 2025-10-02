<?php

namespace App\Orchid\Screens\Customer;

use App\Enums\Users\Status;
use App\Models\User;
use App\Orchid\Layouts\Customer\EditLayout;
use App\Orchid\Layouts\Customer\ShowLayout;
use App\Rules\PhoneNumberCheck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class EditScreen extends Screen
{
    private ?User $customer = null;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(User $customer): iterable
    {
        $customer->loadCount(['customerOrders',]);

        $this->customer = $customer;

        return [
            'customer' => $customer,
        ];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Customer');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
                ->route('platform.systems.customers.edit', ['customer' => $this->customer->id]),
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
            ShowLayout::class,
            EditLayout::class,
        ];
    }

    public function save(User $customer, Request $request): RedirectResponse
    {
        $this->customer = $customer;

        $data = $request->validate([
            'customer.email' => [
                'required',
                Rule::unique('users', 'email')
                    ->ignore($customer->id)
                    ->where(function ($query) {
                        return $query->where('status', '!=', Status::Deleted->value);
                    })
            ],
            'customer.phone' => [
                'required',
                Rule::unique('users', 'phone')
                    ->ignore($customer->id)
                    ->where(function ($query) {
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

        $customer->update($data);

        Toast::info(__('Customer updated'));

        return redirect()->route('platform.systems.customers.edit', ['customer' => $customer->id,]);
    }
}
