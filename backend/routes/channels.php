<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\User;
use App\Enums\Users\Type;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Канал для уведомлений конкретного пользователя
Broadcast::channel('user.{id}', function (User $user, int $id) {
    return (int) $user->id === (int) $id;
});

// Канал для администраторов
Broadcast::channel('admin', function (User $user) {
    return $user->type === Type::Admin->value;
});

// Канал для заказчиков
Broadcast::channel('customers', function (User $user) {
    return $user->type === Type::Customer->value;
});

// Канал для исполнителей
Broadcast::channel('executors', function (User $user) {
    return $user->type === Type::Executor->value;
});

// Канал для посредников
Broadcast::channel('mediators', function (User $user) {
    return $user->type === Type::Mediator->value;
});

// Канал для конкретного заказа (доступен автору, исполнителю и посреднику)
Broadcast::channel('order.{id}', function (User $user, int $id) {
    $order = \App\Models\Order::find($id);
    
    if (!$order) {
        return false;
    }
    
    // Автор заказа
    if ($user->id === $order->author_id) {
        return true;
    }
    
    // Исполнитель заказа
    if ($user->id === $order->executor_id) {
        return true;
    }
    
    // Посредник заказа
    if ($user->id === $order->mediator_id) {
        return true;
    }
    
    // Администраторы
    if ($user->type === Type::Admin->value) {
        return true;
    }
    
    return false;
});

// Канал для жалоб (доступен участникам жалобы и администраторам)
Broadcast::channel('complaint.{id}', function (User $user, int $id) {
    $complaint = \App\Models\Complaint::find($id);
    
    if (!$complaint) {
        return false;
    }
    
    // Участники жалобы
    if ($user->id === $complaint->complainant_id || $user->id === $complaint->reported_user_id) {
        return true;
    }
    
    // Администраторы
    if ($user->type === Type::Admin->value) {
        return true;
    }
    
    return false;
});
