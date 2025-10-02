<?php

namespace App\Http\Controllers;

use App\Enums\Currency;
use App\Enums\Language;
use App\Enums\Localization;
use App\Enums\Users\Type;
use App\Http\Requests\User\ChangePasswordRequest;
use App\Http\Requests\User\ChangePasswordSendCodeRequest;
use App\Http\Requests\User\ChangePasswordConfirmRequest;
use App\Http\Requests\User\EditRequest;
use App\Http\Requests\User\SetWorkSettingsRequest;
use App\Http\Requests\User\UpdateSettingsRequest;
use App\Http\Requests\User\UploadLicenseRequest;
use App\Services\UserService;
use App\Services\WorkService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Throwable;

class UserController extends Controller
{
    /**
     * @var UserService
     */
    private UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * @return JsonResponse
     * @throws Throwable
     */
    public function me(): JsonResponse
    {
        $user = auth()->user();
        $user['localization'] = $this->userService->settingsGet(auth()->user())['localization'];

        // Добавляем рейтинг и портфолио для исполнителей
        if ($user->type === Type::Executor->value) {
            $user['average_rating'] = $user->average_rating;
            $user['reviews_count'] = $user->reviews_count;
            
            // Загружаем портфолио
            $user->load(['executorPortfolios', 'executorPortfolios.files.file']);
            $user['portfolios'] = $user->executorPortfolios->map(function ($portfolio) {
                return $this->formatPortfolioResponse($portfolio);
            });
        }

        // Добавляем статистику заказчика для всех пользователей
        $user['customer_rating'] = $user->customer_rating;
        $user['customer_reviews_count'] = $user->customer_reviews_count;
        $user['customer_orders_count'] = $user->customer_orders_count;

        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }

    /**
     * @return JsonResponse
     * @throws Throwable
     */
    public function delete(): JsonResponse
    {
        $result = $this->userService->delete(auth()->user()->id);

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * @param ChangePasswordRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $result = $this->userService->changePassword($request);

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * Отправка кода для смены пароля на email
     * @param ChangePasswordSendCodeRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function changePasswordSendCode(ChangePasswordSendCodeRequest $request): JsonResponse
    {
        $result = $this->userService->changePasswordSendCode(auth()->user());

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * Подтверждение смены пароля с кодом
     * @param ChangePasswordConfirmRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function changePasswordConfirm(ChangePasswordConfirmRequest $request): JsonResponse
    {
        $result = $this->userService->changePasswordConfirm($request, auth()->user());

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }


    /**
     * Получить данные пользователя по ID
     */
    public function show(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $result = [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'type' => $user->type,
            'created_at' => $user->created_at,
        ];

        // Добавляем данные в зависимости от типа пользователя
        if ($user->type === Type::Executor->value) {
            $result['average_rating'] = $user->average_rating;
            $result['reviews_count'] = $user->reviews_count;
            $result['about_me'] = $user->about_me;
            $result['work_experience'] = $user->work_experience;
        }

        if ($user->type === Type::Customer->value) {
            $result['customer_rating'] = $user->customer_rating;
            $result['customer_reviews_count'] = $user->customer_reviews_count;
            $result['customer_orders_count'] = $user->customer_orders_count;
        }

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * @param EditRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function edit(EditRequest $request): JsonResponse
    {
        $result = $this->userService->edit(
            $request->user(), $request->validated()
        );

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $result = $this->userService->updateAvatar($request);

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * @param UpdateSettingsRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function settingsUpdate(UpdateSettingsRequest $request): JsonResponse
    {
        $result = $this->userService->settingsUpdate($request, auth()->user());

        return response()->json([
            'success' => $result
        ]);
    }

    /**
     * @return JsonResponse
     */
    public function settingsGet(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'result' => [
                'localization' => Localization::values(),
                'currency' => Currency::values(),
                'language' => Language::values(),
            ]
        ]);
    }

    /**
     * @param SetWorkSettingsRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function setWorkSettings(SetWorkSettingsRequest $request): JsonResponse
    {
        $this->userService->setWorkSettings(auth()->user(), $request->validated('work-settings'));

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Получить настройки работ исполнителя
     * @return JsonResponse
     */
    public function getWorkSettings(): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Executor->value) {
            return response()->json([
                'success' => false,
                'message' => 'Доступно только исполнителям',
            ], 403);
        }

        $workSettings = $this->userService->getWorkSettings($user);

        return response()->json([
            'success' => true,
            'result' => $workSettings,
        ]);
    }

    public function getAppSettings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'result' => [
                'direction_work' => WorkService::getDirections(),
                'types_work' => WorkService::getWorks(),
                'localization' => Localization::values(),
            ],
        ]);
    }

    /**
     * Загрузка файла лицензии для исполнителя
     * @param UploadLicenseRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function uploadLicense(UploadLicenseRequest $request): JsonResponse
    {
        $result = $this->userService->uploadLicense($request, auth()->user());

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * Форматирование ответа для портфолио
     */
    private function formatPortfolioResponse($portfolio): array
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
