<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Уведомление о выборе для заказа</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
            margin: -20px -20px 20px -20px;
        }
        .order-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .detail-row {
            margin: 10px 0;
        }
        .label {
            font-weight: bold;
            color: #333;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Вы выбраны для выполнения заказа!</h1>
        </div>
        
        <p>Здравствуйте, {{ $executor->name }}!</p>
        
        <p>Поздравляем! Вы были выбраны для выполнения заказа. Пожалуйста, ознакомьтесь с деталями ниже:</p>
        
        <div class="order-details">
            <h3>Детали заказа #{{ $order->id }}</h3>
            
            <div class="detail-row">
                <span class="label">Название:</span> {{ $order->title }}
            </div>
            
            <div class="detail-row">
                <span class="label">Направление работ:</span> {{ $order->work_direction }}
            </div>
            
            <div class="detail-row">
                <span class="label">Тип работ:</span> {{ $order->work_type }}
            </div>
            
            @if($order->description)
            <div class="detail-row">
                <span class="label">Описание:</span><br>
                {{ $order->description }}
            </div>
            @endif
            
            <div class="detail-row">
                <span class="label">Адрес:</span> {{ $order->city }}, {{ $order->address }}
            </div>
            
            @if($order->work_date)
            <div class="detail-row">
                <span class="label">Дата работы:</span> {{ $order->work_date->format('d.m.Y') }}
            </div>
            @elseif($order->start_date)
            <div class="detail-row">
                <span class="label">Период работы:</span> {{ $order->start_date->format('d.m.Y') }} - {{ $order->end_date->format('d.m.Y') }}
            </div>
            @endif
            
            <div class="detail-row">
                <span class="label">Максимальная стоимость:</span> {{ number_format($order->max_amount, 0, ',', ' ') }} AED
            </div>
            
            <div class="detail-row">
                <span class="label">Заказчик:</span> {{ $order->author->name }}
            </div>
        </div>
        
        <p><strong>Следующие шаги:</strong></p>
        <ul>
            <li>Войдите в приложение Buildlify</li>
            <li>Перейдите в раздел "Мои заказы"</li>
            <li>Подтвердите принятие заказа в работу</li>
            <li>Свяжитесь с заказчиком для уточнения деталей</li>
        </ul>
        
        <p>Пожалуйста, подтвердите принятие заказа в течение 24 часов, иначе заказ может быть передан другому исполнителю.</p>
        
        <div class="footer">
            <p>С уважением,<br>Команда Buildlify</p>
            <p><small>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</small></p>
        </div>
    </div>
</body>
</html>
