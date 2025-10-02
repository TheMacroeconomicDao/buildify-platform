<?php

namespace App\Orchid\Screens\License;

use App\Models\User;
use App\Models\WorkDirection;
use App\Models\WorkType;
use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use Orchid\Screen\Screen;
use Orchid\Screen\TD;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Layouts\Table;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): array
    {
        return [
            'licenses' => User::where('type', Type::Executor->value)
                ->whereNotNull('license_file_path')
                ->with('works')
                ->orderByRaw("CASE 
                    WHEN verification_status = " . VerificationStatus::Pending->value . " THEN 1 
                    ELSE 2 
                END")
                ->orderBy('created_at', 'desc')
                ->paginate(15)
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return 'Executor Licenses';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): array
    {
        return [];
    }

    /**
     * The screen's layout elements.
     *
     * @return \Orchid\Screen\Layout[]|string[]
     */
    public function layout(): array
    {
        return [
            Layout::table('licenses', [
                TD::make('name', 'Executor')
                    ->render(function (User $user) {
                        return Link::make($user->name)
                            ->route('platform.systems.licenses.view', $user->id);
                    }),

                TD::make('work_categories', 'Work Categories')
                    ->render(function (User $user) {
                        if ($user->works->isEmpty()) {
                            return '<span class="text-muted">Not specified</span>';
                        }
                        
                        $categories = [];
                        $worksByDirection = $user->works->groupBy('direction');
                        
                        foreach ($worksByDirection as $direction => $works) {
                            $workDirection = WorkDirection::where('key', $direction)->first();
                            $directionName = $workDirection ? $workDirection->getLocalizedName('en') : ucfirst(str_replace('_', ' ', $direction));
                            
                            $types = [];
                            foreach ($works as $work) {
                                $workType = WorkType::where('key', $work->type)->first();
                                $typeName = $workType ? $workType->getLocalizedName('en') : ucfirst(str_replace('_', ' ', $work->type));
                                $types[] = $typeName;
                            }
                            
                            if (!empty($types)) {
                                $categories[] = $directionName . ': ' . implode(', ', array_slice($types, 0, 2)) . (count($types) > 2 ? ' +' . (count($types) - 2) . ' more' : '');
                            }
                        }
                        
                        $totalCount = $user->works->count();
                        $displayCategories = implode('<br>', array_slice($categories, 0, 2));
                        if (count($categories) > 2) {
                            $displayCategories .= '<br><small class="text-muted">+' . (count($categories) - 2) . ' more categories</small>';
                        }
                        
                        return "<small>{$displayCategories}</small><br><span class='badge bg-info'>{$totalCount} types</span>";
                    }),

                TD::make('license_file', 'License File')
                    ->render(function (User $user) {
                        $fileName = basename($user->license_file_path);
                        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
                        return "<span class='badge bg-light text-dark'>.{$extension}</span> " . $fileName;
                    }),

                TD::make('verification_status', 'Status')
                    ->render(function (User $user) {
                        $badgeClass = match($user->verification_status) {
                            VerificationStatus::Pending->value => 'bg-warning text-dark',
                            VerificationStatus::Approved->value => 'bg-success text-white',
                            VerificationStatus::Rejected->value => 'bg-danger text-white',
                            default => 'bg-secondary text-white'
                        };
                        
                        $statusText = match($user->verification_status) {
                            VerificationStatus::Pending->value => 'Pending Review',
                            VerificationStatus::Approved->value => 'Approved',
                            VerificationStatus::Rejected->value => 'Rejected',
                            default => 'Not Required'
                        };
                        
                        return "<span class='badge {$badgeClass}' style='font-size: 12px; padding: 4px 8px;'>{$statusText}</span>";
                    }),

                TD::make('updated_at', 'Uploaded')
                    ->render(function (User $user) {
                        if ($user->updated_at instanceof \Carbon\Carbon) {
                            return $user->updated_at->format('d.m.Y H:i');
                        }
                        return $user->updated_at ? date('d.m.Y H:i', strtotime($user->updated_at)) : '-';
                    }),

                TD::make('verified_at', 'Verified')
                    ->render(function (User $user) {
                        if (!$user->verified_at) {
                            return '-';
                        }
                        if ($user->verified_at instanceof \Carbon\Carbon) {
                            return $user->verified_at->format('d.m.Y H:i');
                        }
                        return date('d.m.Y H:i', strtotime($user->verified_at));
                    }),

                TD::make('actions', 'Actions')
                    ->render(function (User $user) {
                        return DropDown::make()
                            ->icon('bs.three-dots-vertical')
                            ->list([
                                Link::make('View')
                                    ->icon('bs.eye')
                                    ->route('platform.systems.licenses.view', $user->id),
                                
                                Link::make('Download License')
                                    ->icon('bs.download')
                                    ->href(route('admin.download-executor-license', $user->id))
                                    ->target('_blank'),

                                Button::make('Approve')
                                    ->icon('bs.check-circle')
                                    ->confirm('Approve this executor\'s license?')
                                    ->method('approve', ['user' => $user->id])
                                    ->canSee($user->verification_status === VerificationStatus::Pending->value),

                                Button::make('Reject')
                                    ->icon('bs.x-circle')
                                    ->confirm('Reject this executor\'s license?')
                                    ->method('reject', ['user' => $user->id])
                                    ->canSee($user->verification_status === VerificationStatus::Pending->value),
                            ]);
                    }),
            ])
        ];
    }

    /**
     * Approve executor license
     */
    public function approve(Request $request)
    {
        $user = User::findOrFail($request->get('user'));
        
        $user->update([
            'verification_status' => VerificationStatus::Approved->value,
            'verification_comment' => 'License approved by administrator',
            'verified_at' => now(),
        ]);

        // Принудительно вызываем Observer для отправки WebSocket уведомлений
        $user->refresh();
        event(new \App\Events\UserNotificationEvent(
            'verification_status_changed',
            'Лицензия одобрена',
            'Ваша лицензия была одобрена администратором. Теперь вы можете откликаться на заказы.',
            [
                'user_id' => $user->id,
                'verification_status' => $user->verification_status,
                'verification_comment' => $user->verification_comment,
                'verified_at' => $user->verified_at?->toISOString(),
                'old_status' => VerificationStatus::Pending->value,
            ],
            $user->id
        ));

        Toast::success('Executor license approved');
        
        return redirect()->route('platform.systems.licenses');
    }

    /**
     * Reject executor license
     */
    public function reject(Request $request)
    {
        $user = User::findOrFail($request->get('user'));
        
        $user->update([
            'verification_status' => VerificationStatus::Rejected->value,
            'verification_comment' => 'License rejected by administrator',
            'verified_at' => now(),
        ]);

        // Принудительно вызываем Observer для отправки WebSocket уведомлений
        $user->refresh();
        event(new \App\Events\UserNotificationEvent(
            'verification_status_changed',
            'Лицензия отклонена',
            'Ваша лицензия была отклонена администратором. Пожалуйста, загрузите новую лицензию.',
            [
                'user_id' => $user->id,
                'verification_status' => $user->verification_status,
                'verification_comment' => $user->verification_comment,
                'verified_at' => $user->verified_at?->toISOString(),
                'old_status' => VerificationStatus::Pending->value,
            ],
            $user->id
        ));

        Toast::warning('Executor license rejected');
        
        return redirect()->route('platform.systems.licenses');
    }
}
