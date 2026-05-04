<?php

declare(strict_types=1);

require_once __DIR__ . '/src/bootstrap.php';

use App\Controllers\AuthController;
use App\Controllers\HealthController;
use App\Core\Router;

$router = new Router();

$router->get('/health', [HealthController::class, 'index']);
$router->get('/auth/me', [AuthController::class, 'me']);
$router->post('/auth/login', [AuthController::class, 'login']);
$router->post('/auth/logout', [AuthController::class, 'logout']);

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $_SERVER['REQUEST_URI'] ?? '/');
