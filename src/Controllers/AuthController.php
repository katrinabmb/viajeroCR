<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\AuthTokenService;
use App\Core\Database;
use App\Core\Response;
use DateInterval;
use DateTimeImmutable;
use PDO;

final class AuthController
{
    private array $config;

    private AuthTokenService $tokenService;

    private bool $isHttps;

    public function __construct()
    {
        $this->config = require dirname(__DIR__, 2) . '/config/app.php';
        $this->tokenService = new AuthTokenService($this->config);
        $this->isHttps = (
            (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443
        );
    }

    public function me(): void
    {
        $user = $this->resolveAuthenticatedUser();

        if ($user === null) {
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
                'message' => 'Debes completar correo y contrasena.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $user = $this->findUserByEmail($email);

        if ($user === null) {
            Response::json([
                'success' => false,
                'message' => 'Correo o contrasena incorrectos.',
                'code' => 'INVALID_CREDENTIALS',
            ], 401);
        }

        if ($this->isBlocked($user)) {
            Response::json([
                'success' => false,
                'message' => 'Tu acceso esta bloqueado temporalmente por varios intentos fallidos.',
                'code' => 'ACCOUNT_TEMPORARILY_LOCKED',
            ], 423);
        }

        if ($user['estado'] !== 'activo') {
            Response::json([
                'success' => false,
                'message' => 'Tu usuario no esta disponible para iniciar sesion.',
                'code' => 'ACCOUNT_UNAVAILABLE',
            ], 403);
        }

        if (!password_verify($password, (string) $user['password_hash'])) {
            $this->registerFailedAttempt((int) $user['id_usuario'], (int) $user['intentos_fallidos']);

            Response::json([
                'success' => false,
                'message' => 'Correo o contrasena incorrectos.',
                'code' => 'INVALID_CREDENTIALS',
            ], 401);
        }

        $this->clearFailedAttempts((int) $user['id_usuario']);
        $freshUser = $this->findUserById((int) $user['id_usuario']);

        if ($freshUser === null) {
            Response::json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
                'code' => 'USER_NOT_FOUND',
            ], 404);
        }

        $this->issueAuthCookies((int) $freshUser['id_usuario']);

        Response::json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $this->mapSessionUser($freshUser),
        ]);
    }

    public function refresh(): void
    {
        $refreshToken = $this->getRefreshCookie();

        if ($refreshToken === null) {
            $this->clearAuthCookies();
            Response::json([
                'success' => false,
                'message' => 'Refresh token missing.',
                'code' => 'REFRESH_TOKEN_MISSING',
            ], 401);
        }

        $refreshTokenHash = $this->tokenService->hashRefreshToken($refreshToken);
        $refreshRecord = $this->findRefreshTokenRecordByHash($refreshTokenHash);

        if ($refreshRecord === null) {
            $this->clearAuthCookies();
            Response::json([
                'success' => false,
                'message' => 'Refresh token invalid.',
                'code' => 'REFRESH_TOKEN_INVALID',
            ], 401);
        }

        $userId = (int) $refreshRecord['id_usuario'];

        if ($refreshRecord['revoked_at'] !== null) {
            $this->revokeAllRefreshTokensForUser($userId);
            $this->clearAuthCookies();
            Response::json([
                'success' => false,
                'message' => 'Refresh token reuse detected.',
                'code' => 'REFRESH_TOKEN_REUSED',
            ], 401);
        }

        if ($this->isRefreshRecordExpired($refreshRecord)) {
            $this->revokeRefreshTokenRecord((int) $refreshRecord['id_refresh_token']);
            $this->clearAuthCookies();
            Response::json([
                'success' => false,
                'message' => 'Refresh token expired.',
                'code' => 'REFRESH_TOKEN_EXPIRED',
            ], 401);
        }

        $user = $this->findUserById($userId);

        if ($user === null || $user['estado'] !== 'activo') {
            $this->revokeAllRefreshTokensForUser($userId);
            $this->clearAuthCookies();
            Response::json([
                'success' => false,
                'message' => 'Usuario no disponible.',
                'code' => 'USER_UNAVAILABLE',
            ], 403);
        }

        $this->rotateRefreshToken((int) $refreshRecord['id_refresh_token'], $userId);
        $this->setAccessCookie($this->tokenService->createAccessToken($userId));

        Response::json([
            'success' => true,
            'message' => 'Session refreshed',
            'user' => $this->mapSessionUser($user),
        ]);
    }

    public function logout(): void
    {
        $refreshToken = $this->getRefreshCookie();

        if ($refreshToken !== null) {
            $refreshRecord = $this->findRefreshTokenRecordByHash(
                $this->tokenService->hashRefreshToken($refreshToken)
            );

            if ($refreshRecord !== null) {
                $this->revokeRefreshTokenRecord((int) $refreshRecord['id_refresh_token']);
            }
        }

        $this->clearAuthCookies();

        Response::json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    private function resolveAuthenticatedUser(): ?array
    {
        $accessToken = $this->getAccessCookie();
        $payload = $this->tokenService->parseAccessToken($accessToken);

        if ($payload === null) {
            return null;
        }

        $userId = (int) ($payload['sub'] ?? 0);

        if ($userId <= 0) {
            return null;
        }

        $user = $this->findUserById($userId);

        if ($user === null || $user['estado'] !== 'activo') {
            return null;
        }

        return $user;
    }

    private function issueAuthCookies(int $userId): void
    {
        $this->revokeAllRefreshTokensForUser($userId);
        $this->setAccessCookie($this->tokenService->createAccessToken($userId));
        $this->setRefreshCookieForUser($userId);
    }

    private function rotateRefreshToken(int $refreshTokenId, int $userId): void
    {
        $this->markRefreshTokenAsUsed($refreshTokenId);
        $this->setRefreshCookieForUser($userId);
    }

    private function setRefreshCookieForUser(int $userId): void
    {
        $refreshToken = $this->tokenService->createRefreshToken();
        $refreshTokenHash = $this->tokenService->hashRefreshToken($refreshToken);
        $ttl = (int) ($this->config['auth']['refresh_token_ttl'] ?? 2592000);
        $expiresAt = (new DateTimeImmutable())
            ->add(new DateInterval(sprintf('PT%dS', $ttl)))
            ->format('Y-m-d H:i:s');

        $connection = Database::connection();
        $statement = $connection->prepare(
            'INSERT INTO tbl_usuario_refresh_token (
                id_usuario,
                token_hash,
                expires_at,
                created_at,
                updated_at
            ) VALUES (
                :id_usuario,
                :token_hash,
                :expires_at,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )'
        );
        $statement->execute([
            'id_usuario' => $userId,
            'token_hash' => $refreshTokenHash,
            'expires_at' => $expiresAt,
        ]);

        $this->setCookie(
            (string) $this->config['auth']['refresh_cookie'],
            $refreshToken,
            time() + $ttl
        );
    }

    private function setAccessCookie(string $accessToken): void
    {
        $ttl = (int) ($this->config['auth']['access_token_ttl'] ?? 900);

        $this->setCookie(
            (string) $this->config['auth']['access_cookie'],
            $accessToken,
            time() + $ttl
        );
    }

    private function clearAuthCookies(): void
    {
        $this->clearCookie((string) $this->config['auth']['access_cookie']);
        $this->clearCookie((string) $this->config['auth']['refresh_cookie']);
    }

    private function setCookie(string $name, string $value, int $expiresAt): void
    {
        setcookie($name, $value, [
            'expires' => $expiresAt,
            'path' => '/',
            'domain' => '',
            'secure' => $this->isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    private function clearCookie(string $name): void
    {
        setcookie($name, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => $this->isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    private function getAccessCookie(): ?string
    {
        $cookieName = (string) ($this->config['auth']['access_cookie'] ?? 'viajero_access');

        return isset($_COOKIE[$cookieName]) && is_string($_COOKIE[$cookieName])
            ? $_COOKIE[$cookieName]
            : null;
    }

    private function getRefreshCookie(): ?string
    {
        $cookieName = (string) ($this->config['auth']['refresh_cookie'] ?? 'viajero_refresh');

        return isset($_COOKIE[$cookieName]) && is_string($_COOKIE[$cookieName])
            ? $_COOKIE[$cookieName]
            : null;
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

    private function findRefreshTokenRecordByHash(string $tokenHash): ?array
    {
        $connection = Database::connection();
        $statement = $connection->prepare(
            'SELECT * FROM tbl_usuario_refresh_token WHERE token_hash = :token_hash LIMIT 1'
        );
        $statement->execute([
            'token_hash' => $tokenHash,
        ]);

        $record = $statement->fetch(PDO::FETCH_ASSOC);

        return is_array($record) ? $record : null;
    }

    private function isRefreshRecordExpired(array $refreshRecord): bool
    {
        $expiresAt = $refreshRecord['expires_at'] ?? null;

        if (!is_string($expiresAt) || $expiresAt === '') {
            return true;
        }

        return strtotime($expiresAt) <= time();
    }

    private function revokeRefreshTokenRecord(int $refreshTokenId): void
    {
        $connection = Database::connection();
        $statement = $connection->prepare(
            'UPDATE tbl_usuario_refresh_token
             SET revoked_at = COALESCE(revoked_at, NOW()),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_refresh_token = :id_refresh_token'
        );
        $statement->execute([
            'id_refresh_token' => $refreshTokenId,
        ]);
    }

    private function markRefreshTokenAsUsed(int $refreshTokenId): void
    {
        $connection = Database::connection();
        $statement = $connection->prepare(
            'UPDATE tbl_usuario_refresh_token
             SET revoked_at = NOW(),
                 last_used_at = NOW(),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_refresh_token = :id_refresh_token'
        );
        $statement->execute([
            'id_refresh_token' => $refreshTokenId,
        ]);
    }

    private function revokeAllRefreshTokensForUser(int $userId): void
    {
        $connection = Database::connection();
        $statement = $connection->prepare(
            'UPDATE tbl_usuario_refresh_token
             SET revoked_at = COALESCE(revoked_at, NOW()),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_usuario = :id_usuario
               AND revoked_at IS NULL'
        );
        $statement->execute([
            'id_usuario' => $userId,
        ]);
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
