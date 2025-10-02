<?php

namespace App\Http\Middleware;

use App\Enums\Users\Type;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Throwable;

class CheckAdmin
{
    /**
     * @param Request $request
     * @param Closure $next
     * @return mixed
     * @throws Throwable
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->user() === null || $request->user()->type !== Type::Admin->value) {
            if ($request->expectsJson()) {
                throw new AccessDeniedHttpException();
            }
            
            return redirect('/admin/login');
        }

        return $next($request);
    }
}
