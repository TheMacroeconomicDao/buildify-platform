<?php

namespace App\Services;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use App\Http\Requests\User\ChangePasswordRequest;
use App\Http\Requests\User\ChangePasswordConfirmRequest;
use App\Http\Requests\User\UploadLicenseRequest;
use App\Mail\SendVerificationCode;
use App\Models\User;
use App\Models\UserSettings;
use App\Models\UserWork;
use App\Models\Verification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Throwable;

class UserService
{
    /**
     * @param int $userId
     * @return string
     * @throws Throwable
     */
    public function delete(int $userId): string
    {
        $user = User::find($userId);

        throw_if(
            $user === null,
            new BadRequestHttpException(__('user.user_not_found'))
        );

        $result = $user->update(['status' => Status::Deleted->value]);
        $user->tokens()->delete();
        throw_if(
            $result === false,
            new BadRequestHttpException(__('user.failed_to_delete_account'))
        );

        return __('user.account_deleted_successfully');
    }

    /**
     * @param ChangePasswordRequest $request
     * @return string
     * @throws Throwable
     */
    public function changePassword(ChangePasswordRequest $request): string
    {
        $user = $request->user();

        throw_if(
            !Hash::check($request->password, $user->password),
            new BadRequestHttpException(__('user.invalid_password'))
        );
        $result = $user->update(['password' => Hash::make($request->new_password)]);

        throw_if(
            $result === false,
            new BadRequestHttpException(__('user.failed_to_change_password'))
        );

        return __('user.password_changed_successfully');
    }

    /**
     * Отправить код для смены пароля на email
     * @param User $user
     * @return string
     * @throws Throwable
     */
    public function changePasswordSendCode(User $user): string
    {
        // Используем тот же метод генерации кода что и в регистрации
        $this->sendNewVerificationCode($user->email);

        return __('user.password_change_code_sent_by_email');
    }

    /**
     * Отправить новый код верификации (общий метод как в регистрации)
     * @param string $email
     * @return void
     * @throws \Exception
     */
    private function sendNewVerificationCode(string $email): void
    {
        $code = $this->generateCode();

        Verification::updateOrCreate(
            ['email' => strtolower($email)],
            ['code' => $code, 'attempts' => 0]
        );

        Mail::to($email)->send(new SendVerificationCode($code));
    }

    /**
     * Генерировать 4-значный код (как в регистрации)
     * @return int
     * @throws \Exception
     */
    private function generateCode(): int
    {
        return random_int(1000, 9999);
    }

    /**
     * Подтвердить смену пароля с кодом
     * @param ChangePasswordConfirmRequest $request
     * @param User $user
     * @return string
     * @throws Throwable
     */
    public function changePasswordConfirm(ChangePasswordConfirmRequest $request, User $user): string
    {
        $verification = Verification::where('email', strtolower($user->email))->first();

        throw_if(
            $verification === null,
            new BadRequestHttpException(__('user.invalid_verification_code'))
        );

        if ($verification->code !== $request->code) {
            $verification->update(['attempts' => $verification->attempts + 1]);
        }

        throw_if(
            $verification->code !== $request->code,
            new BadRequestHttpException(__('user.invalid_verification_code'))
        );

        throw_if(
            $verification->attempts > 3,
            new BadRequestHttpException(__('user.maximum_number_of_water_codes_has_been_exceeded'))
        );

        // Обновляем пароль
        $result = $user->update(['password' => Hash::make($request->new_password)]);

        throw_if(
            $result === false,
            new BadRequestHttpException(__('user.failed_to_change_password'))
        );

        // Удаляем код верификации
        $verification->delete();

        // Аннулируем все токены пользователя для безопасности
        $user->tokens()->delete();

        return __('user.password_changed_successfully_logout_required');
    }

    /**
     * @param User $user
     * @param array $validated
     * @return string
     * @throws Throwable
     */
    public function edit(User $user, array $validated): string
    {
        $result = $user->update($validated);

        throw_if(
            $result === false,
            new BadRequestHttpException(__('user.failed_to_update_user_data'))
        );

        return __('user.user_data_has_been_successfully_updated');
    }

    /**
     * @param Request $request
     * @return string
     * @throws Throwable
     */
    public function updateAvatar(Request $request): string
    {
        $path = $request->file('avatar')->storePublicly('avatars', 'public');
        $url = Storage::disk('public')->url($path);

        $result = $request->user()->update(['avatar' => $url]);

        throw_if(
            $result === false,
            new BadRequestHttpException(__('user.failed_to_update_user_data'))
        );

        return __('user.user_data_has_been_successfully_updated');
    }

