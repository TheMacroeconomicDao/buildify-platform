<?php

namespace App\Http\Controllers;

use App\Services\ChatGPTDesignService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class DesignGenerationController extends Controller
{
    private ChatGPTDesignService $designService;

    public function __construct(ChatGPTDesignService $designService)
    {
        $this->designService = $designService;
    }

    /**
     * Генерация дизайна интерьера
     */
    public function generateDesign(Request $request): JsonResponse
    {
        // Увеличиваем время выполнения для генерации изображений
        set_time_limit(180); // 3 минуты
        
        $validator = Validator::make($request->all(), [
            'description' => 'required|string|min:10|max:1000',
            'room_type' => 'sometimes|array',
            'room_type.*' => 'string|in:living_room,bedroom,kitchen,bathroom,dining_room,office,children_room,guest_room,balcony,other',
            'style' => 'sometimes|array',
            'style.*' => 'string|in:modern,classic,minimalist,scandinavian,industrial,arabic,luxury,eco_friendly,contemporary,traditional',
            'budget' => 'sometimes|array',
            'budget.min' => 'required_with:budget|numeric|min:1000',
            'budget.max' => 'nullable|numeric|min:1000|gte:budget.min',
            'photos' => 'sometimes|array|max:10',
            'photos.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:10240', // max 10MB per image
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        Log::info('Design generation request', [
            'user_id' => $user ? $user->id : null,
            'description' => $request->description,
            'room_type' => $request->room_type ?? [],
            'style' => $request->style ?? [],
            'budget' => $request->budget ?? null
        ]);

        try {
            // Обработка загруженных фотографий (опционально)
            $photoData = [];
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $photoData[] = [
                        'path' => $photo->getRealPath(),
                        'name' => $photo->getClientOriginalName(),
                        'mime' => $photo->getMimeType(),
                        'size' => $photo->getSize(),
                    ];
                }
            }
            
            // Если фотографий нет, передаем пустой массив
            Log::info('Photo data for design generation', [
                'photos_count' => count($photoData),
                'has_photos' => !empty($photoData)
            ]);

            $result = $this->designService->generateInteriorDesign(
                $request->description,
                $request->room_type ?? [],
                $request->style ?? [],
                $request->budget ?? null,
                $photoData,
                $user ? $user->id : null
            );

            if (!$result['success']) {
                // Определяем тип ошибки и соответствующий HTTP статус
                $errorMessage = $result['error'] ?? 'Unknown error';
                $httpStatus = 500;

                if (str_contains($errorMessage, 'exceeded your current quota')) {
                    $httpStatus = 402; // Payment Required
                } elseif (str_contains($errorMessage, 'rate limit')) {
                    $httpStatus = 429; // Too Many Requests
                } elseif (str_contains($errorMessage, 'authentication') || str_contains($errorMessage, 'API key')) {
                    $httpStatus = 401; // Unauthorized
                } elseif (str_contains($errorMessage, 'model') && str_contains($errorMessage, 'not found')) {
                    $httpStatus = 503; // Service Unavailable
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Design generation failed',
                    'error' => $errorMessage
                ], $httpStatus);
            }

            // Сохраняем результат для пользователя (опционально)
            if ($user) {
                $this->saveDesignForUser($user->id, $result);
            }

            return response()->json([
                'success' => true,
                'message' => 'Design generated successfully',
                'data' => [
                    'design' => $result['design'],
                    'images' => $result['images'] ?? [],
                    'tokens_used' => $result['tokens_used'] ?? 0,
                    'generation_id' => $result['generation_id'],
                    'generated_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Design generation controller error', [
                'error' => $e->getMessage(),
                'user_id' => $user ? $user->id : null
            ]);

            // Определяем тип ошибки и соответствующий HTTP статус
            $errorMessage = $e->getMessage();
            $httpStatus = 500;

            if (str_contains($errorMessage, 'exceeded your current quota')) {
                $httpStatus = 402; // Payment Required
            } elseif (str_contains($errorMessage, 'rate limit')) {
                $httpStatus = 429; // Too Many Requests
            } elseif (str_contains($errorMessage, 'authentication') || str_contains($errorMessage, 'API key')) {
                $httpStatus = 401; // Unauthorized
            } elseif (str_contains($errorMessage, 'model') && str_contains($errorMessage, 'not found')) {
                $httpStatus = 503; // Service Unavailable
            }

            return response()->json([
                'success' => false,
                'message' => 'Design generation failed',
                'error' => $errorMessage
            ], $httpStatus);
        }
    }

    /**
     * Генерация вариаций дизайна
     */
    public function generateVariations(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'original_design' => 'required|string|min:50',
            'count' => 'sometimes|integer|min:1|max:5'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->designService->generateDesignVariations(
                $request->original_design,
                $request->count ?? 3
            );

            if (!$result['success']) {
                // Определяем тип ошибки и соответствующий HTTP статус
                $errorMessage = $result['error'] ?? 'Unknown error';
                $httpStatus = 500;

                if (str_contains($errorMessage, 'exceeded your current quota')) {
                    $httpStatus = 402; // Payment Required
                } elseif (str_contains($errorMessage, 'rate limit')) {
                    $httpStatus = 429; // Too Many Requests
                } elseif (str_contains($errorMessage, 'authentication') || str_contains($errorMessage, 'API key')) {
                    $httpStatus = 401; // Unauthorized
                } elseif (str_contains($errorMessage, 'model') && str_contains($errorMessage, 'not found')) {
                    $httpStatus = 503; // Service Unavailable
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Variation generation failed',
                    'error' => $errorMessage
                ], $httpStatus);
            }

            return response()->json([
                'success' => true,
                'message' => 'Design variations generated successfully',
                'data' => [
                    'variations' => $result['variations'],
                    'generated_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Design variations generation error', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            // Определяем тип ошибки и соответствующий HTTP статус
            $errorMessage = $e->getMessage();
            $httpStatus = 500;

            if (str_contains($errorMessage, 'exceeded your current quota')) {
                $httpStatus = 402; // Payment Required
            } elseif (str_contains($errorMessage, 'rate limit')) {
                $httpStatus = 429; // Too Many Requests
            } elseif (str_contains($errorMessage, 'authentication') || str_contains($errorMessage, 'API key')) {
                $httpStatus = 401; // Unauthorized
            } elseif (str_contains($errorMessage, 'model') && str_contains($errorMessage, 'not found')) {
                $httpStatus = 503; // Service Unavailable
            }

            return response()->json([
                'success' => false,
                'message' => 'Variation generation failed',
                'error' => $errorMessage
            ], $httpStatus);
        }
    }

    /**
     * Получение списка доступных опций для генерации
     */
    public function getGenerationOptions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'room_types' => [
                    ['key' => 'living_room', 'label' => 'Living Room'],
                    ['key' => 'bedroom', 'label' => 'Bedroom'],
                    ['key' => 'kitchen', 'label' => 'Kitchen'],
                    ['key' => 'bathroom', 'label' => 'Bathroom'],
                    ['key' => 'dining_room', 'label' => 'Dining Room'],
                    ['key' => 'office', 'label' => 'Office'],
                    ['key' => 'children_room', 'label' => 'Children Room'],
                    ['key' => 'guest_room', 'label' => 'Guest Room'],
                    ['key' => 'balcony', 'label' => 'Balcony'],
                    ['key' => 'other', 'label' => 'Other']
                ],
                'styles' => [
                    ['key' => 'modern', 'label' => 'Modern'],
                    ['key' => 'classic', 'label' => 'Classic'],
                    ['key' => 'minimalist', 'label' => 'Minimalist'],
                    ['key' => 'scandinavian', 'label' => 'Scandinavian'],
                    ['key' => 'industrial', 'label' => 'Industrial'],
                    ['key' => 'arabic', 'label' => 'Arabic'],
                    ['key' => 'luxury', 'label' => 'Luxury'],
                    ['key' => 'eco_friendly', 'label' => 'Eco Friendly'],
                    ['key' => 'contemporary', 'label' => 'Contemporary'],
                    ['key' => 'traditional', 'label' => 'Traditional']
                ],
                'budget_ranges' => [
                    ['min' => 5000, 'max' => 15000, 'label' => '5,000 - 15,000 AED'],
                    ['min' => 15000, 'max' => 30000, 'label' => '15,000 - 30,000 AED'],
                    ['min' => 30000, 'max' => 60000, 'label' => '30,000 - 60,000 AED'],
                    ['min' => 60000, 'max' => 100000, 'label' => '60,000 - 100,000 AED'],
                    ['min' => 100000, 'max' => null, 'label' => '100,000+ AED']
                ]
            ]
        ]);
    }

    /**
     * Сохранение дизайна для пользователя (для будущего использования)
     */
    private function saveDesignForUser(int $userId, array $designData): void
    {
        try {
            // Здесь можно добавить сохранение в базу данных
            // Например, создать модель UserDesign и сохранить результат
            Log::info('Design saved for user', [
                'user_id' => $userId,
                'design_summary' => $designData['design']['summary'] ?? 'No summary'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save design for user', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }
}
