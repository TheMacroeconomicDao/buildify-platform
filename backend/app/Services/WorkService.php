<?php

namespace App\Services;

use App\Models\WorkDirection;
use App\Models\WorkType;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class WorkService
{
    /**
     * Получить все активные направления работ
     */
    public static function getDirections(): array
    {
        $locale = App::getLocale();
        
        return WorkDirection::active()
            ->ordered()
            ->get()
            ->map(function (WorkDirection $direction) use ($locale) {
                return [
                    'id' => $direction->id,
                    'key' => $direction->key,
                    'name' => $direction->getLocalizedName($locale),
                    'description' => $direction->description,
                    'icon' => $direction->icon,
                    'sort_order' => $direction->sort_order,
                ];
            })
            ->toArray();
    }

    /**
     * Получить все активные типы работ, сгруппированные по направлениям
     */
    public static function getWorks(): array
    {
        $locale = App::getLocale();
        $result = [];

        $directions = WorkDirection::active()
            ->ordered()
            ->with(['activeWorkTypes'])
            ->get();

        foreach ($directions as $direction) {
            $result[$direction->key] = [];
            foreach ($direction->activeWorkTypes as $type) {
                $result[$direction->key][] = [
                    'id' => $type->id,
                    'key' => $type->key,
                    'name' => $type->getLocalizedName($locale),
                    'description' => $type->description,
                    'icon' => $type->icon,
                    'sort_order' => $type->sort_order,
                    'work_direction_id' => $direction->id,
                    'work_direction_key' => $direction->key,
                ];
            }
        }

        return $result;
    }

    /**
     * Получить все активные типы работ (плоский массив) - для обратной совместимости
     */
    public static function getWorksList(): array
    {
        $locale = App::getLocale();
        $result = [];

        $directions = WorkDirection::active()
            ->ordered()
            ->with(['activeWorkTypes'])
            ->get();

        foreach ($directions as $direction) {
            foreach ($direction->activeWorkTypes as $type) {
                $result[] = [
                    'id' => $type->id,
                    'key' => $type->key,
                    'name' => $type->getLocalizedName($locale),
                    'description' => $type->description,
                    'icon' => $type->icon,
                    'sort_order' => $type->sort_order,
                    'work_direction_id' => $direction->id,
                    'work_direction_key' => $direction->key,
                ];
            }
        }

        return $result;
    }

    /**
     * Получить типы работ для конкретного направления
     */
    public static function getWorksByDirection(string $directionKey): array
    {
        $locale = App::getLocale();
        
        $direction = WorkDirection::where('key', $directionKey)
            ->where('is_active', true)
            ->first();

        if (!$direction) {
            return [];
        }

        return $direction->activeWorkTypes
            ->map(function (WorkType $type) use ($locale) {
                return [
                    'id' => $type->id,
                    'key' => $type->key,
                    'name' => $type->getLocalizedName($locale),
                    'description' => $type->description,
                    'icon' => $type->icon,
                    'sort_order' => $type->sort_order,
                ];
            })
            ->toArray();
    }

    /**
     * Получить ключи направлений для валидации (обратная совместимость)
     */
    public static function getDirectionsForValidation(): array
    {
        return WorkDirection::active()->pluck('key')->toArray();
    }

    /**
     * Получить ключи типов работ для валидации (обратная совместимость)
     */
    public static function getWorksForValidation(): array
    {
        return WorkType::active()->pluck('key')->toArray();
    }

    /**
     * Проверить существование направления и типа работ
     * 
     * @param string $direction
     * @param string $type
     * @return void
     * @throws Throwable
     */
    public static function existsDirectionType(string $direction, string $type): void
    {
        $directionExists = WorkDirection::where('key', $direction)
            ->where('is_active', true)
            ->exists();

        throw_if(
            !$directionExists,
            NotFoundHttpException::class,
            __('work.exceptions.direction_not_found')
        );

        $typeExists = WorkType::whereHas('workDirection', function ($query) use ($direction) {
                $query->where('key', $direction)->where('is_active', true);
            })
            ->where('key', $type)
            ->where('is_active', true)
            ->exists();

        throw_if(
            !$typeExists,
            NotFoundHttpException::class,
            __('work.exceptions.type_not_found')
        );
    }

    /**
     * Получить направление работ по ключу
     */
    public static function getDirectionByKey(string $key): ?WorkDirection
    {
        return WorkDirection::where('key', $key)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Получить тип работ по ключу
     */
    public static function getWorkTypeByKey(string $key): ?WorkType
    {
        return WorkType::where('key', $key)
            ->where('is_active', true)
            ->with('workDirection')
            ->first();
    }
}
