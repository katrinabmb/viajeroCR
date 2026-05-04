<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use DateInterval;
use DateTimeImmutable;
use PDO;

final class AuthController
{
    public function me(): void
    {
        $userId = (int) ($_SESSION['user_id'] ?? 0);

        if ($userId <= 0) {
            Response::json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $user = $this->findUserById($userId);

        if ($user === null || $user['estado'] !== 'activo') {
            $_SESSION = [];

            Response::json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        Response::json([
            'success' => true,
            'user' => $this->mapSessionUser($user),
        ]);
    }

    public function login(): void
    {
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $email = trim((string) ($payload['email'] ?? ''));
        $password = trim((string) ($payload['password'] ?? ''));

        if ($email === '' || $password === '') {
            Response::json([
                'success' => false,
                'message' => 'Email and password are required',
            ], 422);
        }

        $user = $this->findUserByEmail($email);

        if ($user === null) {
            Response::json([
                'success' => false,
                'message' => 'Credenciales invalidas',
            ], 401);
        }

        if ($this->isBlocked($user)) {
            Response::json([
                'success' => false,
                'message' => 'Usuario bloqueado temporalmente. Intenta mas tarde.',
            ], 423);
        }

        if ($user['estado'] !== 'activo') {
            Response::json([
                'success' => false,
                'message' => 'Usuario inactivo o bloqueado',
            ], 403);
        }

        if (!password_verify($password, (string) $user['password_hash'])) {
            $this->registerFailedAttempt((int) $user['id_usuario'], (int) $user['intentos_fallidos']);

            Response::json([
                'success' => false,
                'message' => 'Credenciales invalidas',
            ], 401);
        }

        $this->clearFailedAttempts((int) $user['id_usuario']);

        $freshUser = $this->findUserById((int) $user['id_usuario']);

        if ($freshUser === null) {
            Response::json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $freshUser['id_usuario'];

        Response::json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $this->mapSessionUser($freshUser),
        ]);
    }

    public function logout(): void
    {
        $_SESSION = [];

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 3600, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
        }

        Response::json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    private function findUserByEmail(string $email): ?array
    {
        $connection = Database::connection();
        $statement = $connection->prepare('SELECT * FROM tbl_usuario WHERE correo = :correo LIMIT 1');
        $statement->execute([
            'correo' => $email,
        ]);

        $user = $statement->fetch(PDO::FETCH_ASSOC);

        return is_array($user) ? $user : null;
    }

    private function findUserById(int $userId): ?array
    {
        $connection = Database::connection();
        $statement = $connection->prepare('SELECT * FROM tbl_usuario WHERE id_usuario = :id_usuario LIMIT 1');
        $statement->execute([
            'id_usuario' => $userId,
        ]);

        $user = $statement->fetch(PDO::FETCH_ASSOC);

        return is_array($user) ? $user : null;
    }

    private function isBlocked(array $user): bool
    {
        $blockedUntil = $user['bloqueo_hasta'] ?? null;

        if (!is_string($blockedUntil) || $blockedUntil === '') {
            return false;
        }

        return strtotime($blockedUntil) > time();
    }

    private function registerFailedAttempt(int $userId, int $currentAttempts): void
    {
        $nextAttempts = $currentAttempts + 1;
        $blockedUntil = null;

        if ($nextAttempts >= 5) {
            $blockedUntil = (new DateTimeImmutable())
                ->add(new DateInterval('PT15M'))
                ->format('Y-m-d H:i:s');
            $nextAttempts = 0;
        }

        $connection = Database::connection();
        $statement = $connection->prepare(
            'UPDATE tbl_usuario
             SET intentos_fallidos = :intentos_fallidos,
                 bloqueo_hasta = :bloqueo_hasta,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_usuario = :id_usuario'
        );
        $statement->execute([
            'intentos_fallidos' => $nextAttempts,
            'bloqueo_hasta' => $blockedUntil,
            'id_usuario' => $userId,
        ]);
    }

    private function clearFailedAttempts(int $userId): void
    {
        $connection = Database::connection();
        $statement = $connection->prepare(
            'UPDATE tbl_usuario
             SET intentos_fallidos = 0,
                 bloqueo_hasta = NULL,
                 ultimo_login_at = NOW(),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_usuario = :id_usuario'
        );
        $statement->execute([
            'id_usuario' => $userId,
        ]);
    }

    private function mapSessionUser(array $user): array
    {
        return [
            'id' => (int) $user['id_usuario'],
            'name' => (string) $user['nombre'],
            'email' => (string) $user['correo'],
            'status' => (string) $user['estado'],
        ];
    }
}
