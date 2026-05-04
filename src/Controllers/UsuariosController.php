<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use PDO;

final class UsuariosController
{
    public function permisos(): void
    {
        Auth::requireUser();
        $db = Database::connection();

        $stmt = $db->query(
            'SELECT id_permiso, nombre, codigo
             FROM tbl_permiso
             WHERE is_active = 1
             ORDER BY nombre ASC'
        );

        Response::json([
            'success' => true,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    public function list(): void
    {
        $authUser = Auth::requireUser();
        $this->requireAdmin($authUser);

        $db = Database::connection();
        $hasPermiso = $this->hasColumn($db, 'tbl_usuario', 'id_permiso');
        $permisoJoin = $hasPermiso ? 'LEFT JOIN tbl_permiso p ON p.id_permiso = u.id_permiso' : '';
        $permisoFields = $hasPermiso
            ? 'u.id_permiso, p.nombre AS permiso_nombre, p.codigo AS permiso_codigo,'
            : 'NULL AS id_permiso, NULL AS permiso_nombre, NULL AS permiso_codigo,';

        $stmt = $db->query(
            "SELECT
                u.id_usuario,
                u.nombre,
                u.correo,
                $permisoFields
                u.estado,
                u.ultimo_login_at,
                u.created_at,
                u.updated_at
             FROM tbl_usuario u
             $permisoJoin
             ORDER BY u.created_at DESC, u.id_usuario DESC"
        );

        Response::json([
            'success' => true,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    public function create(): void
    {
        $authUser = Auth::requireUser();
        $this->requireAdmin($authUser);

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $nombre = trim((string) ($payload['nombre'] ?? ''));
        $correo = trim((string) ($payload['correo'] ?? ''));
        $password = trim((string) ($payload['password'] ?? ''));
        $idPermiso = (int) ($payload['id_permiso'] ?? 0);

        if ($nombre === '' || $correo === '' || $password === '') {
            Response::json([
                'success' => false,
                'message' => 'Nombre, correo y clave son obligatorios.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            Response::json([
                'success' => false,
                'message' => 'Correo invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }
        if (strlen($password) < 8) {
            Response::json([
                'success' => false,
                'message' => 'La clave debe tener al menos 8 caracteres.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $hasPermiso = $this->hasColumn($db, 'tbl_usuario', 'id_permiso');

        $exists = $db->prepare('SELECT id_usuario FROM tbl_usuario WHERE LOWER(correo) = LOWER(:correo) LIMIT 1');
        $exists->execute(['correo' => $correo]);
        if ($exists->fetchColumn()) {
            Response::json([
                'success' => false,
                'message' => 'Ese correo ya existe.',
                'code' => 'DUPLICATE_EMAIL',
            ], 409);
        }

        if ($hasPermiso) {
            $idPermiso = $this->resolvePermisoId($db, $idPermiso);
            if ($idPermiso < 1) {
                Response::json([
                    'success' => false,
                    'message' => 'Permiso invalido.',
                    'code' => 'VALIDATION_ERROR',
                ], 422);
            }
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $sql = $hasPermiso
            ? 'INSERT INTO tbl_usuario (nombre, correo, password_hash, id_permiso, estado)
               VALUES (:nombre, :correo, :password_hash, :id_permiso, :estado)'
            : 'INSERT INTO tbl_usuario (nombre, correo, password_hash, estado)
               VALUES (:nombre, :correo, :password_hash, :estado)';
        $stmt = $db->prepare($sql);
        $params = [
            'nombre' => $nombre,
            'correo' => strtolower($correo),
            'password_hash' => $hash,
            'estado' => 'activo',
        ];
        if ($hasPermiso) {
            $params['id_permiso'] = $idPermiso;
        }
        $stmt->execute($params);

        Response::json(['success' => true]);
    }

    public function update(): void
    {
        $authUser = Auth::requireUser();
        $this->requireAdmin($authUser);

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_usuario'] ?? 0);
        $nombre = trim((string) ($payload['nombre'] ?? ''));
        $correo = trim((string) ($payload['correo'] ?? ''));
        $idPermiso = (int) ($payload['id_permiso'] ?? 0);

        if ($id < 1 || $nombre === '' || $correo === '') {
            Response::json([
                'success' => false,
                'message' => 'Datos invalidos.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            Response::json([
                'success' => false,
                'message' => 'Correo invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $hasPermiso = $this->hasColumn($db, 'tbl_usuario', 'id_permiso');
        if ($hasPermiso) {
            $idPermiso = $this->resolvePermisoId($db, $idPermiso);
            if ($idPermiso < 1) {
                Response::json([
                    'success' => false,
                    'message' => 'Permiso invalido.',
                    'code' => 'VALIDATION_ERROR',
                ], 422);
            }
        }

        $exists = $db->prepare(
            'SELECT id_usuario FROM tbl_usuario
             WHERE LOWER(correo) = LOWER(:correo) AND id_usuario <> :id
             LIMIT 1'
        );
        $exists->execute([
            'correo' => $correo,
            'id' => $id,
        ]);
        if ($exists->fetchColumn()) {
            Response::json([
                'success' => false,
                'message' => 'Ese correo ya existe.',
                'code' => 'DUPLICATE_EMAIL',
            ], 409);
        }

        $sql = $hasPermiso
            ? 'UPDATE tbl_usuario
               SET nombre = :nombre, correo = :correo, id_permiso = :id_permiso, updated_at = CURRENT_TIMESTAMP
               WHERE id_usuario = :id'
            : 'UPDATE tbl_usuario
               SET nombre = :nombre, correo = :correo, updated_at = CURRENT_TIMESTAMP
               WHERE id_usuario = :id';
        $stmt = $db->prepare($sql);
        $params = [
            'nombre' => $nombre,
            'correo' => strtolower($correo),
            'id' => $id,
        ];
        if ($hasPermiso) {
            $params['id_permiso'] = $idPermiso;
        }
        $stmt->execute($params);

        Response::json(['success' => true]);
    }

    public function setActive(): void
    {
        $authUser = Auth::requireUser();
        $this->requireAdmin($authUser);

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_usuario'] ?? 0);
        $isActive = (int) ($payload['is_active'] ?? 0) ? 1 : 0;
        $estado = $isActive ? 'activo' : 'inactivo';

        if ($id < 1) {
            Response::json([
                'success' => false,
                'message' => 'id_usuario es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if ((int) ($authUser['id_usuario'] ?? 0) === $id && $estado !== 'activo') {
            Response::json([
                'success' => false,
                'message' => 'No puedes inactivar tu propio usuario.',
                'code' => 'SELF_ACTION_NOT_ALLOWED',
            ], 409);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE tbl_usuario
             SET estado = :estado, updated_at = CURRENT_TIMESTAMP
             WHERE id_usuario = :id'
        );
        $stmt->execute([
            'estado' => $estado,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }

    public function changePassword(): void
    {
        $authUser = Auth::requireUser();
        $this->requireAdmin($authUser);

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_usuario'] ?? 0);
        $password = trim((string) ($payload['password'] ?? ''));

        if ($id < 1 || $password === '') {
            Response::json([
                'success' => false,
                'message' => 'Datos invalidos.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }
        if (strlen($password) < 8) {
            Response::json([
                'success' => false,
                'message' => 'La clave debe tener al menos 8 caracteres.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $hash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $db->prepare(
            'UPDATE tbl_usuario
             SET password_hash = :password_hash,
                 intentos_fallidos = 0,
                 bloqueo_hasta = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_usuario = :id'
        );
        $stmt->execute([
            'password_hash' => $hash,
            'id' => $id,
        ]);

        // Revocar refresh tokens para forzar nuevo login con la clave actualizada.
        $revoke = $db->prepare(
            'UPDATE tbl_usuario_refresh_token
             SET revoked_at = COALESCE(revoked_at, NOW()),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_usuario = :id_usuario
               AND revoked_at IS NULL'
        );
        $revoke->execute(['id_usuario' => $id]);

        Response::json(['success' => true]);
    }

    private function requireAdmin(array $user): void
    {
        $db = Database::connection();
        if (!$this->hasColumn($db, 'tbl_usuario', 'id_permiso')) {
            return;
        }

        $stmt = $db->prepare(
            'SELECT p.codigo
             FROM tbl_usuario u
             LEFT JOIN tbl_permiso p ON p.id_permiso = u.id_permiso
             WHERE u.id_usuario = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => (int) ($user['id_usuario'] ?? 0)]);
        $codigo = (string) ($stmt->fetchColumn() ?: '');

        if ($codigo !== 'admin') {
            Response::json([
                'success' => false,
                'message' => 'No tienes permisos para gestionar usuarios.',
                'code' => 'FORBIDDEN',
            ], 403);
        }
    }

    private function resolvePermisoId(PDO $db, int $idPermiso): int
    {
        if ($idPermiso < 1) {
            return 0;
        }
        $stmt = $db->prepare(
            'SELECT id_permiso
             FROM tbl_permiso
             WHERE id_permiso = :id_permiso
               AND is_active = 1
             LIMIT 1'
        );
        $stmt->execute(['id_permiso' => $idPermiso]);
        $id = (int) ($stmt->fetchColumn() ?: 0);
        return $id > 0 ? $id : 0;
    }

    private function hasColumn(PDO $db, string $table, string $column): bool
    {
        $safeTable = str_replace('`', '``', $table);
        $safeColumn = str_replace(['\\', "'"], ['\\\\', "\\'"], $column);
        $sql = "SHOW COLUMNS FROM `{$safeTable}` LIKE '{$safeColumn}'";
        $stmt = $db->query($sql);
        return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

