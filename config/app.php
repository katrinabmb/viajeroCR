<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/Core/Env.php';

use App\Core\Env;

Env::load(dirname(__DIR__) . '/.env');

return [
    'app_name' => Env::get('APP_NAME', 'Viajero API'),
    'app_env' => Env::get('APP_ENV', 'development'),
    'db' => [
        'host' => Env::get('DB_HOST', '127.0.0.1'),
        'port' => (int) Env::get('DB_PORT', '3306'),
        'database' => Env::get('DB_DATABASE', 'viajero_cr'),
        'username' => Env::get('DB_USERNAME', 'root'),
        'password' => Env::get('DB_PASSWORD', ''),
        'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
    ],
    'allowed_origins' => array_values(array_filter(array_map(
        static fn(string $origin): string => trim($origin),
        explode(',', Env::get('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174') ?? '')
    ))),
];
