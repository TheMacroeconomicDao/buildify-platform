<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Enums\Users\Type;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetAdminPassword extends Command
{
    protected $signature = 'admin:reset-password';
    protected $description = 'Сбросить пароль администратора';

    public function handle()
    {
        $admin = User::where('type', Type::Admin->value)->first();
        
        if (!$admin) {
            $this->error('❌ Администратор не найден!');
            return;
        }

        $newPassword = 'Admin123!';
        
        $this->info('📧 Администратор: ' . $admin->email);
        $this->info('🔍 Проверяем текущий пароль...');
        
        $isCurrentCorrect = Hash::check($newPassword, $admin->password);
        
        if ($isCurrentCorrect) {
            $this->info('✅ Пароль уже правильный: ' . $newPassword);
        } else {
            $this->warn('❌ Текущий пароль неправильный. Обновляем...');
            
            $admin->password = Hash::make($newPassword);
            $admin->save();
            
            $this->info('✅ Пароль успешно обновлен!');
        }
        
        $this->info('');
        $this->info('🔑 ДАННЫЕ ДЛЯ ВХОДА:');
        $this->info('Email: ' . $admin->email);
        $this->info('Password: ' . $newPassword);
        $this->info('');
        $this->info('🌐 Страница входа: http://localhost:8000/admin/login');
    }
}
