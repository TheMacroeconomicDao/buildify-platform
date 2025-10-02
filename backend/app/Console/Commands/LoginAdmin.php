<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Enums\Users\Type;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;

class LoginAdmin extends Command
{
    protected $signature = 'admin:login';
    protected $description = 'Войти в админку как администратор';

    public function handle()
    {
        $admin = User::where('type', Type::Admin->value)->first();
        
        if (!$admin) {
            $this->error('❌ Администратор не найден!');
            return;
        }

        $this->info('✅ Найден администратор: ' . $admin->email);
        $this->info('');
        $this->info('🌐 Для входа в админку:');
        $this->info('1. Откройте http://localhost:8000/admin (перенаправит на форму входа)');
        $this->info('2. Или откройте напрямую: http://localhost:8000/admin/login');
        $this->info('3. Используйте данные:');
        $this->info('   Email: ' . $admin->email);
        $this->info('   Password: Admin123!');
        $this->info('');
        $this->info('💡 Если возникают проблемы со входом, выполните: php artisan admin:reset-password');
    }
}
