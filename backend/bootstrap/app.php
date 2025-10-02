<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\Routing\Exception\RouteNotFoundException;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            // Кастомные маршруты платформы (Orchid регистрирует свои автоматически)
            Route::middleware('web')
                ->prefix('admin')
                ->group(base_path('routes/platform.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->validateCsrfTokens(except: [
            'stripe/*',
            '/systems/files',
        ]);
        
        // Trust proxies for tunnels (ngrok, etc.)
        $middleware->trustProxies(at: '*');
        
        // Add dynamic URL middleware to web group (отключено для локальной разработки)
        // if (!app()->environment('local')) {
        //     $middleware->web(append: [
        //         \App\Http\Middleware\SetDynamicUrl::class,
        //     ]);
        // }
        
        // Register middleware aliases
        $middleware->alias([
            'check.admin' => \App\Http\Middleware\CheckAdmin::class,
            'platform' => \Orchid\Platform\Http\Middleware\Access::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($e instanceof ValidationException) {
                //-- @todo
                return;
            }

            // Handle Orchid authentication for admin panel
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException && 
                $e->getStatusCode() === 401 && 
                $request->is('admin*') && 
                !$request->expectsJson()) {
                return redirect('/admin/login');
            }

            $message = $e->getMessage();
            $code = $e->getCode();
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                $code = $e->getStatusCode();
            }

            if ($message === 'Route [login] not defined.') {
                $message = __('user.you_are_not_authorize');
                $code = 401;
            }
            
            // Handle authentication errors properly
            if ($message === 'Unauthenticated.' || $message === 'Unauthenticated') {
                $code = 401;
            }
            
            if ($message === 'Invalid verification code') {
                $result = [
                    'success' => false,
                    'message' => [
                        'code' => [
                            $message
                        ]
                    ]
                ];

            } else if ($message === 'Invalid password') {
                $result = [
                    'success' => false,
                    'message' => [
                        'password' => [
                            $message
                        ]
                    ]
                ];

            } else {
                $result = [
                    'success' => false,
                    'error' => (!empty($message)) ? $message : __('user.an_error_occurred_please_try_later')
                ];
            }

            $headers = [
                'Content-Type' => 'application/json;charset=UTF-8', 'Charset' => 'utf-8'
            ];

            // Fix: Don't override authentication error codes with 400
            if ($code === 0 || $code === null || is_string($code)) {
                // If it's an authentication error, use 401, otherwise use 400
                if ($message === 'Unauthenticated.' || $message === 'Unauthenticated') {
                    $code = 401;
                } else {
                    $code = 400;
                }
            }

            return response()->json($result, $code, $headers, JSON_UNESCAPED_UNICODE);
        });
    })->create();
