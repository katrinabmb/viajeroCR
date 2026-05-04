<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/config/app.php';
require __DIR__ . '/src/Core/Database.php';
require __DIR__ . '/src/Core/Response.php';

use App\Core\Database;

try {
    $pdo = Database::connection();
    $stmt = $pdo->query('SELECT id_usuario, nombre, correo, estado FROM tbl_usuario LIMIT 1');
    $user = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'connection' => Database::connectionName(),
        'user' => $user,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
