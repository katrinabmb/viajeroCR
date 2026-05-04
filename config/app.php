<?php

declare(strict_types=1);

$databaseConfig = require __DIR__ . '/database.php';

return [
    'app_name' => 'Viajero API',
    'app_env' => $databaseConfig['environment'] ?? 'development',
    'app_key' => 'viajero_app_key_change_this_in_production',
    'db_connections' => $databaseConfig['connections'] ?? [],
    'auth' => [
        'access_cookie' => 'viajero_access',
        'refresh_cookie' => 'viajero_refresh',
        'access_token_ttl' => 900,
        'refresh_token_ttl' => 2592000,
    ],
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://dashboard.viajerocr.com',
        'https://dashboard.viajerocr.com',
        'http://send-form.viajerocr.com',
        'https://send-form.viajerocr.com',
        'http://api.viajerocr.com',
        'https://api.viajerocr.com',
    ],
];
