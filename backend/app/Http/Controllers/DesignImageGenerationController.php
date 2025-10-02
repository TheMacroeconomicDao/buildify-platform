<?php

namespace App\Http\Controllers;

use App\Models\DesignImageGeneration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DesignImageGenerationController extends Controller
{
    /**
     * Получить статус генерации изображений
     */
    public function getGenerationStatus(string $generationId): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $generation = DesignImageGeneration::where('generation_id', $generationId);
            
            // Если пользователь авторизован, проверяем что это его задача
            if ($user) {
                $generation = $generation->where('user_id', $user->id);
            }
            
            $generation = $generation->first();
            
            if (!$generation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Generation not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'generation_id' => $generation->generation_id,
                'status' => $generation->status,
                'images' => $generation->getImagesArray(),
                'error_message' => $generation->error_message,
                'created_at' => $generation->created_at,
                'started_at' => $generation->started_at,
                'completed_at' => $generation->completed_at,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error getting generation status', [
                'generation_id' => $generationId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Получить список всех генераций пользователя
     */
    public function getUserGenerations(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }
            
            $generations = DesignImageGeneration::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->take(20) // Последние 20 генераций
                ->get()
                ->map(function ($generation) {
                    return [
                        'generation_id' => $generation->generation_id,
                        'status' => $generation->status,
                        'description' => substr($generation->description, 0, 100) . '...',
                        'images_count' => count($generation->getImagesArray()),
                        'created_at' => $generation->created_at,
                        'completed_at' => $generation->completed_at,
                    ];
                });
                
            return response()->json([
                'success' => true,
                'generations' => $generations
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error getting user generations', [
                'user_id' => $user ? $user->id : null,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Получить изображения для конкретной генерации
     */
    public function getGenerationImages(string $generationId): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $generation = DesignImageGeneration::where('generation_id', $generationId);
            
            // Если пользователь авторизован, проверяем что это его задача
            if ($user) {
                $generation = $generation->where('user_id', $user->id);
            }
            
            $generation = $generation->first();
            
            if (!$generation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Generation not found'
                ], 404);
            }
            
            if (!$generation->isCompleted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Images not ready yet',
                    'status' => $generation->status
                ], 202); // Accepted, but not ready
            }
            
            return response()->json([
                'success' => true,
                'generation_id' => $generation->generation_id,
                'images' => $generation->getImagesArray(),
                'completed_at' => $generation->completed_at
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error getting generation images', [
                'generation_id' => $generationId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }
}
