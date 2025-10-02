<?php

namespace App\Http\Middleware;

use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckExecutorVerification
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        // Если пользователь не авторизован, пропускаем проверку (это должно обрабатываться в auth middleware)
        if (!$user) {
            return $next($request);
        }

        // Проверяем только исполнителей
        if ($user->type === Type::Executor->value) {
            // Если исполнитель не верифицирован, блокируем доступ
            if ($user->verification_status !== VerificationStatus::Approved->value) {
                return response()->json([
                    'success' => false,
                    'error' => 'Доступ ограничен. Ваш аккаунт ожидает верификации.',
                    'verification_status' => $user->verification_status,
                    'verification_comment' => $user->verification_comment,
                ], 403);
            }
        }

        return $next($request);
    }
}