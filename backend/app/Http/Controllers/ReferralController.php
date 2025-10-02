<?php

namespace App\Http\Controllers;

use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReferralController extends Controller
{
    protected ReferralService $referralService;

    public function __construct(ReferralService $referralService)
    {
        $this->referralService = $referralService;
    }

    /**
     * Получить статистику рефералов текущего пользователя
     * 
     * @return JsonResponse
     */
    public function getMyStats(): JsonResponse
    {
        try {
            $user = auth()->user();
            $stats = $this->referralService->getReferralStats($user);

            return response()->json([
                'success' => true,
                'result' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load referral statistics'
            ], 500);
        }
    }

    /**
     * Получить список рефералов текущего пользователя
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getMyReferrals(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ], 400);
            }

            $user = auth()->user();
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 20);

            $referrals = $this->referralService->getUserReferrals($user, $page, $perPage);

            return response()->json([
                'success' => true,
                'result' => $referrals
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load referrals list'
            ], 500);
        }
    }

    /**
     * Использовать реферальный баланс
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function useBalance(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'nullable|numeric|min:0.01',
                'amount_cents' => 'nullable|integer|min:1',
                'reason' => 'nullable|string|max:255'
            ]);
            
            // Поддерживаем оба формата: amount (AED) и amount_cents (центы)
            $amountCents = $request->amount_cents ?? ($request->amount * 100);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ], 400);
            }

            $user = auth()->user();
            $reason = $request->get('reason', 'service_payment');
            
            // Проверяем что передана сумма
            if (!$amountCents || $amountCents <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Amount is required and must be greater than 0'
                ], 400);
            }

            // Проверяем достаточность средств
            if (!$user->hasReferralBalance($amountCents)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient referral balance'
                ], 400);
            }

            $success = $this->referralService->useReferralBalance($user, $amountCents, $reason);

            if ($success) {
                // Возвращаем обновлённую статистику
                $stats = $this->referralService->getReferralStats($user->fresh());

                return response()->json([
                    'success' => true,
                    'message' => 'Referral balance used successfully',
                    'result' => [
                        'used_amount_cents' => $amountCents,
                        'used_amount_aed' => round($amountCents / 100, 2),
                        'remaining_balance_cents' => $user->fresh()->referral_balance,
                        'remaining_balance_aed' => $stats['referral_balance_aed']
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to use referral balance'
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error using referral balance'
            ], 500);
        }
    }

    /**
     * Валидировать промокод
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function validateCode(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'code' => 'required|string|max:20'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ], 400);
            }

            $code = strtoupper($request->get('code'));
            $user = auth()->user();

            $validation = $this->referralService->validateReferralCode($code, $user);

            return response()->json([
                'success' => $validation['valid'],
                'message' => $validation['message'] ?? null,
                'result' => $validation
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error validating referral code'
            ], 500);
        }
    }

    /**
     * Получить информацию о реферальном коде пользователя
     * 
     * @return JsonResponse
     */
    public function getMyReferralCode(): JsonResponse
    {
        try {
            $user = auth()->user();
            $referralCode = $user->getOrCreateReferralCode();

            return response()->json([
                'success' => true,
                'result' => [
                    'code' => $referralCode->code,
                    'is_active' => $referralCode->is_active,
                    'created_at' => $referralCode->created_at,
                    'share_url' => config('app.url') . '/referral/' . $referralCode->code,
                    'share_text' => "Join Buildlify and use my referral code {$referralCode->code} during registration! 🎯",
                    'share_message' => "Join Buildlify and use my referral code {$referralCode->code} during registration! 🎯"
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get referral code'
            ], 500);
        }
    }
}
