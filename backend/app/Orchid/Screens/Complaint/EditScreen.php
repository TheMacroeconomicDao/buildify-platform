<?php

namespace App\Orchid\Screens\Complaint;

use App\Models\Complaint;
use App\Orchid\Layouts\Complaint\EditLayout;
use App\Services\ComplaintService;
use Illuminate\Http\Request;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;
use Orchid\Support\Color;

class EditScreen extends Screen
{
    public $complaint;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(Complaint $complaint): iterable
    {
        $complaint->load(['complainant', 'reportedUser', 'order']);

        return [
            'complaint' => $complaint,
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return $this->complaint->exists 
            ? "Complaint #{$this->complaint->id}" 
            : 'New Complaint';
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        if ($this->complaint->exists) {
            return "Complaint from {$this->complaint->complainant->name} against {$this->complaint->reportedUser->name}";
        }
        return 'Creating new complaint';
    }

    /**
     * The permissions required to access this screen.
     */
    public function permission(): ?iterable
    {
        return [
            'platform.systems.complaints',
        ];
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Back to List')
                ->icon('bs.arrow-left')
                ->route('platform.systems.complaints'),

            Button::make('Save')
                ->icon('bs.check-circle')
                ->method('save')
                ->type(Color::PRIMARY),
        ];
    }

    /**
     * The screen's layout elements.
     *
     * @return string[]|\Orchid\Screen\Layout[]
     */
    public function layout(): iterable
    {
        return [
            EditLayout::class,
        ];
    }

    /**
     * Save complaint changes
     */
    public function save(Request $request, Complaint $complaint): void
    {
        try {
            $data = $request->get('complaint');
            
            $complaintService = app(ComplaintService::class);
            $complaintService->updateComplaintStatus(
                $complaint,
                $data['status'],
                $data['admin_comment'] ?? null
            );

            Toast::success('Complaint successfully updated');
        } catch (\Exception $e) {
            Toast::error('Error saving: ' . $e->getMessage());
        }
    }
}
