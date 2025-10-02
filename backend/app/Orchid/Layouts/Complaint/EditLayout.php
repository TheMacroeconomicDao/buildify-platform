<?php

namespace App\Orchid\Layouts\Complaint;

use App\Models\Complaint;
use Orchid\Screen\Layouts\Rows;
use Orchid\Screen\Field;

class EditLayout extends Rows
{
    /**
     * Used to create the title of a group of form elements.
     *
     * @var string|null
     */
    protected $title = 'Complaint Information';

    /**
     * Get the fields elements to be displayed.
     *
     * @return Field[]
     */
    protected function fields(): iterable
    {
        return [
            Field::make('complaint.id')
                ->type('text')
                ->readonly()
                ->title('Complaint ID'),

            Field::make('complaint.complainant.name')
                ->type('text')
                ->readonly()
                ->title('Complainant'),

            Field::make('complaint.complainant.email')
                ->type('email')
                ->readonly()
                ->title('Complainant Email'),

            Field::make('complaint.reported_user.name')
                ->type('text')
                ->readonly()
                ->title('Reported User'),

            Field::make('complaint.reported_user.email')
                ->type('email')
                ->readonly()
                ->title('Reported User Email'),

            Field::make('complaint.order.title')
                ->type('text')
                ->readonly()
                ->title('Related Order')
                ->canSee(fn($complaint) => isset($complaint['complaint']['order'])),

            Field::make('complaint.reason')
                ->type('select')
                ->options([
                    'inappropriate_behavior' => 'Inappropriate Behavior',
                    'poor_quality_work' => 'Poor Quality Work',
                    'non_payment' => 'Non-payment',
                    'fraud' => 'Fraud',
                    'spam' => 'Spam',
                    'fake_profile' => 'Fake Profile',
                    'other' => 'Other',
                ])
                ->readonly()
                ->title('Complaint Reason'),

            Field::make('complaint.comment')
                ->type('textarea')
                ->readonly()
                ->title('Comment')
                ->rows(4),

            Field::make('complaint.status')
                ->type('select')
                ->options([
                    'pending' => 'Pending',
                    'reviewing' => 'Under Review',
                    'resolved' => 'Resolved',
                    'rejected' => 'Rejected',
                ])
                ->title('Status')
                ->help('Changing status will send notification to complainant'),

            Field::make('complaint.admin_comment')
                ->type('textarea')
                ->title('Administrator Comment')
                ->rows(4)
                ->help('This comment will be seen by the complainant'),

            Field::make('complaint.created_at')
                ->type('datetime-local')
                ->readonly()
                ->title('Created Date'),

            Field::make('complaint.reviewed_at')
                ->type('datetime-local')
                ->readonly()
                ->title('Review Date'),
        ];
    }
}
