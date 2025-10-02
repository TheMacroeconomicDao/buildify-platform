<?php

namespace App\Http\Controllers;

use App\Http\Requests\Portfolio\StoreRequest;
use App\Models\ExecutorPortfolio;
use App\Models\ExecutorPortfolioFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PortfolioController extends Controller
{
    /**
     * Получить портфолио текущего исполнителя
     */
    public function index(): JsonResponse
    {
        $portfolios = ExecutorPortfolio::where('user_id', auth()->id())
            ->with(['files.file'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (ExecutorPortfolio $portfolio) {
                return $this->formatPortfolioResponse($portfolio);
            });

        return response()->json([
            'success' => true,
            'result' => $portfolios,
        ]);
    }

    /**
     * Создать новое портфолио
     */
    public function store(StoreRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['user_id'] = auth()->id();

            $portfolio = ExecutorPortfolio::create($data);

            // Добавляем файлы для медиа-типа
            if ($portfolio->isMediaType() && !empty($data['files'])) {
                foreach ($data['files'] as $index => $fileId) {
                    ExecutorPortfolioFile::create([
                        'portfolio_id' => $portfolio->id,
                        'file_id' => $fileId,
                        'sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            $portfolio->load(['files.file']);

            return response()->json([
                'success' => true,
                'result' => $this->formatPortfolioResponse($portfolio),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Показать конкретное портфолио
     */
    public function show(int $id): JsonResponse
    {
        $portfolio = ExecutorPortfolio::where('user_id', auth()->id())
            ->where('id', $id)
            ->with(['files.file'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'result' => $this->formatPortfolioResponse($portfolio),
        ]);
    }

    /**
     * Обновить портфолио
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $portfolio = ExecutorPortfolio::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'type' => 'required|in:' . ExecutorPortfolio::TYPE_MEDIA . ',' . ExecutorPortfolio::TYPE_LINK,
            'external_url' => 'required_if:type,' . ExecutorPortfolio::TYPE_LINK . '|nullable|url|max:500',
            'files' => 'required_if:type,' . ExecutorPortfolio::TYPE_MEDIA . '|nullable|array|max:10',
            'files.*' => 'exists:files,id',
        ]);

        DB::beginTransaction();
        try {
            $data = $request->only(['name', 'description', 'type', 'external_url']);
            $portfolio->update($data);

            // Обновляем файлы для медиа-типа
            if ($portfolio->isMediaType() && $request->has('files')) {
                // Удаляем старые связи
                ExecutorPortfolioFile::where('portfolio_id', $portfolio->id)->delete();
                
                // Добавляем новые
                foreach ($request->input('files', []) as $index => $fileId) {
                    ExecutorPortfolioFile::create([
                        'portfolio_id' => $portfolio->id,
                        'file_id' => $fileId,
                        'sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            $portfolio->load(['files.file']);

            return response()->json([
                'success' => true,
                'result' => $this->formatPortfolioResponse($portfolio),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Удалить портфолио
     */
    public function destroy(int $id): JsonResponse
    {
        $portfolio = ExecutorPortfolio::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        $portfolio->delete();

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Форматирование ответа для портфолио
     */
    private function formatPortfolioResponse(ExecutorPortfolio $portfolio): array
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
