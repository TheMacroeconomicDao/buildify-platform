<?php

namespace App\Http\Controllers;

use App\Models\ReviewReply;
use App\Models\ExecutorReview;
use App\Models\CustomerReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewReplyController extends Controller
{
    /**
     * Создать ответ на отзыв исполнителя
     */
    public function replyToExecutorReview(Request $request, int $reviewId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reply_text' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $review = ExecutorReview::findOrFail($reviewId);
            $user = auth()->user();

            // Проверяем права на ответ: только исполнитель может отвечать на отзыв о себе
            if ($review->executor_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only reply to reviews about yourself'
                ], 403);
            }

            // Проверяем, что пользователь еще не отвечал на этот отзыв
            $existingReply = ReviewReply::where('review_type', 'executor_review')
                ->where('review_id', $reviewId)
                ->where('author_id', $user->id)
                ->first();

            if ($existingReply) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already replied to this review'
                ], 400);
            }

            $reply = ReviewReply::create([
                'review_type' => 'executor_review',
                'review_id' => $reviewId,
                'author_id' => $user->id,
                'reply_text' => $request->reply_text,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Reply created successfully',
                'result' => [
                    'id' => $reply->id,
                    'reply_text' => $reply->reply_text,
                    'author' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                    ],
                    'created_at' => $reply->created_at->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create reply'
            ], 500);
        }
    }

    /**
     * Создать ответ на отзыв заказчика
     */
    public function replyToCustomerReview(Request $request, int $reviewId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reply_text' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $review = CustomerReview::findOrFail($reviewId);
            $user = auth()->user();

            // Проверяем права на ответ: только заказчик может отвечать на отзыв о себе
            if ($review->customer_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only reply to reviews about yourself'
                ], 403);
            }

            // Проверяем, что пользователь еще не отвечал на этот отзыв
            $existingReply = ReviewReply::where('review_type', 'customer_review')
                ->where('review_id', $reviewId)
                ->where('author_id', $user->id)
                ->first();

            if ($existingReply) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already replied to this review'
                ], 400);
            }

            $reply = ReviewReply::create([
                'review_type' => 'customer_review',
                'review_id' => $reviewId,
                'author_id' => $user->id,
                'reply_text' => $request->reply_text,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Reply created successfully',
                'result' => [
                    'id' => $reply->id,
                    'reply_text' => $reply->reply_text,
                    'author' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                    ],
                    'created_at' => $reply->created_at->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create reply'
            ], 500);
        }
    }

    /**
     * Получить ответы на отзыв
     */
    public function getReplies(Request $request, string $reviewType, int $reviewId): JsonResponse
    {
        try {
            // Валидация типа отзыва
            if (!in_array($reviewType, ['executor_review', 'customer_review'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid review type'
                ], 400);
            }

            // Проверяем, что отзыв существует
            if ($reviewType === 'executor_review') {
                $review = ExecutorReview::findOrFail($reviewId);
            } else {
                $review = CustomerReview::findOrFail($reviewId);
            }

            $replies = ReviewReply::with('author:id,name,avatar')
                ->where('review_type', $reviewType)
                ->where('review_id', $reviewId)
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'result' => $replies->map(function ($reply) {
                    return [
                        'id' => $reply->id,
                        'reply_text' => $reply->reply_text,
                        'author' => [
                            'id' => $reply->author->id,
                            'name' => $reply->author->name,
                            'avatar' => $reply->author->avatar,
                        ],
                        'created_at' => $reply->created_at->toISOString(),
                    ];
                })
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get replies'
            ], 500);
        }
    }
}