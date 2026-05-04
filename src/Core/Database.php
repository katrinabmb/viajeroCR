<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

final class Database
{
    private static ?PDO $connection = null;

    private static ?string $connectionName = null;

    public static function connection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $config = require dirname(__DIR__, 2) . '/config/app.php';
        $connections = $config['db_connections'] ?? [];
        $errors = [];

        foreach ($connections as $connectionConfig) {
            $host = (string) ($connectionConfig['host'] ?? '127.0.0.1');
            $port = (int) ($connectionConfig['port'] ?? 3306);
            $database = (string) ($connectionConfig['database'] ?? '');
            $username = (string) ($connectionConfig['username'] ?? '');
            $password = (string) ($connectionConfig['password'] ?? '');
            $charset = (string) ($connectionConfig['charset'] ?? 'utf8mb4');
            $name = (string) ($connectionConfig['name'] ?? 'default');

            if ($database === '' || $username === '') {
                continue;
            }

            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $host,
                $port,
                $database,
                $charset
            );

            try {
                self::$connection = new PDO($dsn, $username, $password, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
                self::$connectionName = $name;

                return self::$connection;
            } catch (PDOException $exception) {
                $errors[] = [
                    'connection' => $name,
                    'message' => $exception->getMessage(),
                ];
            }
        }

        Response::json([
            'success' => false,
            'message' => 'Database connection failed',
            'errors' => $errors,
        ], 500);
    }

    public static function connectionName(): ?string
    {
        return self::$connectionName;
    }
}
