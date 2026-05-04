<?php

declare(strict_types=1);

$httpHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
$productionHosts = [
    'api.viajerocr.com',
    'send-form.viajerocr.com',
];

$productionConnection = [
    'name' => 'production',
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'u768363471_viajerocr',
    'username' => 'u768363471_viajerocr',
    'password' => '!o7Eq5>H?',
    'charset' => 'utf8mb4',
];

$productionOverrideFile = __DIR__ . '/database.production.php';

if (is_file($productionOverrideFile)) {
    $productionOverrides = require $productionOverrideFile;

    if (is_array($productionOverrides)) {
        $productionConnection = array_merge($productionConnection, $productionOverrides);
    }
}

$localConnection = [
    'name' => 'local',
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'viajero_cr',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
];

$isProductionRequest = in_array($httpHost, $productionHosts, true);

return [
    'environment' => $isProductionRequest ? 'production' : 'development',
    'connections' => $isProductionRequest
        ? [$productionConnection, $localConnection]
        : [$localConnection, $productionConnection],
];
