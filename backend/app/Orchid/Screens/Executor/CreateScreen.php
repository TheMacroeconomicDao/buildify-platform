<?php

namespace App\Orchid\Screens\Executor;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use App\Models\UserWork;
use App\Orchid\Layouts\Executor\EditLayout;
use App\Orchid\Layouts\Executor\WorkLayout;
use App\Rules\PhoneNumberCheck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        return ['executor' => null];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Create executor');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
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
            EditLayout::class,
            WorkLayout::class,
        ];
    }

    public function save(Request $request): RedirectResponse
    {
        $executor = DB::transaction(function () use ($request) {
            $data = $request->validate([
                'executor.name' => ['required', 'string',],
                'executor.about_me' => ['nullable', 'string',],
                'executor.email' => [
                    'required',
                    Rule::unique('users', 'email')->where(function ($query) {
                        return $query->where('status', '!=', Status::Deleted->value);
                    })
                ],
                'executor.phone' => [
                    'required',
                    Rule::unique('users', 'phone')->where(function ($query) {
                        return $query->where('status', '!=', Status::Deleted->value);
                    }),
                    new PhoneNumberCheck,
                ],
                'executor.telegram' => ['nullable', 'string',],
                'executor.whatsApp' => ['nullable', 'string',],
                'executor.facebook' => ['nullable', 'string',],
                'executor.viber' => ['nullable', 'string',],

                'password' => ['required', 'string',],
            ])['executor'];

            $data['password'] = Hash::make($request->password);
            $data['type'] = Type::Executor->value;

            $executor = User::create($data);

            foreach ($request->get('works', []) as $direction => $types) {
                foreach ($types as $type => $value) {
                    if ($value === '1') {
                        UserWork::firstOrCreate([
                            'user_id' => $executor->id,
                            'direction' => $direction,
                            'type' => $type,
                        ]);
                    }
                }
            }

            return $executor->refresh();
        });

        Toast::info(__('Executor created'));

        return redirect()->route('platform.systems.executors.edit', ['executor' => $executor->id,]);
    }
}