    /**
     * @param Request $request
     * @param User $user
     * @return bool
     */
    public function settingsUpdate(Request $request, User $user): bool
    {
        $result = UserSettings::updateOrCreate(
            [
                'user_id' => $user->id
            ],
            [
                'localization' => $request->localization,
            ]
        );

        return $result instanceof UserSettings;
    }

    public function settingsGet(User $user)
    {
        $result = UserSettings::where('user_id', $user->id)->select('localization')->first();
        if ($result === null) {
            $result['localization'] = null;
        }
        return $result;
    }

    /**
     * @param User $user
     * @param array $settings
     * @return void
     * @throws Throwable
     */
    public function setWorkSettings(User $user, array $settings): void
    {
        throw_if(
            $user->type !== Type::Executor->value,
            AccessDeniedHttpException::class,
            __('user.available_only_to_executor')
        );

        DB::transaction(function () use ($user, $settings) {
            // Получаем текущие настройки для сравнения
            $currentWorks = $user->works()->get();
            $currentWorkKeys = $currentWorks->map(function ($work) {
                return $work->direction . '.' . $work->type;
            })->toArray();
            
            // Формируем новые настройки
            $newWorkKeys = [];
            foreach ($settings as $setting) {
                $direction = $setting['direction'];
                foreach ($setting['types'] as $type) {
                    WorkService::existsDirectionType($direction, $type);
                    $newWorkKeys[] = $direction . '.' . $type;
                }
            }
            
            // Проверяем, изменились ли настройки
            $settingsChanged = (
                count($currentWorkKeys) !== count($newWorkKeys) ||
                count(array_diff($currentWorkKeys, $newWorkKeys)) > 0 ||
                count(array_diff($newWorkKeys, $currentWorkKeys)) > 0
            );
            
            // Удаляем все старые настройки
            $user->works()->delete();
            
            // Добавляем новые настройки
            foreach ($settings as $setting) {
                $direction = $setting['direction'];
                foreach ($setting['types'] as $type) {
                    UserWork::create([
                        'user_id' => $user->id,
                        'direction' => $direction,
                        'type' => $type,
                    ]);
                }
            }
            
            // Если настройки изменились, сбрасываем статус верификации
            if ($settingsChanged && $user->verification_status !== VerificationStatus::NotRequired->value) {
                $user->update([
                    'verification_status' => VerificationStatus::Pending->value,
                    'verification_comment' => null,
                    'verified_at' => null,
                ]);
            }
        });
    }

    /**
     * Получить настройки работ исполнителя
     * @param User $user
     * @return array
     */
    public function getWorkSettings(User $user): array
    {
        $userWorks = $user->works()->get();
        
        // Группируем работы по направлениям
        $groupedWorks = [];
        foreach ($userWorks as $work) {
            if (!isset($groupedWorks[$work->direction])) {
                $groupedWorks[$work->direction] = [];
            }
            $groupedWorks[$work->direction][] = $work->type;
        }
        
        // Преобразуем в формат для API
        $workSettings = [];
        foreach ($groupedWorks as $direction => $types) {
            $workSettings[] = [
                'direction' => $direction,
                'types' => $types,
            ];
        }
        
        return $workSettings;
    }

    /**
     * Загрузка файла лицензии для исполнителя
     * @param UploadLicenseRequest $request
     * @param User $user
     * @return array
     * @throws Throwable
     */
    public function uploadLicense(UploadLicenseRequest $request, User $user): array
    {
        // Проверяем, что пользователь - исполнитель
        throw_if(
            $user->type !== Type::Executor->value,
            new AccessDeniedHttpException('Загрузка лицензии доступна только исполнителям')
        );

        $file = $request->file('license_file');
        
        // Определяем расширение файла более надежно
        $extension = $file->getClientOriginalExtension();
        
        // Если расширение не определилось, попробуем по MIME типу
        if (empty($extension)) {
            $mimeType = $file->getMimeType();
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
                default => pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION) ?: 'file'
            };
        }
        
        // Генерируем уникальное имя файла
        $fileName = 'license_' . $user->id . '_' . time() . '.' . $extension;
        
        // Сохраняем файл в storage/app/licenses
        $filePath = $file->storeAs('licenses', $fileName, 'local');
        
        // Удаляем старый файл если есть
        if ($user->license_file_path && Storage::disk('local')->exists($user->license_file_path)) {
            Storage::disk('local')->delete($user->license_file_path);
        }
        
        // Обновляем пользователя
        $user->update([
            'license_file_path' => $filePath,
            'verification_status' => VerificationStatus::Pending->value,
            'verification_comment' => null,
            'verified_at' => null,
        ]);

        return [
            'message' => 'Файл лицензии успешно загружен и отправлен на проверку',
            'file_name' => $fileName,
            'status' => 'Pending'
        ];
    }
}
