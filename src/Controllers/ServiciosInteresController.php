<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use PDO;

final class ServiciosInteresController
{
    public function publicData(): void
    {
        $db = Database::connection();
        $stmt = $db->query(
            'SELECT id_servicio_interes, nombre
             FROM tbl_servicio_interes
             WHERE is_active = 1
             ORDER BY nombre ASC'
        );

        Response::json([
            'success' => true,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    public function adminData(): void
    {
        Auth::requireUser();
        $db = Database::connection();
        $stmt = $db->query(
            'SELECT id_servicio_interes, nombre, is_active, created_at, updated_at
             FROM tbl_servicio_interes
             ORDER BY created_at DESC, id_servicio_interes DESC'
        );

        Response::json([
            'success' => true,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    public function create(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $nombre = trim((string) ($payload['nombre'] ?? ''));

        if ($nombre === '') {
            Response::json([
                'success' => false,
                'message' => 'El nombre es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $exists = $db->prepare('SELECT id_servicio_interes FROM tbl_servicio_interes WHERE LOWER(nombre) = LOWER(:nombre) LIMIT 1');
        $exists->execute(['nombre' => $nombre]);
        if ($exists->fetchColumn()) {
            Response::json([
                'success' => false,
                'message' => 'Ese servicio ya existe.',
                'code' => 'DUPLICATE_NAME',
            ], 409);
        }

        $stmt = $db->prepare(
            'INSERT INTO tbl_servicio_interes (nombre, is_active)
             VALUES (:nombre, 1)'
        );
        $stmt->execute(['nombre' => $nombre]);

        Response::json(['success' => true]);
    }

    public function update(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_servicio_interes'] ?? 0);
        $nombre = trim((string) ($payload['nombre'] ?? ''));

        if ($id < 1 || $nombre === '') {
            Response::json([
                'success' => false,
                'message' => 'Datos invalidos.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $exists = $db->prepare(
            'SELECT id_servicio_interes
             FROM tbl_servicio_interes
             WHERE LOWER(nombre) = LOWER(:nombre)
               AND id_servicio_interes <> :id
             LIMIT 1'
        );
        $exists->execute([
            'nombre' => $nombre,
            'id' => $id,
        ]);
        if ($exists->fetchColumn()) {
            Response::json([
                'success' => false,
                'message' => 'Ese servicio ya existe.',
                'code' => 'DUPLICATE_NAME',
            ], 409);
        }

        $stmt = $db->prepare(
            'UPDATE tbl_servicio_interes
             SET nombre = :nombre, updated_at = CURRENT_TIMESTAMP
             WHERE id_servicio_interes = :id'
        );
        $stmt->execute([
            'nombre' => $nombre,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }

    public function setActive(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_servicio_interes'] ?? 0);
        $isActive = (int) ($payload['is_active'] ?? 0) ? 1 : 0;

        if ($id < 1) {
            Response::json([
                'success' => false,
                'message' => 'id_servicio_interes es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE tbl_servicio_interes
             SET is_active = :is_active, updated_at = CURRENT_TIMESTAMP
             WHERE id_servicio_interes = :id'
        );
        $stmt->execute([
            'is_active' => $isActive,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }
}

