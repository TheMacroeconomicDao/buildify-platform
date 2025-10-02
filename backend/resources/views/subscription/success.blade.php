<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Success</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f8f9fa;
        }
        .success-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
            margin: 0 auto;
        }
        .success-icon {
            font-size: 48px;
            color: #28a745;
            margin-bottom: 20px;
        }
        .success-title {
            color: #28a745;
            margin-bottom: 15px;
        }
        .success-message {
            color: #6c757d;
            margin-bottom: 20px;
        }
        .redirect-message {
            color: #007bff;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="success-container">
        <div class="success-icon">✅</div>
        <h1 class="success-title">Payment Successful!</h1>
        <p class="success-message">{{ $message }}</p>
        <p class="redirect-message">Redirecting you back to the app...</p>
    </div>

    <script>
        // Автоматически закрываем окно через 2 секунды
        setTimeout(function() {
            // Пытаемся закрыть окно (для WebView)
            if (window.close) {
                window.close();
            }
            // Или перенаправляем обратно в приложение
            window.location.href = 'buildify://payment/success?success=true&transaction_id={{ $transaction_id }}';
        }, 2000);
    </script>
</body>
</html>
