<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Response;

final class HealthController
{
    public function index(): void
    {
        Response::json([
            'success' => true,
            'message' => 'API running correctly',
            'service' => 'Viajero API',
        ]);
    }
}
