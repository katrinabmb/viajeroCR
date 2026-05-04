<?php

declare(strict_types=1);

require_once __DIR__ . '/src/bootstrap.php';

use App\Controllers\AuthController;
use App\Controllers\AfiliadosController;
use App\Controllers\HealthController;
use App\Controllers\Seccion1SliderController;
use App\Controllers\Seccion3DestinosController;
use App\Controllers\Seccion4ServiciosController;
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

// Afiliados
$router->get('/afiliados', [AfiliadosController::class, 'publicData']);
$router->get('/admin/afiliados', [AfiliadosController::class, 'adminData']);
$router->post('/admin/afiliados/title', [AfiliadosController::class, 'updateTitle']);
$router->post('/admin/afiliados/upload-temp', [AfiliadosController::class, 'uploadTemp']);
$router->post('/admin/afiliados/logos', [AfiliadosController::class, 'create']);
$router->post('/admin/afiliados/logos/update', [AfiliadosController::class, 'update']);
$router->post('/admin/afiliados/logos/active', [AfiliadosController::class, 'setActive']);
$router->post('/admin/afiliados/logos/delete', [AfiliadosController::class, 'delete']);
$router->post('/admin/afiliados/logos/reorder', [AfiliadosController::class, 'reorder']);

// Seccion 3 destinos (continentes + destinos)
$router->get('/seccion3', [Seccion3DestinosController::class, 'publicData']);
$router->get('/admin/seccion3/continents', [Seccion3DestinosController::class, 'adminContinents']);
$router->get('/admin/seccion3/destinations', [Seccion3DestinosController::class, 'adminDestinations']);
$router->post('/admin/seccion3/title', [Seccion3DestinosController::class, 'updateTitle']);
$router->post('/admin/seccion3/upload-temp', [Seccion3DestinosController::class, 'uploadTemp']);
$router->post('/admin/seccion3/continents', [Seccion3DestinosController::class, 'continentCreate']);
$router->post('/admin/seccion3/continents/update', [Seccion3DestinosController::class, 'continentUpdate']);
$router->post('/admin/seccion3/continents/active', [Seccion3DestinosController::class, 'continentSetActive']);
$router->post('/admin/seccion3/continents/delete', [Seccion3DestinosController::class, 'continentDelete']);
$router->post('/admin/seccion3/continents/reorder', [Seccion3DestinosController::class, 'continentReorder']);
$router->post('/admin/seccion3/destinations', [Seccion3DestinosController::class, 'destinationCreate']);
$router->post('/admin/seccion3/destinations/update', [Seccion3DestinosController::class, 'destinationUpdate']);
$router->post('/admin/seccion3/destinations/active', [Seccion3DestinosController::class, 'destinationSetActive']);
$router->post('/admin/seccion3/destinations/delete', [Seccion3DestinosController::class, 'destinationDelete']);
$router->post('/admin/seccion3/destinations/reorder', [Seccion3DestinosController::class, 'destinationReorder']);

// Seccion 4 servicios
$router->get('/seccion4/servicios', [Seccion4ServiciosController::class, 'publicData']);
$router->get('/admin/seccion4/servicios', [Seccion4ServiciosController::class, 'adminData']);
$router->post('/admin/seccion4/servicios/title', [Seccion4ServiciosController::class, 'updateTitle']);
$router->post('/admin/seccion4/servicios/upload-temp', [Seccion4ServiciosController::class, 'uploadTemp']);
$router->post('/admin/seccion4/servicios/items', [Seccion4ServiciosController::class, 'create']);
$router->post('/admin/seccion4/servicios/items/update', [Seccion4ServiciosController::class, 'update']);
$router->post('/admin/seccion4/servicios/items/active', [Seccion4ServiciosController::class, 'setActive']);
$router->post('/admin/seccion4/servicios/items/delete', [Seccion4ServiciosController::class, 'delete']);
$router->post('/admin/seccion4/servicios/items/reorder', [Seccion4ServiciosController::class, 'reorder']);

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $_SERVER['REQUEST_URI'] ?? '/');
