<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetDynamicUrl
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Set the application URL based on the current request
        $scheme = $request->getScheme();
        $host = $request->getHost();
        $port = $request->getPort();
        
        // Build the URL
        $url = $scheme . '://' . $host;
        
        // Add port if it's not standard (80 for HTTP, 443 for HTTPS)
        if (($scheme === 'http' && $port !== 80) || ($scheme === 'https' && $port !== 443)) {
            $url .= ':' . $port;
        }
        
        // Set the application URL for this request
        URL::forceRootUrl($url);
        
        return $next($request);
    }
}
