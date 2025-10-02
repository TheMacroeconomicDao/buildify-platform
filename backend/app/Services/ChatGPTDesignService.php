<?php

namespace App\Services;

use App\Jobs\GenerateDesignImagesJob;
use App\Models\DesignImageGeneration;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Exception;

class ChatGPTDesignService
{
    /**
     * Генерация дизайна интерьера с использованием ChatGPT
     */
    public function generateInteriorDesign(string $description, array $roomType = [], array $style = [], ?array $budget = null, array $photos = [], ?int $userId = null): array
    {
        try {
            // Определяем, нужно ли использовать Vision модель
            $hasPhotos = !empty($photos);
            $model = $hasPhotos ? 'gpt-4-vision-preview' : 'gpt-4';
            
            // ОПТИМИЗАЦИЯ: Кеширование для похожих запросов (без фото)
            $cacheKey = null;
            if (!$hasPhotos) {
                $cacheKey = 'design_' . md5($description . serialize($roomType) . serialize($style) . serialize($budget));
                $cachedDesign = Cache::get($cacheKey);
                
                if ($cachedDesign) {
                    Log::info('Using cached design', ['cache_key' => $cacheKey]);
                    
                    // Запускаем асинхронную генерацию изображений
                    $generationId = null;
                    if ($userId) {
                        $generationId = $this->startAsyncImageGeneration(
                            $cachedDesign['raw_response'],
                            $description,
                            $roomType,
                            $style,
                            2,
                            $userId
                        );
                    }
                    
                    return [
                        'success' => true,
                        'design' => $cachedDesign['design'],
                        'raw_response' => $cachedDesign['raw_response'],
                        'tokens_used' => 0, // Кешированные данные
                        'images' => [],
                        'generation_id' => $generationId,
                        'cached' => true
                    ];
                }
            }
            
            $messages = $this->buildDesignMessages($description, $roomType, $style, $budget, $photos);
            
            Log::info('ChatGPT Design Generation Request', [
                'model' => $model,
                'has_photos' => $hasPhotos,
                'photos_count' => count($photos),
                'description' => $description,
                'room_type' => $roomType,
                'style' => $style,
                'budget' => $budget,
                'cached' => false
            ]);

            $requestParams = [
                'model' => $model,
                'messages' => $messages,
                'max_tokens' => 2000,
                'temperature' => 0.7,
            ];

            $response = OpenAI::chat()->create($requestParams);

            $designContent = $response->choices[0]->message->content;
            
            Log::info('ChatGPT Design Generation Response', [
                'response' => $designContent,
                'tokens_used' => $response->usage->totalTokens ?? 0
            ]);

            // Запускаем асинхронную генерацию изображений
            $generationId = null;
            if ($userId) {
                $generationId = $this->startAsyncImageGeneration(
                    $designContent, 
                    $description, 
                    $roomType, 
                    $style, 
                    2, // Генерируем 2 изображения для ускорения
                    $userId
                );
                Log::info('Started async image generation', ['generation_id' => $generationId]);
            }

            $parsedDesign = $this->parseDesignResponse($designContent);
            
            // ОПТИМИЗАЦИЯ: Сохраняем в кеш (только для запросов без фото)
            if ($cacheKey && !$hasPhotos) {
                $cacheData = [
                    'design' => $parsedDesign,
                    'raw_response' => $designContent
                ];
                Cache::put($cacheKey, $cacheData, 3600); // Кеш на 1 час
                Log::info('Design cached', ['cache_key' => $cacheKey]);
            }

            return [
                'success' => true,
                'design' => $parsedDesign,
                'raw_response' => $designContent,
                'tokens_used' => $response->usage->totalTokens ?? 0,
                'images' => [], // Изображения будут готовы через Queue
                'generation_id' => $generationId,
                'cached' => false
            ];

        } catch (Exception $e) {
            Log::error('ChatGPT Design Generation Error', [
                'error' => $e->getMessage(),
                'description' => $description
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'design' => null
            ];
        }
    }

    /**
     * Построение сообщений для GPT-4 с поддержкой изображений
     */
    private function buildDesignMessages(string $description, array $roomType, array $style, ?array $budget, array $photos = []): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => 'You are a professional interior designer with expertise in Dubai and UAE market. Provide detailed, practical design recommendations with specific product suggestions, color schemes, and layout ideas. Always consider the local climate, culture, and available materials in UAE.'
            ]
        ];

        // Строим текстовую часть промпта
        $textPrompt = $this->buildTextPrompt($description, $roomType, $style, $budget, !empty($photos));

        if (!empty($photos)) {
            // Для GPT-4 Vision - комбинируем текст и изображения
            $content = [
                [
                    'type' => 'text',
                    'text' => $textPrompt
                ]
            ];

            // Добавляем изображения
            foreach ($photos as $photo) {
                try {
                    // Оптимизация: сжимаем изображение перед отправкой
                    $optimizedImageData = $this->optimizeImageForVision($photo['path'], $photo['mime']);
                    
                    $content[] = [
                        'type' => 'image_url',
                        'image_url' => [
                            'url' => "data:{$photo['mime']};base64,{$optimizedImageData}",
                            'detail' => 'low' // Быстрый анализ для ускорения
                        ]
                    ];
                } catch (Exception $e) {
                    Log::warning('Failed to process photo for GPT-4 Vision', [
                        'photo' => $photo['name'],
                        'error' => $e->getMessage()
                    ]);
                }
            }

            $messages[] = [
                'role' => 'user',
                'content' => $content
            ];
        } else {
            // Для обычного GPT-4 - только текст
            $messages[] = [
                'role' => 'user',
                'content' => $textPrompt
            ];
        }

        return $messages;
    }

    /**
     * Построение текстовой части промпта для генерации дизайна
     */
    private function buildTextPrompt(string $description, array $roomType, array $style, ?array $budget, bool $hasPhotos = false): string
    {
        $prompt = "Create a detailed interior design plan for a space in Dubai, UAE.\n\n";
        
        $prompt .= "**Project Description:**\n{$description}\n\n";
        
        if ($hasPhotos) {
            $prompt .= "**Photo Analysis Instructions:**\n";
            $prompt .= "Carefully analyze the provided photos to understand:\n";
            $prompt .= "- Current room layout, dimensions, and architectural features\n";
            $prompt .= "- Existing furniture, fixtures, and elements (what to keep/replace/modify)\n";
            $prompt .= "- Natural light sources, windows, and lighting conditions\n";
            $prompt .= "- Current color scheme, materials, and finishes\n";
            $prompt .= "- Space constraints, opportunities, and flow\n";
            $prompt .= "- Structural elements (columns, beams, alcoves, etc.)\n";
            $prompt .= "- Current style and any design elements to preserve\n\n";
            $prompt .= "**IMPORTANT:** Base ALL recommendations on what you see in the photos. Be specific about how to work with the existing space.\n\n";
        }
        
        if (!empty($roomType)) {
            $prompt .= "**Room Type:** " . implode(', ', $roomType) . "\n\n";
        }
        
        if (!empty($style)) {
            $prompt .= "**Preferred Style:** " . implode(', ', $style) . "\n\n";
        }
        
        if ($budget) {
            if (isset($budget['max']) && $budget['max'] !== null) {
                $prompt .= "**Budget Range:** {$budget['min']} - {$budget['max']} AED\n\n";
            } else {
                $prompt .= "**Budget Range:** {$budget['min']}+ AED (no upper limit)\n\n";
            }
        }

        $prompt .= "**Required Output Format:**\n";
        $prompt .= "1. **Color Scheme**: Specific colors with hex codes (e.g., #F5F5DC for beige walls)\n";
        $prompt .= "2. **Layout Suggestions**: Detailed furniture placement and space planning\n";
        $prompt .= "3. **Material Recommendations**: Specific flooring, wall finishes, textures (available in UAE)\n";
        $prompt .= "4. **Furniture List**: Exact furniture pieces with dimensions and estimated AED prices\n";
        $prompt .= "5. **Lighting Plan**: Specific lighting types, fixtures, and placement\n";
        $prompt .= "6. **Decor Elements**: Specific accessories, artwork, plants with placement details\n";
        $prompt .= "7. **Shopping List**: Exact items with Dubai/UAE store locations and prices\n";
        $prompt .= "8. **Timeline**: Realistic implementation phases\n\n";
        
        if ($hasPhotos) {
            $prompt .= "Remember: Reference the actual space shown in photos. Mention specific elements you see and how to work with them.\n\n";
        }
        
        $prompt .= "Consider Dubai's climate, local suppliers, cultural preferences, and provide practical, achievable recommendations with specific details for visualization.";

        return $prompt;
    }

    /**
     * Парсинг ответа от ChatGPT в структурированный формат
     */
    private function parseDesignResponse(string $response): array
    {
        $sections = [];
        
        // Разбиваем ответ на секции
        $lines = explode("\n", $response);
        $currentSection = null;
        $currentContent = [];

        foreach ($lines as $line) {
            $line = trim($line);
            
            // Проверяем, является ли строка заголовком секции
            if (preg_match('/^\*\*(.+?)\*\*:?$/', $line, $matches)) {
                // Сохраняем предыдущую секцию
                if ($currentSection && !empty($currentContent)) {
                    $sections[$currentSection] = implode("\n", $currentContent);
                }
                
                // Начинаем новую секцию
                $currentSection = strtolower(str_replace(' ', '_', trim($matches[1])));
                $currentContent = [];
            } elseif ($currentSection && !empty($line)) {
                $currentContent[] = $line;
            }
        }
        
        // Добавляем последнюю секцию
        if ($currentSection && !empty($currentContent)) {
            $sections[$currentSection] = implode("\n", $currentContent);
        }

        return [
            'sections' => $sections,
            'summary' => $this->extractSummary($response),
            'shopping_list' => $this->extractShoppingList($response),
            'estimated_cost' => $this->extractEstimatedCost($response)
        ];
    }

    /**
     * Извлечение краткого резюме
     */
    private function extractSummary(string $response): string
    {
        $lines = explode("\n", $response);
        $summary = [];
        
        foreach (array_slice($lines, 0, 3) as $line) {
            $line = trim($line);
            if (!empty($line) && !preg_match('/^\*\*/', $line)) {
                $summary[] = $line;
            }
        }
        
        return implode(" ", $summary);
    }

    /**
     * Извлечение списка покупок
     */
    private function extractShoppingList(string $response): array
    {
        $items = [];
        $lines = explode("\n", $response);
        $inShoppingSection = false;
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            if (preg_match('/shopping.*list/i', $line)) {
                $inShoppingSection = true;
                continue;
            }
            
            if ($inShoppingSection && preg_match('/^\*\*(.+?)\*\*/', $line)) {
                $inShoppingSection = false;
            }
            
            if ($inShoppingSection && preg_match('/^[\d\-\*\+]/', $line)) {
                // Извлекаем цену из строки
                preg_match('/(\d+(?:,\d+)*)\s*AED/i', $line, $priceMatch);
                $price = $priceMatch ? (int)str_replace(',', '', $priceMatch[1]) : null;
                
                $items[] = [
                    'item' => preg_replace('/^[\d\-\*\+\s]*/', '', $line),
                    'estimated_price' => $price
                ];
            }
        }
        
        return $items;
    }

    /**
     * Извлечение общей стоимости
     */
    private function extractEstimatedCost(string $response): ?array
    {
        // Ищем упоминания общей стоимости
        preg_match_all('/(\d+(?:,\d+)*)\s*(?:-\s*(\d+(?:,\d+)*))?\s*AED/i', $response, $matches);
        
        if (empty($matches[1])) {
            return null;
        }
        
        $prices = array_map(function($price) {
            return (int)str_replace(',', '', $price);
        }, $matches[1]);
        
        return [
            'min' => min($prices),
            'max' => max($prices),
            'currency' => 'AED'
        ];
    }

    /**
     * Генерация вариаций дизайна
     */
    public function generateDesignVariations(string $originalDesign, int $count = 3): array
    {
        try {
            $variations = [];
            
            for ($i = 0; $i < $count; $i++) {
                $prompt = "Based on this interior design concept, create a variation with different approach:\n\n{$originalDesign}\n\nProvide a fresh take with different color scheme, furniture choices, or layout while maintaining the same room type and general style direction.";
                
                $response = OpenAI::chat()->create([
                    'model' => 'gpt-4',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a creative interior designer. Provide alternative design solutions that are practical and achievable in Dubai, UAE.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'max_tokens' => 1500,
                    'temperature' => 0.8,
                ]);

                $variations[] = [
                    'variation_number' => $i + 1,
                    'design' => $this->parseDesignResponse($response->choices[0]->message->content),
                    'raw_response' => $response->choices[0]->message->content
                ];
            }

            return [
                'success' => true,
                'variations' => $variations
            ];

        } catch (Exception $e) {
            Log::error('ChatGPT Design Variations Error', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'variations' => []
            ];
        }
    }

    /**
     * Запуск асинхронной генерации изображений
     */
    private function startAsyncImageGeneration(
        string $designContent, 
        string $description, 
        array $roomType, 
        array $style, 
        int $imageCount, 
        int $userId
    ): string {
        $generationId = Str::uuid()->toString();
        
        // Сохраняем запись о задаче генерации
        DesignImageGeneration::create([
            'generation_id' => $generationId,
            'user_id' => $userId,
            'design_content' => $designContent,
            'description' => $description,
            'room_type' => $roomType,
            'style' => $style,
            'image_count' => $imageCount,
            'status' => DesignImageGeneration::STATUS_PENDING
        ]);
        
        // Отправляем задачу в очередь
        GenerateDesignImagesJob::dispatch(
            $designContent,
            $description,
            $roomType,
            $style,
            $imageCount,
            $generationId,
            $userId
        );
        
        Log::info('Async image generation started', [
            'generation_id' => $generationId,
            'user_id' => $userId
        ]);
        
        return $generationId;
    }

    /**
     * Генерация изображений дизайна с помощью DALL-E (публичный метод для Job)
     * ОПТИМИЗИРОВАНО: Параллельная генерация изображений
     */
    public function generateDesignImages(string $designContent, string $description, array $roomType, array $style, int $imageCount = 2): array
    {
        try {
            // Создаем промпт для DALL-E на основе сгенерированного дизайна
            $imagePrompt = $this->buildImagePrompt($designContent, $description, $roomType, $style);
            
            Log::info('DALL-E Parallel Image Generation Request', [
                'prompt' => $imagePrompt,
                'image_count' => $imageCount
            ]);

            // ОПТИМИЗАЦИЯ: Генерируем все изображения параллельно
            $images = $this->generateImagesInParallel($imagePrompt, $imageCount);

            Log::info('DALL-E Parallel Image Generation Response', [
                'images_generated' => count($images),
                'generation_time' => microtime(true) - ($_SERVER['REQUEST_TIME_FLOAT'] ?? microtime(true))
            ]);

            return $images;

        } catch (Exception $e) {
            Log::error('DALL-E Image Generation Error', [
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Построение промпта для генерации изображений на основе детального дизайна
     */
    private function buildImagePrompt(string $designContent, string $description, array $roomType, array $style): string
    {
        // Извлекаем ключевые детали из сгенерированного дизайна
        $colorScheme = $this->extractColorScheme($designContent);
        $materials = $this->extractMaterials($designContent);
        $furniture = $this->extractFurniture($designContent);
        $lighting = $this->extractLighting($designContent);
        
        $roomTypeStr = !empty($roomType) ? implode(', ', $roomType) : 'interior space';
        $styleStr = !empty($style) ? implode(' and ', $style) : 'modern';
        
        $prompt = "A photorealistic {$styleStr} {$roomTypeStr} interior design in Dubai, UAE. ";
        
        // Добавляем конкретные цвета
        if ($colorScheme) {
            $prompt .= "Color palette: {$colorScheme}. ";
        }
        
        // Добавляем материалы
        if ($materials) {
            $prompt .= "Materials and finishes: {$materials}. ";
        }
        
        // Добавляем мебель
        if ($furniture) {
            $prompt .= "Furniture: {$furniture}. ";
        }
        
        // Добавляем освещение
        if ($lighting) {
            $prompt .= "Lighting: {$lighting}. ";
        }
        
        $prompt .= "High-quality architectural visualization with professional lighting. ";
        $prompt .= "Clean, elegant space with attention to detail. ";
        $prompt .= "Photorealistic rendering, interior design photography style. ";
        $prompt .= "Luxurious finishes suitable for Dubai market.";

        return $prompt;
    }

    /**
     * Создание вариаций промпта для разнообразия изображений
     */
    private function varyImagePrompt(string $basePrompt, int $index): string
    {
        $variations = [
            'Wide angle view, ',
            'Close-up detail shot, ',
            'Different lighting setup, ',
            'Alternative camera angle, '
        ];

        $lightingVariations = [
            'natural daylight',
            'warm evening lighting',
            'bright modern lighting',
            'soft ambient lighting'
        ];

        $variation = $variations[$index] ?? '';
        $lighting = $lightingVariations[$index] ?? 'professional lighting';

        return $variation . str_replace('professional lighting', $lighting, $basePrompt);
    }

    /**
     * Извлечение цветовой схемы из дизайна
     */
    private function extractColorScheme(string $designContent): ?string
    {
        // Поиск секции с цветовой схемой
        if (preg_match('/\*\*Color\s+Scheme\*\*:?\s*([^*]+?)(?=\*\*|$)/is', $designContent, $matches)) {
            $colorText = trim($matches[1]);
            // Очищаем от лишних символов и оставляем только основные цвета
            $colorText = preg_replace('/\n+/', ' ', $colorText);
            $colorText = substr($colorText, 0, 200); // Ограничиваем длину
            return $colorText;
        }
        return null;
    }

    /**
     * Извлечение материалов из дизайна
     */
    private function extractMaterials(string $designContent): ?string
    {
        if (preg_match('/\*\*Material[s]?\s+Recommendation[s]?\*\*:?\s*([^*]+?)(?=\*\*|$)/is', $designContent, $matches)) {
            $materialText = trim($matches[1]);
            $materialText = preg_replace('/\n+/', ' ', $materialText);
            $materialText = substr($materialText, 0, 200);
            return $materialText;
        }
        return null;
    }

    /**
     * Извлечение мебели из дизайна
     */
    private function extractFurniture(string $designContent): ?string
    {
        if (preg_match('/\*\*Furniture\s+List\*\*:?\s*([^*]+?)(?=\*\*|$)/is', $designContent, $matches)) {
            $furnitureText = trim($matches[1]);
            $furnitureText = preg_replace('/\n+/', ' ', $furnitureText);
            $furnitureText = substr($furnitureText, 0, 200);
            return $furnitureText;
        }
        return null;
    }

    /**
     * Извлечение освещения из дизайна
     */
    private function extractLighting(string $designContent): ?string
    {
        if (preg_match('/\*\*Lighting\s+Plan\*\*:?\s*([^*]+?)(?=\*\*|$)/is', $designContent, $matches)) {
            $lightingText = trim($matches[1]);
            $lightingText = preg_replace('/\n+/', ' ', $lightingText);
            $lightingText = substr($lightingText, 0, 200);
            return $lightingText;
        }
        return null;
    }

    /**
     * Оптимизация изображения для GPT-4 Vision
     */
    private function optimizeImageForVision(string $imagePath, string $mimeType): string
    {
        try {
            $imageData = file_get_contents($imagePath);
            
            // Для быстрого анализа сжимаем до 512px
            $image = imagecreatefromstring($imageData);
            
            if (!$image) {
                return base64_encode($imageData);
            }
            
            $originalWidth = imagesx($image);
            $originalHeight = imagesy($image);
            
            // Максимум 512px по большей стороне
            $maxSize = 512;
            if ($originalWidth > $maxSize || $originalHeight > $maxSize) {
                if ($originalWidth > $originalHeight) {
                    $newWidth = $maxSize;
                    $newHeight = intval($originalHeight * ($maxSize / $originalWidth));
                } else {
                    $newHeight = $maxSize;
                    $newWidth = intval($originalWidth * ($maxSize / $originalHeight));
                }
            } else {
                $newWidth = $originalWidth;
                $newHeight = $originalHeight;
            }
            
            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Прозрачность для PNG
            if (strpos($mimeType, 'png') !== false) {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
                $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
                imagefill($resizedImage, 0, 0, $transparent);
            }
            
            imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
            
            ob_start();
            if (strpos($mimeType, 'png') !== false) {
                imagepng($resizedImage, null, 6);
            } else {
                imagejpeg($resizedImage, null, 70);
            }
            $optimizedImageData = ob_get_clean();
            
            imagedestroy($image);
            imagedestroy($resizedImage);
            
            return base64_encode($optimizedImageData);
            
        } catch (Exception $e) {
            Log::warning('Image optimization failed', ['error' => $e->getMessage()]);
            return base64_encode(file_get_contents($imagePath));
        }
    }

    /**
     * Параллельная генерация изображений
     */
    private function generateImagesInParallel(string $basePrompt, int $imageCount): array
    {
        $startTime = microtime(true);
        $images = [];
        
        // Промпты для каждого изображения
        $prompts = [];
        for ($i = 0; $i < $imageCount; $i++) {
            $prompts[] = $this->varyImagePrompt($basePrompt, $i);
        }
        
        // cURL Multi для параллельных запросов
        $multiHandle = curl_multi_init();
        $curlHandles = [];
        
        foreach ($prompts as $index => $prompt) {
            $curlHandle = curl_init();
            
            $requestData = [
                'model' => 'dall-e-3',
                'prompt' => $prompt,
                'n' => 1,
                'size' => '1024x1024',
                'quality' => 'standard', // Оптимальное соотношение скорость/качество
                'response_format' => 'url',
            ];
            
            curl_setopt_array($curlHandle, [
                CURLOPT_URL => 'https://api.openai.com/v1/images/generations',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($requestData),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . config('openai.api_key'),
                ],
                CURLOPT_TIMEOUT => 90, // 1.5 минуты
            ]);
            
            curl_multi_add_handle($multiHandle, $curlHandle);
            $curlHandles[$index] = $curlHandle;
        }
        
        // Выполняем параллельно
        $running = null;
        do {
            curl_multi_exec($multiHandle, $running);
            curl_multi_select($multiHandle);
        } while ($running > 0);
        
        // Обрабатываем результаты
        foreach ($curlHandles as $index => $curlHandle) {
            $response = curl_multi_getcontent($curlHandle);
            $httpCode = curl_getinfo($curlHandle, CURLINFO_HTTP_CODE);
            
            if ($httpCode === 200 && $response) {
                $responseData = json_decode($response, true);
                if (isset($responseData['data'][0]['url'])) {
                    $images[] = [
                        'url' => $responseData['data'][0]['url'],
                        'prompt' => $prompts[$index],
                        'index' => $index + 1
                    ];
                }
            } else {
                Log::warning('Parallel image generation failed', [
                    'index' => $index + 1,
                    'http_code' => $httpCode
                ]);
            }
            
            curl_multi_remove_handle($multiHandle, $curlHandle);
            curl_close($curlHandle);
        }
        
        curl_multi_close($multiHandle);
        
        $endTime = microtime(true);
        Log::info('Parallel generation completed', [
            'images' => count($images),
            'time' => round($endTime - $startTime, 2) . 's'
        ]);
        
        return $images;
    }
}
