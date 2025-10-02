<?php

namespace App\Services;

use App\Models\File;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Orchid\Attachment\Models\Attachment;

class FileService
{

    /**
     * @param string $path
     * @param int $userId
     * @param string|null $name
     * @param int|null $size
     * @return File
     */
    public function createModel(string $path, int $userId, ?string $name = null, ?int $size = null): File
    {
        return File::create([
            'user_id' => $userId,
            'path' => $path,
            'name' => $name,
            'size' => $size,
        ]);
    }

    public function createFromUploadFile(UploadedFile $file, int $userId): File
    {
        $path = $file->store('attachments', 'public');
        return $this->createModel(
            $path, 
            $userId, 
            $file->getClientOriginalName(),
            $file->getSize()
        );
    }

    /**
     * @param int $attachmentId
     * @param int $userId
     * @return File
     * @throws Exception
     */
    public function createFromAttachment(int $attachmentId, int $userId): File
    {
        $attachment = Attachment::find($attachmentId);
        $path = 'attachments/' . $attachment->original_name;

        Storage::disk('public')->put(
            $path,
            Storage::disk($attachment->disk)->get($attachment->physicalPath())
        );
        $attachment->delete();

        return $this->createModel($path, $userId);
    }
}
