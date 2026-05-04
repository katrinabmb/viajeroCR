<?php

declare(strict_types=1);

namespace App\Core;

use PDO;

final class Auth
{
    public static function requireUser(): array
    {
        $config = require dirname(__DIR__, 2) . '/config/app.php';
        $tokenService = new AuthTokenService($config);

        $cookieName = (string) ($config['auth']['access_cookie'] ?? 'viajero_access');
        $accessToken = isset($_COOKIE[$cookieName]) && is_string($_COOKIE[$cookieName]) ? $_COOKIE[$cookieName] : null;
        $payload = $tokenService->parseAccessToken($accessToken);

        if ($payload === null) {
            Response::json([
                'success' => false,
                'message' => 'Unauthenticated',
                'code' => 'UNAUTHENTICATED',
            ], 401);
        }

        $userId = (int) ($payload['sub'] ?? 0);

        if ($userId <= 0) {
            Response::json([
                'success' => false,
                'message' => 'Unauthenticated',
                'code' => 'UNAUTHENTICATED',
            ], 401);
        }

        $db = Database::connection();
        $stmt = $db->prepare('SELECT * FROM tbl_usuario WHERE id_usuario = :id AND estado = :estado LIMIT 1');
        $stmt->execute([
            'id' => $userId,
            'estado' => 'activo',
        ]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($user)) {
            Response::json([
                'success' => false,
                'message' => 'Unauthenticated',
                'code' => 'UNAUTHENTICATED',
            ], 401);
        }

        return $user;
    }
}

