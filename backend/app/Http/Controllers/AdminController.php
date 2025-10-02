<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\ExecutorVerificationRequest;
use App\Services\AdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AdminController extends Controller
{
    protected AdminService $adminService;

    public function __construct(AdminService $adminService)
    {
        $this->adminService = $adminService;
    }

    /**
     * Получить список исполнителей ожидающих верификации
     * @return JsonResponse
     */
    public function getPendingExecutors(): JsonResponse
    {
        $result = $this->adminService->getPendingExecutors();

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * Получить всех исполнителей с их статусами
     * @return JsonResponse
     */
    public function getAllExecutors(): JsonResponse
    {
        $result = $this->adminService->getAllExecutors();

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * Верифицировать исполнителя (одобрить или отклонить)
     * @param ExecutorVerificationRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function verifyExecutor(ExecutorVerificationRequest $request): JsonResponse
    {
        $result = $this->adminService->verifyExecutor($request);

        return response()->json([
            'success' => true,
            'message' => $result,
        ]);
    }

    /**
     * Скачать файл лицензии исполнителя
     * @param Request $request
     * @param int $executorId
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
     * @throws Throwable
     */
    public function downloadExecutorLicense(Request $request, int $executorId)
    {
        try {
            return $this->adminService->getExecutorLicense($executorId);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 404);
        }
    }
}