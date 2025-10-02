<?php

namespace App\Http\Controllers;

use App\Enums\Users\Status;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', strtolower($request->email))->first();
        $result = [];
        $code  = 200;
        if ($user === null || $user->status == Status::Deleted->value) {
            $code  = 422;
            $result = [
                'success' => false,
                'message' => [
                    'email' => [
                        __('user.user_not_found')
                    ]
                ]
            ];
        } else if (!Hash::check($request->password, $user->password)) {
            $code  = 422;
            $result = [
                'success' => false,
                'message' => [
                    'password' => [
                        __('user.invalid_password')
                    ]
                ]
            ];
        } else {

            $token = $user->createToken('user');
            $result = [
                'success' => true,
                'user' => $user,
                'token' => $token->plainTextToken
            ];

        }

        return response()->json($result, $code);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function logout(Request $request): JsonResponse
    {
        throw_if(
            auth()->user() === null,
            new BadRequestHttpException(__('user.user_not_found'))
        );

        auth()->user()->tokens()->delete();

        return response()->json([
            'success' => true,
        ]);
    }
}
