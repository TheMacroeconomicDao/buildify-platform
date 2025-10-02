<?php

namespace App\Http\Controllers;

use App\Http\Requests\Reviews\StoreRequest;
use App\Services\ExecutorReviewService;
use Illuminate\Http\JsonResponse;

class ExecutorReviewsController extends Controller
{
    protected ExecutorReviewService $reviewsService;

    public function __construct(ExecutorReviewService $reviewsService)
    {
        $this->reviewsService = $reviewsService;
    }

    public function store(StoreRequest $request): JsonResponse
    {
        $this->reviewsService->store(auth()->user()->id, $request->validated());

        return response()->json([
            'success' => true,
        ]);
    }

    public function index(int $executorId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'result' => $this->reviewsService->getAll($executorId),
        ]);
    }
}
