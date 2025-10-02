<?php

namespace App\Observers;

use App\Models\Complaint;
use App\Services\NotificationService;

class ComplaintObserver
{
    private NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the Complaint "created" event.
     */
    public function created(Complaint $complaint): void
    {
        // Загружаем связанные модели
        $complaint->load(['complainant', 'reportedUser']);
        
        // Отправляем уведомление о новой жалобе
        $this->notificationService->notifyNewComplaint($complaint);
    }

    /**
     * Handle the Complaint "updated" event.
     */
    public function updated(Complaint $complaint): void
    {
        // Можно добавить уведомления об изменении статуса жалобы
        if ($complaint->wasChanged('status')) {
            // Логика для уведомлений об изменении статуса жалобы
        }
    }

    /**
     * Handle the Complaint "deleted" event.
     */
    public function deleted(Complaint $complaint): void
    {
        //
    }

    /**
     * Handle the Complaint "restored" event.
     */
    public function restored(Complaint $complaint): void
    {
        //
    }

    /**
     * Handle the Complaint "force deleted" event.
     */
    public function forceDeleted(Complaint $complaint): void
    {
        //
    }
}
