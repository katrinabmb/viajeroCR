<?php

declare(strict_types=1);

namespace App\Core;

final class AuthTokenService
{
    private string $appKey;

    public function __construct(private readonly array $config)
    {
        $this->appKey = (string) ($config['app_key'] ?? '');
    }

    public function createAccessToken(int $userId): string
    {
        $ttl = (int) ($this->config['auth']['access_token_ttl'] ?? 900);
        $now = time();

        $payload = [
            'sub' => $userId,
            'type' => 'access',
            'iat' => $now,
            'exp' => $now + $ttl,
        ];

        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));
        $signature = $this->sign($encodedPayload);

        return $encodedPayload . '.' . $signature;
    }

    public function parseAccessToken(?string $token): ?array
    {
        if (!is_string($token) || $token === '' || !str_contains($token, '.')) {
            return null;
        }

        [$encodedPayload, $providedSignature] = explode('.', $token, 2);
        $expectedSignature = $this->sign($encodedPayload);

        if (!hash_equals($expectedSignature, $providedSignature)) {
            return null;
        }

        $decodedPayload = $this->base64UrlDecode($encodedPayload);

        if ($decodedPayload === null) {
            return null;
        }

        $payload = json_decode($decodedPayload, true);

        if (!is_array($payload)) {
            return null;
        }

        if (($payload['type'] ?? null) !== 'access') {
            return null;
        }

        if ((int) ($payload['exp'] ?? 0) < time()) {
            return null;
        }

        return $payload;
    }

    public function createRefreshToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(64)), '+/', '-_'), '=');
    }

    public function hashRefreshToken(string $refreshToken): string
    {
        return hash_hmac('sha256', $refreshToken, $this->appKey);
    }

    private function sign(string $encodedPayload): string
    {
        return $this->base64UrlEncode(hash_hmac('sha256', $encodedPayload, $this->appKey, true));
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): ?string
    {
        $padding = strlen($value) % 4;

        if ($padding > 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        return $decoded === false ? null : $decoded;
    }
}
