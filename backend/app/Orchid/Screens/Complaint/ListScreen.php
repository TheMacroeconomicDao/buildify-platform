<?php

namespace App\Orchid\Screens\Complaint;

use App\Models\Complaint;
use App\Orchid\Layouts\Complaint\FilterLayout;
use App\Orchid\Layouts\Complaint\ListLayout;
use App\Services\ComplaintService;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class ListScreen extends Screen
{

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): iterable
    {
        return [
            'complaints' => Complaint::with(['complainant', 'reportedUser', 'order'])
                ->filters()
                ->defaultSort('id', 'desc')
                ->paginate(),
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'User Complaints';
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        return 'Management of user complaints on the platform';
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
            // Temporarily remove problematic link
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
            FilterLayout::class,
            ListLayout::class,
        ];
    }

    /**
     * Change complaint status
     */
    public function updateStatus(int $complaint, string $status): void
    {
        try {
            $complaintModel = Complaint::findOrFail($complaint);
            $complaintService = app(ComplaintService::class);
            $complaintService->updateComplaintStatus($complaintModel, $status);
            
            Toast::success('Complaint status successfully updated');
        } catch (\Exception $e) {
            Toast::error('Error updating status: ' . $e->getMessage());
        }
    }
}
