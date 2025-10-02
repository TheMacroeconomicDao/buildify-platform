<?php

namespace App\Http\Controllers;

use App\Models\Partner;
use App\Services\PartnerProgramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PartnerProgramController extends Controller
{
    private PartnerProgramService $partnerService;

    public function __construct(PartnerProgramService $partnerService)
    {
        $this->partnerService = $partnerService;
    }

    /**
     * Обработать переход по реферальной ссылке
     */
    public function handleReferralLink(string $partnerId, Request $request): JsonResponse
    {
        try {
            $partner = Partner::where('partner_id', $partnerId)
                ->where('is_active', true)
                ->first();

            if (!$partner) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or inactive partner link'
                ], 404);
            }

            // Логируем переход по ссылке
            \Log::info('Referral link clicked', [
                'partner_id' => $partnerId,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'referer' => $request->header('referer'),
            ]);

            // Определяем, откуда пришел пользователь
            $source = 'direct';
            $userAgent = $request->userAgent();
            
            if (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
                $source = 'ios';
            } elseif (str_contains($userAgent, 'Android')) {
                $source = 'android';
            }

            return response()->json([
                'success' => true,
                'partner' => [
                    'id' => $partner->partner_id,
                    'name' => $partner->name,
                ],
                'redirect' => [
                    'app_store' => 'https://apps.apple.com/app/buildlify',
                    'google_play' => 'https://play.google.com/store/apps/details?id=com.buildlify',
                    'deep_link' => "buildlify://ref/{$partnerId}",
                ],
                'metadata' => [
                    'source' => $source,
                    'timestamp' => now()->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error handling referral link', [
                'partner_id' => $partnerId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error processing referral link'
            ], 500);
        }
    }

    /**
     * Зарегистрировать пользователя через партнерскую программу
     */
    public function registerWithPartner(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'partner_id' => 'required|string|exists:partners,partner_id',
            'user_data' => 'required|array',
            'source' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Здесь должна быть логика регистрации пользователя
            // Пока возвращаем успех для интеграции
            
            return response()->json([
                'success' => true,
                'message' => 'User registered through partner program',
                'partner_id' => $request->partner_id,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed'
            ], 500);
        }
    }

    /**
     * Получить статистику партнера (для партнерского кабинета)
     */
    public function getPartnerStats(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Находим партнера по пользователю
            $partner = Partner::where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if (!$partner) {
                return response()->json([
                    'success' => false,
                    'message' => 'Partner account not found'
                ], 404);
            }

            $stats = $this->partnerService->getPartnerStats($partner);

            return response()->json([
                'success' => true,
                'result' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load partner statistics'
            ], 500);
        }
    }

    /**
     * Запросить выплату (для партнера)
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|in:bank_transfer,account_balance',
            'payment_details' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            $partner = Partner::where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if (!$partner) {
                return response()->json([
                    'success' => false,
                    'message' => 'Partner account not found'
                ], 404);
            }

            if (!$partner->canWithdraw()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient balance or account not eligible for withdrawal'
                ], 400);
            }

            if ($request->amount > $partner->pending_earnings) {
                return response()->json([
                    'success' => false,
                    'message' => 'Requested amount exceeds available balance'
                ], 400);
            }

            // Создаем запрос на выплату (обновляем существующие награды)
            $rewards = $partner->approvedRewards()
                ->where('payment_method', null)
                ->orderBy('created_at')
                ->get();

            $totalRequested = 0;
            foreach ($rewards as $reward) {
                if ($totalRequested + $reward->reward_amount <= $request->amount) {
                    $reward->update([
                        'payment_method' => $request->payment_method,
                        'payment_details' => json_encode($request->payment_details),
                        'notes' => 'Payout requested by partner',
                    ]);
                    $totalRequested += $reward->reward_amount;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Payout request submitted successfully',
                'result' => [
                    'requested_amount' => $totalRequested,
                    'payment_method' => $request->payment_method,
                    'status' => 'pending_admin_approval',
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process payout request'
            ], 500);
        }
    }

    /**
     * Получить QR код для реферальной ссылки
     */
    public function getQRCode(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $partner = Partner::where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if (!$partner) {
                return response()->json([
                    'success' => false,
                    'message' => 'Partner account not found'
                ], 404);
            }

            $referralLink = $partner->getMobileReferralLink();
            
            // Генерируем QR код (можно использовать библиотеку SimpleSoftwareIO/simple-qrcode)
            $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($referralLink);

            return response()->json([
                'success' => true,
                'result' => [
                    'referral_link' => $referralLink,
                    'qr_code_url' => $qrCodeUrl,
                    'partner_id' => $partner->partner_id,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code'
            ], 500);
        }
    }
}