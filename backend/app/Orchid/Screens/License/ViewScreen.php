<?php

namespace App\Orchid\Screens\License;

use App\Models\User;
use App\Models\WorkDirection;
use App\Models\WorkType;
use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use Orchid\Screen\Screen;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Fields\Group;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;
use Orchid\Support\Color;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ViewScreen extends Screen
{
    /**
     * @var User
     */
    public $user;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(User $user): array
    {
        // Check that this is an executor with a license
        if ($user->type !== Type::Executor->value || !$user->license_file_path) {
            abort(404, 'License not found');
        }

        $this->user = $user->load('works');

        return [
            'user' => $user,
            'verification' => [
                'status' => $user->verification_status,
                'comment' => $user->verification_comment,
            ],
            'work_categories' => $this->getWorkCategoriesText($user),
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return 'Executor License: ' . $this->user->name;
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): array
    {
        return [
            Link::make('Back to List')
                ->icon('bs.arrow-left')
                ->route('platform.systems.licenses'),

            Link::make('Download License')
                ->icon('bs.download')
                ->href(route('admin.download-executor-license', $this->user->id))
                ->target('_blank'),

            Button::make('Approve')
                ->icon('bs.check-circle')
                ->confirm('Approve this executor\'s license?')
                ->method('approve')
                ->type(Color::SUCCESS)
                ->canSee($this->user->verification_status === VerificationStatus::Pending->value),

            Button::make('Reject')
                ->icon('bs.x-circle')
                ->confirm('Reject this executor\'s license?')
                ->method('reject')
                ->type(Color::DANGER)
                ->canSee($this->user->verification_status === VerificationStatus::Pending->value),
        ];
    }

    /**
     * The screen's layout elements.
     *
     * @return \Orchid\Screen\Layout[]|string[]
     */
    public function layout(): array
    {
        return [
            Layout::rows([
                Group::make([
                    Input::make('user.name')
                        ->title('Executor Name')
                        ->readonly(),

                    Input::make('user.email')
                        ->title('Email')
                        ->readonly(),
                ]),

                Group::make([
                    Input::make('user.phone')
                        ->title('Phone')
                        ->readonly(),

                    Input::make('status_display')
                        ->title('Current Status')
                        ->value($this->getStatusText())
                        ->readonly(),
                ]),

                Group::make([
                    Input::make('license_uploaded')
                        ->title('License Upload Date')
                        ->value($this->user->created_at instanceof \Carbon\Carbon 
                            ? $this->user->created_at->format('d.m.Y H:i') 
                            : ($this->user->created_at ? date('d.m.Y H:i', strtotime($this->user->created_at)) : '-'))
                        ->readonly(),

                    Input::make('user.verified_at')
                        ->title('Verification Date')
                        ->value($this->user->verified_at 
                            ? ($this->user->verified_at instanceof \Carbon\Carbon 
                                ? $this->user->verified_at->format('d.m.Y H:i') 
                                : date('d.m.Y H:i', strtotime($this->user->verified_at)))
                            : 'Not verified')
                        ->readonly(),
                ]),

                Group::make([
                    Input::make('license_file')
                        ->title('License File')
                        ->value(basename($this->user->license_file_path))
                        ->readonly(),

                    Input::make('file_size')
                        ->title('File Size')
                        ->value($this->getFileSize())
                        ->readonly(),
                ]),

                TextArea::make('work_categories')
                    ->title('Work Categories')
                    ->value($this->getWorkCategoriesText($this->user))
                    ->readonly()
                    ->rows(6)
                    ->help('Categories and types of work that the executor can perform'),

                TextArea::make('verification.comment')
                    ->title('Verification Comment')
                    ->placeholder('Enter comment (optional)')
                    ->rows(3)
                    ->help('Comment will be saved when approving or rejecting'),

                $this->user->verification_comment ? 
                    TextArea::make('previous_comment')
                        ->title('Previous Comment')
                        ->value($this->user->verification_comment)
                        ->readonly()
                        ->rows(2) : null,
            ])->title('Executor Information')
        ];
    }

    /**
     * Get text representation of status
     */
    private function getStatusText(): string
    {
        return match($this->user->verification_status) {
            VerificationStatus::Pending->value => '⏳ Pending Review',
            VerificationStatus::Approved->value => '✅ Approved',
            VerificationStatus::Rejected->value => '❌ Rejected',
            default => '❓ Not Required'
        };
    }

    /**
     * Get license file size
     */
    private function getFileSize(): string
    {
        if (!$this->user->license_file_path || !Storage::disk('local')->exists($this->user->license_file_path)) {
            return 'File not found';
        }

        $sizeBytes = Storage::disk('local')->size($this->user->license_file_path);
        
        if ($sizeBytes < 1024) {
            return $sizeBytes . ' B';
        } elseif ($sizeBytes < 1024 * 1024) {
            return round($sizeBytes / 1024, 2) . ' KB';
        } else {
            return round($sizeBytes / (1024 * 1024), 2) . ' MB';
        }
    }

    /**
     * Get formatted text of work categories
     */
    private function getWorkCategoriesText(User $user): string
    {
        if ($user->works->isEmpty()) {
            return 'No work categories specified';
        }

        $categories = [];
        
        // Group works by direction
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
                $categories[] = $directionName . ': ' . implode(', ', $types);
            }
        }
        
        return implode("\n", $categories);
    }

    /**
     * Approve executor license
     */
    public function approve(Request $request)
    {
        $comment = $request->get('verification.comment', 'License approved by administrator');
        
        $this->user->update([
            'verification_status' => VerificationStatus::Approved->value,
            'verification_comment' => $comment,
            'verified_at' => now(),
        ]);

        // Принудительно вызываем Observer для отправки WebSocket уведомлений
        $this->user->refresh();
        event(new \App\Events\UserNotificationEvent(
            'verification_status_changed',
            'License Approved',
            'Your license has been approved by the administrator. You can now respond to orders.',
            [
                'user_id' => $this->user->id,
                'verification_status' => $this->user->verification_status,
                'verification_comment' => $this->user->verification_comment,
                'verified_at' => $this->user->verified_at?->toISOString(),
                'old_status' => VerificationStatus::Pending->value,
            ],
            $this->user->id
        ));

        Toast::success('Executor license approved');
        
        return redirect()->route('platform.systems.licenses');
    }

    /**
     * Reject executor license
     */
    public function reject(Request $request)
    {
        $comment = $request->get('verification.comment', 'License rejected by administrator');
        
        $this->user->update([
            'verification_status' => VerificationStatus::Rejected->value,
            'verification_comment' => $comment,
            'verified_at' => now(),
        ]);

        // Принудительно вызываем Observer для отправки WebSocket уведомлений
        $this->user->refresh();
        event(new \App\Events\UserNotificationEvent(
            'verification_status_changed',
            'License Rejected',
            'Your license has been rejected by the administrator. Please upload a new license.',
            [
                'user_id' => $this->user->id,
                'verification_status' => $this->user->verification_status,
                'verification_comment' => $this->user->verification_comment,
                'verified_at' => $this->user->verified_at?->toISOString(),
                'old_status' => VerificationStatus::Pending->value,
            ],
            $this->user->id
        ));

        Toast::warning('Executor license rejected');
        
        return redirect()->route('platform.systems.licenses');
    }
}
