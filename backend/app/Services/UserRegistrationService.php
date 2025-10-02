<?php

namespace App\Services;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use App\Http\Requests\Registration\ChangePasswordRequest;
use App\Http\Requests\Registration\PasswordRecoveryRequest;
use App\Http\Requests\Registration\RegistrationEndRequest;
use App\Http\Requests\Registration\RegistrationStartRequest;
use App\Mail\SendVerificationCode;
use App\Models\User;
use App\Models\UserWork;
use App\Models\WorkType;
use App\Models\Verification;
use App\Services\PartnerProgramService;
use Exception;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Throwable;

class UserRegistrationService
{
    /**
     * @param RegistrationStartRequest $request
     * @return string
     * @throws Throwable
     */
    public function start(RegistrationStartRequest $request): string
    {
        $this->checkPassword($request->password, $request->confirmed_password);

        $this->sendNewVerificationCode($request->email);

        return __('user.registration_code_sent_by_email');
    }

    /**
     * @param RegistrationEndRequest $request
     * @return void
     * @throws Throwable
     */
    public function end(RegistrationEndRequest $request): void
    {
        $this->checkPassword($request->password, $request->confirmed_password);

        $verification = Verification::where('email', strtolower($request->email))->first();

        throw_if(
            $verification === null,
            new BadRequestHttpException(__('user.invalid_verification_code'))
        );

        if ($verification->code !== $request->code) {
            $verification->update(['attempts' => $verification->attempts + 1]);
        }

        throw_if(
            $verification->code !== $request->code,
            new BadRequestHttpException(__('user.invalid_verification_code'))
        );

        throw_if(
            $verification->attempts > 3,
            new BadRequestHttpException(__('user.maximum_number_of_water_codes_has_been_exceeded'))
        );

        // Определяем статус верификации в зависимости от типа пользователя
        $verificationStatus = $request->type == Type::Executor->value 
            ? VerificationStatus::Pending->value 
            : VerificationStatus::NotRequired->value;

        $userData = [
            'name' => $request->name,
            'phone' => $request->phone,
            'type' => $request->type,
            'verification_status' => $verificationStatus,
            'status' => Status::Active->value,
            'email_verified_at' => time(),
            'password' => Hash::make($request->password),
        ];

        // Добавляем birth_date только для заказчиков
        if ($request->type == Type::Customer->value && $request->birth_date) {
            $userData['birth_date'] = $request->birth_date;
        }

        $user = User::updateOrCreate(
            [
                'email' => strtolower($request->email)
            ],
            $userData
        );

        // Сохраняем типы работ для исполнителей
        if ($request->type == Type::Executor->value && $request->work_types) {
            // Очищаем старые типы работ
            $user->works()->delete();
            
            // Добавляем новые
            foreach ($request->work_types as $workTypeKey) {
                // Находим тип работы и его направление
                $workType = WorkType::where('key', $workTypeKey)->first();
                if ($workType) {
                    $workDirection = $workType->workDirection;
                    $user->works()->create([
                        'direction' => $workDirection ? $workDirection->key : $workTypeKey,
                        'type' => $workTypeKey,
                    ]);
                }
            }
        }

        // ===== REFERRAL SYSTEM INTEGRATION =====
        
        // Создаём промокод для нового пользователя
        $referralService = app(ReferralService::class);
        $referralService->createReferralCode($user);
        
        // Обрабатываем реферальную регистрацию если указан промокод
        if ($request->promo_code && $request->type == Type::Executor->value) {
            $referralService->processReferralRegistration($user, $request->promo_code);
        }

        // ===== PARTNER PROGRAM INTEGRATION =====
        // Обрабатываем регистрацию через партнерскую программу
        if ($request->partner_id) {
            $partnerService = app(PartnerProgramService::class);
            $partnerService->handleUserRegistration($user, $request->partner_id, [
                'source' => $request->referral_source ?? 'direct',
                'campaign' => $request->campaign ?? null,
                'device' => $request->device ?? null,
            ]);
            
            Log::info('User registered through partner program', [
                'user_id' => $user->id,
                'partner_id' => $request->partner_id,
            ]);
        }

        //$user = new User();
        //$user->name = $request->name;
        //$user->email = $request->email;
        //$user->email_verified_at = time();
        //$user->password = Hash::make($request->password);
//
//
        //throw_if(
        //    $user->save() === false,
        //    new BadRequestHttpException(__('user.error_during_registration'))
        //);

        $verification->delete();
    }

    /**
     * @param PasswordRecoveryRequest $request
     * @return string
     * @throws Exception
     */
    public function passwordRecovery(PasswordRecoveryRequest $request): string
    {
        $this->sendNewVerificationCode($request->email);

        return __('user.password_recovery_code_sent_by_email');
    }

    /**
     * @param string $email
     * @return void
     * @throws Exception
     */
    public function sendNewVerificationCode(string $email): void
    {
        $code = $this->generateCode();

        Verification::updateOrCreate(
            ['email' => strtolower($email),],
            ['code' => $code, 'attempts' => 0,]
        );

        Mail::to($email)->send(new SendVerificationCode($code));
    }

    /**
     * @param ChangePasswordRequest $request
     * @return string
     * @throws Throwable
     */
    public function changePassword(ChangePasswordRequest $request): string
    {
        $this->checkPassword($request->password, $request->confirmed_password);

        $verification = Verification::where('email', strtolower($request->email))->first();

        throw_if(
            $verification === null,
            new BadRequestHttpException(__('user.invalid_verification_code'))
        );

        if ($verification->code !== $request->code) {
            $verification->update(['attempts' => $verification->attempts + 1]);
        }

        throw_if(
            $verification->code !== $request->code,
            new BadRequestHttpException(__('user.invalid_verification_code'))
        );

        throw_if(
            $verification->attempts > 3,
            new BadRequestHttpException(__('user.maximum_number_of_water_codes_has_been_exceeded'))
        );

        $user = User::where('email', strtolower($request->email))->first();
        $result = $user->update(['password' => Hash::make($request->password)]);

        throw_if(
            $result === false,
            new BadRequestHttpException(__('user.failed_to_change_password'))
        );

        $verification->delete();

        return __('user.password_changed_successfully');
    }

    /**
     * @return int
     * @throws Exception
     */
    private function generateCode(): int
    {
        return random_int(1000, 9999);
    }

    /**
     * @param string $password
     * @param string $confirmed_password
     * @return void
     * @throws Throwable
     */
    private function checkPassword(string $password, string $confirmed_password): void
    {
        throw_if(
            $password !== $confirmed_password,
            new BadRequestHttpException(__('user.passwords_dont_match'))
        );
    }
}
