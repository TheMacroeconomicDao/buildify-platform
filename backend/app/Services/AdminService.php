<?php

namespace App\Services;

use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use App\Http\Requests\Admin\ExecutorVerificationRequest;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class AdminService
{
    /**
     * Получить список исполнителей ожидающих верификации
     * @return array
     */
    public function getPendingExecutors(): array
    {
        $executors = User::where('type', Type::Executor->value)
            ->where('verification_status', VerificationStatus::Pending->value)
            ->select('id', 'name', 'email', 'phone', 'license_file_path', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return $executors->map(function ($executor) {
            return [
                'id' => $executor->id,
                'name' => $executor->name,
                'email' => $executor->email,
                'phone' => $executor->phone,
                'license_file_name' => $executor->license_file_path ? basename($executor->license_file_path) : null,
                'created_at' => $executor->created_at,
            ];
        })->toArray();
    }

    /**
     * Верифицировать исполнителя (одобрить или отклонить)
     * @param ExecutorVerificationRequest $request
     * @return string
     * @throws Throwable
     */
    public function verifyExecutor(ExecutorVerificationRequest $request): string
    {
        $executor = User::where('id', $request->executor_id)
            ->where('type', Type::Executor->value)
            ->first();

        throw_if(
            $executor === null,
            new NotFoundHttpException('Исполнитель не найден')
        );

        throw_if(
            $executor->verification_status !== VerificationStatus::Pending->value,
            new BadRequestHttpException('Исполнитель уже прошел верификацию')
        );

        $isApproved = $request->status == VerificationStatus::Approved->value;

        $executor->update([
            'verification_status' => $request->status,
            'verification_comment' => $request->comment,
            'verified_at' => now(),
        ]);

        return $isApproved 
            ? 'Исполнитель успешно верифицирован'
            : 'Верификация исполнителя отклонена';
    }

    /**
     * Получить файл лицензии исполнителя
     * @param int $executorId
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     * @throws Throwable
     */
    public function getExecutorLicense(int $executorId)
    {
        $executor = User::where('id', $executorId)
            ->where('type', Type::Executor->value)
            ->first();

        throw_if(
            $executor === null,
            new NotFoundHttpException('Исполнитель не найден')
        );

        throw_if(
            empty($executor->license_file_path),
            new NotFoundHttpException('Файл лицензии не найден')
        );

        throw_if(
            !Storage::disk('local')->exists($executor->license_file_path),
            new NotFoundHttpException('Файл лицензии не существует')
        );

        $filePath = Storage::disk('local')->path($executor->license_file_path);
        
        // Проверяем, что файл действительно существует и читается
        throw_if(
            !file_exists($filePath),
            new NotFoundHttpException('Файл не найден на диске')
        );
        
        throw_if(
            !is_readable($filePath),
            new NotFoundHttpException('Файл недоступен для чтения')
        );
        
        $fileSize = filesize($filePath);
        throw_if(
            $fileSize === 0,
            new NotFoundHttpException('Файл пустой')
        );
        
        // Определяем MIME тип и расширение файла
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        
        // Сначала пробуем получить расширение из оригинального имени файла
        $originalExtension = pathinfo($executor->license_file_path, PATHINFO_EXTENSION);
        
        // Если есть оригинальное расширение и оно валидное, используем его
        if ($originalExtension && in_array(strtolower($originalExtension), ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', '7z'])) {
            $extension = strtolower($originalExtension);
        } else {
            // Если оригинального расширения нет, определяем по MIME типу
            $extension = match($mimeType) {
                'application/pdf' => 'pdf',
                'image/jpeg', 'image/jpg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp',
                'image/bmp' => 'bmp',
                'image/tiff' => 'tiff',
                'application/msword' => 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
                'application/vnd.ms-excel' => 'xls',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
                'application/vnd.ms-powerpoint' => 'ppt',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
                'text/plain' => 'txt',
                'text/csv' => 'csv',
                'application/zip' => 'zip',
                'application/x-rar-compressed' => 'rar',
                'application/x-7z-compressed' => '7z',
                default => $originalExtension ?: 'file'
            };
        }
        
        // Создаем простое и чистое имя файла без лишних расширений
        $fileName = 'license_executor_' . $executor->id . '.' . $extension;
        
        // Используем более надежный способ скачивания
        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Content-Length' => $fileSize,
            'Cache-Control' => 'no-cache, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0'
        ]);
    }

    /**
     * Получить всех исполнителей с их статусами верификации
     * @return array
     */
    public function getAllExecutors(): array
    {
        $executors = User::where('type', Type::Executor->value)
            ->select('id', 'name', 'email', 'phone', 'verification_status', 'verification_comment', 'verified_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return $executors->map(function ($executor) {
            return [
                'id' => $executor->id,
                'name' => $executor->name,
                'email' => $executor->email,
                'phone' => $executor->phone,
                'verification_status' => $executor->verification_status,
                'verification_status_label' => VerificationStatus::from($executor->verification_status)->label(),
                'verification_comment' => $executor->verification_comment,
                'verified_at' => $executor->verified_at,
                'created_at' => $executor->created_at,
            ];
        })->toArray();
    }
}