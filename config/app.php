<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/Core/Env.php';

use App\Core\Env;

Env::load(dirname(__DIR__) . '/.env');

return [
    'app_name' => Env::get('APP_NAME', 'Viajero API'),
    'app_env' => Env::get('APP_ENV', 'development'),
    'app_key' => Env::get('APP_KEY', 'change-this-in-development'),
    'db_connections' => [
        [
            'name' => 'production',
            'host' => Env::get('PROD_DB_HOST', 'localhost'),
            'port' => (int) Env::get('PROD_DB_PORT', '3306'),
            'database' => Env::get('PROD_DB_DATABASE', ''),
            'username' => Env::get('PROD_DB_USERNAME', ''),
            'password' => Env::get('PROD_DB_PASSWORD', ''),
            'charset' => Env::get('PROD_DB_CHARSET', 'utf8mb4'),
        ],
        [
            'name' => 'local',
            'host' => Env::get('LOCAL_DB_HOST', '127.0.0.1'),
            'port' => (int) Env::get('LOCAL_DB_PORT', '3306'),
            'database' => Env::get('LOCAL_DB_DATABASE', 'viajero_cr'),
            'username' => Env::get('LOCAL_DB_USERNAME', 'root'),
            'password' => Env::get('LOCAL_DB_PASSWORD', ''),
            'charset' => Env::get('LOCAL_DB_CHARSET', 'utf8mb4'),
        ],
    ],
    'auth' => [
        'access_cookie' => 'viajero_access',
        'refresh_cookie' => 'viajero_refresh',
        'access_token_ttl' => (int) Env::get('ACCESS_TOKEN_TTL', '900'),
        'refresh_token_ttl' => (int) Env::get('REFRESH_TOKEN_TTL', '2592000'),
    ],
    'allowed_origins' => array_values(array_filter(array_map(
        static fn(string $origin): string => trim($origin),
        explode(',', Env::get('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174') ?? '')
    ))),
];
