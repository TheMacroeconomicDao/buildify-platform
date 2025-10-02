<?php

namespace App\Http\Controllers;

use App\Models\HousingOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HousingOptionController extends Controller
{
    /**
     * Get all housing options grouped by type
     */
    public function index(): JsonResponse
    {
        $options = HousingOption::where('is_active', true)
            ->orderBy('type')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('type');

        $result = [];
        foreach ($options as $type => $typeOptions) {
            $result[$type] = $typeOptions->map(function ($option) {
                return [
                    'key' => $option->key,
                    'label_en' => $option->label_en,
                    'label_ar' => $option->label_ar,
                ];
            });
        }

        return response()->json([
            'success' => true,
            'result' => $result
        ]);
    }

    /**
     * Get options for specific type
     */
    public function getByType(string $type): JsonResponse
    {
        $options = HousingOption::byType($type)->get();

        return response()->json([
            'success' => true,
            'result' => $options->map(function ($option) {
                return [
                    'key' => $option->key,
                    'label_en' => $option->label_en,
                    'label_ar' => $option->label_ar,
                ];
            })
        ]);
    }
}
