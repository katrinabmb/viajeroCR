<?php

declare(strict_types=1);

namespace App\Core;

final class Upload
{
    public static function ensureDir(string $dir): void
    {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    public static function safeBasename(string $name): string
    {
        $name = basename($name);
        $name = preg_replace('/[^A-Za-z0-9._-]/', '_', $name) ?? 'file';
        $name = trim($name, '._-');

        return $name === '' ? 'file' : $name;
    }

    public static function randomKey(string $prefix): string
    {
        $bytes = random_bytes(16);
        return $prefix . '_' . bin2hex($bytes);
    }

    public static function isAllowedImageExtension(string $ext): bool
    {
        $ext = strtolower($ext);
        return in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'], true);
    }

    public static function isAllowedLogoExtension(string $ext): bool
    {
        $ext = strtolower($ext);
        return in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'], true);
    }
}
