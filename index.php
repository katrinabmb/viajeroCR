<?php

declare(strict_types=1);

require_once __DIR__ . '/src/bootstrap.php';

use App\Controllers\AuthController;
use App\Controllers\HealthController;
use App\Controllers\Seccion1SliderController;
use App\Core\Router;

$router = new Router();

$router->get('/health', [HealthController::class, 'index']);
$router->get('/auth/me', [AuthController::class, 'me']);
$router->post('/auth/login', [AuthController::class, 'login']);
$router->post('/auth/refresh', [AuthController::class, 'refresh']);
$router->post('/auth/logout', [AuthController::class, 'logout']);

// Seccion 1 slider
$router->get('/seccion1/slides', [Seccion1SliderController::class, 'listPublic']);
$router->get('/admin/seccion1/slides', [Seccion1SliderController::class, 'listAdmin']);
$router->post('/admin/seccion1/upload-temp', [Seccion1SliderController::class, 'uploadTemp']);
$router->post('/admin/seccion1/slides', [Seccion1SliderController::class, 'create']);
$router->post('/admin/seccion1/slides/update', [Seccion1SliderController::class, 'update']);
$router->post('/admin/seccion1/slides/active', [Seccion1SliderController::class, 'setActive']);
$router->post('/admin/seccion1/slides/delete', [Seccion1SliderController::class, 'delete']);
$router->post('/admin/seccion1/slides/reorder', [Seccion1SliderController::class, 'reorder']);

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $_SERVER['REQUEST_URI'] ?? '/');
