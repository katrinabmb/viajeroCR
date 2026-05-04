<?php

declare(strict_types=1);

return [
    'app_name' => 'Viajero API',
    'app_env' => 'development',
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'viajero_cr',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
    ],
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:5174',
    ],
];
