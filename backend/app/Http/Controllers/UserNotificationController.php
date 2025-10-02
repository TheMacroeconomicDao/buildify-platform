<?php

namespace App\Http\Controllers;

use App\Http\Requests\Notification\ReadNotificationRequest;
use App\Services\UserNotificationService;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Illuminate\Http\JsonResponse;

class UserNotificationController extends Controller
{
    /**
     * @var UserNotificationService
     */
    private UserNotificationService $userNotificationService;

    /**
     * @param UserNotificationService $userNotificationService
     */
    public function __construct(UserNotificationService $userNotificationService)
    {
        $this->userNotificationService = $userNotificationService;
    }

    /**
     * @return JsonResponse
     * @throws \Throwable
     */
    public function getCountUnreadNotifications(): JsonResponse
    {
        throw_if(
            auth()->user() === null,
            new BadRequestHttpException(__('user.user_not_found'))
        );

        $count = $this->userNotificationService->getCountUnreadNotifications(auth()->user()->id);

        return response()->json([
            'success' => true,
            'result' => [
                'count' => $count
            ]
        ]);
    }

    /**
     * @return JsonResponse
     * @throws \Throwable
     */
    public function getNotifications(): JsonResponse
    {
        throw_if(
            auth()->user() === null,
            new BadRequestHttpException(__('user.user_not_found'))
        );

        $notifications = $this->userNotificationService->getNotifications(auth()->user()->id);

        return response()->json([
            'success' => true,
            'result' => [
                'notifications' => $notifications
            ]
        ]);
    }

    /**
     * @param ReadNotificationRequest $request
     * @return JsonResponse
     * @throws \Throwable
     */
    public function readNotifications(ReadNotificationRequest $request): JsonResponse
    {
        throw_if(
            auth()->user() === null,
            new BadRequestHttpException(__('user.user_not_found'))
        );

        $result = $this->userNotificationService->readNotifications(auth()->user()->id, $request->ids);

        return response()->json([
            'success' => true,
            'result' => [
                'count_update' => $result
            ]
        ]);
    }

}
