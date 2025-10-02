<?php

namespace App\Services;


use App\Enums\Users\Type;
use App\Models\ExecutorReview;
use App\Models\User;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ExecutorReviewService
{
    /**
     * @param int $authorId
     * @param array $data
     * @return ExecutorReview
     */
    public function store(int $authorId, array $data): ExecutorReview
    {
        $data['author_id'] = $authorId;

        $review = ExecutorReview::create($data);

        // Пересчитываем рейтинг исполнителя
        $executor = User::find($data['executor_id']);
        if ($executor) {
            $executor->recalculateRating();
        }

        return $review;
    }

    public function getAll(int $executorId): Collection
    {
        $executor = User::query()
            ->where('type', Type::Executor->value)
            ->where('id', $executorId)
            ->with(['executorReviews', 'executorReviews.author',])
            ->firstOr(function () {
                throw new NotFoundHttpException(__('user.executor_not_found'));
            });

        return $executor->executorReviews->map(function (ExecutorReview $review) {
            return [
                'id' => $review->id,
                'order_id' => $review->order_id,
                'author' => [
                    'avatar' => $review->author->avatar,
                    'name' => $review->author->name,
                ],
                'rating' => $review->rating,
                'text' => $review->text,
            ];
        });

    }
}
