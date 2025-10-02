<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class AdminNotification extends Model
{
    use AsSource, Filterable;

    protected $fillable = [
        'title',
        'message',
        'type',
        'data',
        'read_at',
        'admin_id',
        'related_model_type',
        'related_model_id',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    protected $allowedFilters = [
        'type',
        'read_status',
        'read_at',
        'created_at',
    ];

    protected $allowedSorts = [
        'id',
        'created_at',
        'read_at',
        'type',
    ];

    /**
     * Администратор, которому предназначено уведомление
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Связанная модель (заказ, жалоба и т.д.)
     */
    public function relatedModel()
    {
        if ($this->related_model_type && $this->related_model_id) {
            return $this->related_model_type::find($this->related_model_id);
        }
        return null;
    }

    /**
     * Отметить как прочитанное
     */
    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Проверить, прочитано ли уведомление
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    /**
     * Создать новое уведомление для всех администраторов
     */
    public static function createForAllAdmins(
        string $title,
        string $message,
        string $type = 'info',
        array $data = [],
        ?Model $relatedModel = null
    ): void {
        $admins = User::where('type', \App\Enums\Users\Type::Admin->value)->get();

        foreach ($admins as $admin) {
            self::create([
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'data' => $data,
                'admin_id' => $admin->id,
                'related_model_type' => $relatedModel ? get_class($relatedModel) : null,
                'related_model_id' => $relatedModel?->id,
            ]);
        }
    }

    /**
     * Типы уведомлений
     */
    public static function getTypes(): array
    {
        return [
            'info' => 'Информация',
            'warning' => 'Предупреждение',
            'error' => 'Ошибка',
            'success' => 'Успех',
            'new_user' => 'Новый пользователь',
            'new_order' => 'Новый заказ',
            'new_complaint' => 'Новая жалоба',
            'verification_request' => 'Запрос на верификацию',
        ];
    }
}
