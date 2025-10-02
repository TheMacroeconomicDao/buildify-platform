<?php

namespace App\Http\Controllers;

use App\Http\Requests\File\StoreRequest;
use App\Services\FileService;
use Illuminate\Http\JsonResponse;

class FileController extends Controller
{
    public function store(StoreRequest $request): JsonResponse
    {
        $file = app(FileService::class)->createFromUploadFile(
            $request->file('file'), auth()->user()->id
        );

        return response()->json([
            'success' => true,
            'result' => [
                'file_id' => $file->id,
                'file' => [
                    'id' => $file->id,
                    'path' => $file->url, // ← Полный URL
                    'name' => $file->name,
                    'size' => $file->size,
                ]
            ]
        ]);
    }
}
