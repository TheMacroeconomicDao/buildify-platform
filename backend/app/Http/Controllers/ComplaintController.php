<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreComplaintRequest;
use App\Models\Complaint;
use App\Models\User;
use App\Services\ComplaintService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ComplaintController extends Controller
{
    private ComplaintService $complaintService;

    public function __construct(ComplaintService $complaintService)
    {
        $this->complaintService = $complaintService;
    }

    /**
     * Подать жалобу на пользователя
     */
    public function store(StoreComplaintRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $data['complainant_id'] = auth()->id();
            
            $complaint = $this->complaintService->createComplaint($data);

            return response()->json([
                'success' => true,
                'message' => __('complaint.created_successfully'),
                'result' => [
                    'complaint_id' => $complaint->id
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('complaint.creation_failed'),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить список жалоб текущего пользователя
     */
    public function index(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            throw_if(
                $user === null,
                new BadRequestHttpException(__('user.user_not_found'))
            );

            $sentComplaints = $user->sentComplaints()
                ->with(['reportedUser:id,name,email', 'order:id,title'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'result' => [
                    'sent_complaints' => $sentComplaints
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('complaint.fetch_failed'),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить возможные причины для жалоб
     */
    public function getReasons(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'result' => [
                'reasons' => Complaint::getReasons()
            ]
        ]);
    }

    /**
     * Получить детали конкретной жалобы
     */
    public function show(Complaint $complaint): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Проверяем, что пользователь может просматривать эту жалобу
            if ($complaint->complainant_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => __('complaint.access_denied')
                ], 403);
            }

            $complaint->load(['reportedUser:id,name,email', 'order:id,title']);

            return response()->json([
                'success' => true,
                'result' => [
                    'complaint' => $complaint
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('complaint.fetch_failed'),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
