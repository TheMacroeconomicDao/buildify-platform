<?php

namespace App\Http\Controllers;

use App\Enums\Users\Type;
use App\Models\User;
use App\Services\WorkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExecutorController extends Controller
{
    /**
     * Получить список исполнителей
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->where('type', Type::Executor->value)
            ->where('status', 1); // только активные

        // Поиск по имени
        if ($request->has('search') && !empty($request->search)) {
            $query->where('name', 'LIKE', '%' . $request->search . '%');
        }

        // Фильтр по минимальному рейтингу
        if ($request->has('min_rating') && $request->min_rating > 0) {
            $query->where('average_rating', '>=', $request->min_rating);
        }

        // Сортировка
        $sortBy = $request->get('sort_by', 'name');
        $sortDirection = $request->get('sort_direction', 'asc');

        switch ($sortBy) {
            case 'rating':
                $query->orderBy('average_rating', $sortDirection);
                break;
            case 'orders_count':
                $query->withCount('executorOrders')
                      ->orderBy('executor_orders_count', $sortDirection);
                break;
            case 'name':
            default:
                $query->orderBy('name', $sortDirection);
                break;
        }

        // Загружаем связанные данные
        $query->withCount(['executorOrders', 'executorReviews'])
              ->with(['works']);

        $executors = $query->get()->map(function (User $executor) {
            // Получаем категории работ исполнителя
            $categories = $executor->works->map(function ($work) {
                $directionLabel = $this->getWorkDirectionLabel($work->direction);
                
                if ($work->type !== $work->direction) {
                    $typeLabel = $this->getWorkTypeLabel($work->type);
                    return $directionLabel . ' - ' . $typeLabel;
                }
                
                return $directionLabel;
            })->unique()->values()->toArray();

            return [
                'id' => $executor->id,
                'name' => $executor->name,
                'email' => $executor->email,
                'phone' => $executor->phone,
                'avatar' => $executor->avatar,
                'average_rating' => $executor->average_rating,
                'reviews_count' => $executor->executor_reviews_count,
                'orders_count' => $executor->executor_orders_count,
                'categories' => $categories,
                'created_at' => $executor->created_at->format('Y-m-d'),
            ];
        });

        return response()->json([
            'success' => true,
            'result' => $executors,
        ]);
    }

    /**
     * Получить профиль исполнителя
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $executor = User::where('type', Type::Executor->value)
            ->where('id', $id)
            ->withCount(['executorOrders', 'executorReviews'])
            ->with(['works', 'executorReviews.author', 'executorPortfolios', 'executorPortfolios.files.file'])
            ->first();

        if (!$executor) {
            return response()->json([
                'success' => false,
                'message' => 'Executor not found',
            ], 404);
        }

        // Получаем категории работ исполнителя
        $categories = $executor->works->map(function ($work) {
            $directionLabel = $this->getWorkDirectionLabel($work->direction);
            
            if ($work->type !== $work->direction) {
                $typeLabel = $this->getWorkTypeLabel($work->type);
                return $directionLabel . ' - ' . $typeLabel;
            }
            
            return $directionLabel;
        })->unique()->values()->toArray();

        // Получаем последние отзывы
        $reviews = $executor->executorReviews->map(function ($review) {
            return [
                'id' => $review->id,
                'rating' => $review->rating,
                'text' => $review->text,
                'created_at' => $review->created_at->format('Y-m-d H:i'),
                'author' => [
                    'id' => $review->author->id,
                    'name' => $review->author->name,
                    'avatar' => $review->author->avatar,
                ],
            ];
        });

        // Получаем портфолио
        $portfolios = $executor->executorPortfolios->map(function ($portfolio) {
            return $this->formatPortfolioResponse($portfolio);
        });

        return response()->json([
            'success' => true,
            'result' => [
                'id' => $executor->id,
                'name' => $executor->name,
                'email' => $executor->email,
                'phone' => $executor->phone,
                'avatar' => $executor->avatar,
                'average_rating' => $executor->average_rating,
                'reviews_count' => $executor->executor_reviews_count,
                'orders_count' => $executor->executor_orders_count,
                'categories' => $categories,
                'reviews' => $reviews,
                'portfolios' => $portfolios,
                'created_at' => $executor->created_at->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Получить лейбл направления работ
     */
    private function getWorkDirectionLabel(string $directionKey): string
    {
        $direction = WorkService::getDirectionByKey($directionKey);
        if ($direction) {
            return $direction->getLocalizedName(app()->getLocale());
        }

        // Fallback для старых данных
        $translation = __('work.directions.' . $directionKey);
        return $translation !== 'work.directions.' . $directionKey 
            ? $translation 
            : ucfirst(str_replace('_', ' ', $directionKey));
    }

    /**
     * Получить лейбл типа работ
     */
    private function getWorkTypeLabel(string $typeKey): string
    {
        $workType = WorkService::getWorkTypeByKey($typeKey);
        if ($workType) {
            return $workType->getLocalizedName(app()->getLocale());
        }

        // Fallback для старых данных
        $translation = __('work.types.' . $typeKey);
        return $translation !== 'work.types.' . $typeKey 
            ? $translation 
            : ucfirst(str_replace('_', ' ', $typeKey));
    }

    /**
     * Форматирование ответа для портфолио
     */
    private function formatPortfolioResponse($portfolio): array
    {
        $result = [
            'id' => $portfolio->id,
            'name' => $portfolio->name,
            'description' => $portfolio->description,
            'type' => $portfolio->type,
            'created_at' => $portfolio->created_at->toISOString(),
        ];

        if ($portfolio->isLinkType()) {
            $result['external_url'] = $portfolio->external_url;
        }

        if ($portfolio->isMediaType()) {
            $result['files'] = $portfolio->files->map(function ($portfolioFile) {
                return [
                    'id' => $portfolioFile->file->id,
                    'path' => $portfolioFile->file->url, // ← Полный URL
                    'name' => $portfolioFile->file->name,
                    'size' => $portfolioFile->file->size ?? null,
                    'sort_order' => $portfolioFile->sort_order,
                ];
            });
        }

        return $result;
    }
}