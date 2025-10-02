<?php

namespace App\Http\Controllers;

use App\Enums\Users\Status;
use App\Http\Requests\Registration\ChangePasswordRequest;
use App\Http\Requests\Registration\PasswordRecoveryRequest;
use App\Http\Requests\Registration\RegistrationEndRequest;
use App\Http\Requests\Registration\RegistrationStartRequest;
use App\Models\User;
use App\Services\UserRegistrationService;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class RegistrationController extends Controller
{
    private $registrationService;

    public function __construct(UserRegistrationService $registrationService)
    {
        $this->registrationService = $registrationService;
    }

    public function start(RegistrationStartRequest $request)
    {
        $userEmailCount = User::where('email', strtolower($request->email))->where('status', Status::Active->value)->count();
        $userPhoneCount = User::where('phone', $request->phone)->where('status', Status::Active->value)->count();

        throw_if(
            $userEmailCount > 0 || $userPhoneCount > 0,
            new BadRequestHttpException(__('user.user_with_this_email_already_exists'))
        );

        $result = $this->registrationService->start($request);

        return response()->json([
            'success' => true,
            'result' => $result
        ]);
    }

    public function end(RegistrationEndRequest $request)
    {
        $userEmailCount = User::where('email', strtolower($request->email))->where('status', Status::Active->value)->count();
        $userPhoneCount = User::where('phone', $request->phone)->where('status', Status::Active->value)->count();

        throw_if(
            $userEmailCount > 0 || $userPhoneCount > 0,
            new BadRequestHttpException(__('user.user_with_this_email_already_exists'))
        );

        $this->registrationService->end($request);

        $user = User::where('email', strtolower($request->email))->first();

        $token = $user->createToken('user');

        return response()->json([
            'success' => true,
            'user' => $user,
            'token' => $token->plainTextToken
        ]);
    }

    public function passwordRecovery(PasswordRecoveryRequest $request)
    {
        $result = $this->registrationService->passwordRecovery($request);

        return response()->json([
            'success' => true,
            'result' => $result
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $result = $this->registrationService->changePassword($request);

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }
}
