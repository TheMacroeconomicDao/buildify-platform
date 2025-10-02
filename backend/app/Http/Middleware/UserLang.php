<?php

namespace App\Http\Middleware;

use App\Services\UserService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class UserLang
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->user() === null) {
            $locale = "en-US";
        } else {
            $locale = app(UserService::class)->settingsGet(auth()->user())['localization'] ?? "en-US";
        }

        $lang = explode('-', $locale);
        App::setLocale($lang[0]);
        return $next($request);
    }
}
