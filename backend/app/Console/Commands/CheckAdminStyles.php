<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class CheckAdminStyles extends Command
{
    protected $signature = 'admin:check-styles';
    protected $description = 'Проверить загрузку стилей и скриптов админки';

    public function handle()
    {
        $this->info('🎨 ПРОВЕРКА СТИЛЕЙ АДМИНКИ');
        $this->info('');

        $baseUrl = 'http://localhost:8000';
        
        $resources = [
            'CSS: Улучшения' => '/css/admin-improvements.css',
            'CSS: Безопасные стили таблиц' => '/css/admin-table-safe.css',
            'JS: Безопасные скрипты таблиц' => '/js/admin-tables-safe.js',
        ];

        foreach ($resources as $name => $path) {
            $response = Http::get($baseUrl . $path);
            $status = $response->status();
            $size = strlen($response->body());
            
            if ($status === 200) {
                $this->info("✅ {$name}: OK ({$status}) - {$size} bytes");
            } else {
                $this->error("❌ {$name}: Error ({$status})");
            }
        }

        $this->info('');
        $this->info('📋 УЛУЧШЕНИЯ ТАБЛИЦ:');
        $this->info('• Увеличенная ширина колонок');
        $this->info('• Улучшенные стили заголовков');
        $this->info('• Hover эффекты для строк');
        $this->info('• Адаптивный дизайн');
        $this->info('• Улучшенная типографика');
        $this->info('• Автоматическое обрезание длинного текста');
        $this->info('• Улучшенная пагинация');
        $this->info('• Интерактивные элементы');
        
        $this->info('');
        $this->info('🎯 ОБЩИЕ УЛУЧШЕНИЯ:');
        $this->info('• Современный дизайн кнопок');
        $this->info('• Градиентные фоны');
        $this->info('• Анимации и переходы');
        $this->info('• Улучшенный сайдбар');
        $this->info('• Современные формы');
        $this->info('• Улучшенные алерты');
        
        $this->info('');
        $this->info('🌐 Откройте админку: http://localhost:8000/admin');
        $this->info('💡 Изменения применятся после перезагрузки страницы');
    }
}
