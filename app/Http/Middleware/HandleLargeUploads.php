<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleLargeUploads
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Set PHP configuration for large uploads at runtime
        ini_set('upload_max_filesize', '3G');
        ini_set('post_max_size', '3G');
        ini_set('max_file_uploads', '1000');
        ini_set('memory_limit', '1G');
        ini_set('max_execution_time', '1800');
        ini_set('max_input_time', '1800');
        ini_set('max_input_vars', '10000');
        
        return $next($request);
    }
}
