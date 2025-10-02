<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Broadcasting\BroadcastController as BaseBroadcastController;

class BroadcastController extends BaseBroadcastController
{
    /**
     * Authenticate the request for channel access.
     */
    public function authenticate(Request $request)
    {
        // Проверяем, что пользователь аутентифицирован
        if (!$request->user()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return parent::authenticate($request);
    }
}
