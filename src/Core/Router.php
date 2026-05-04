<?php

declare(strict_types=1);

namespace App\Core;

final class Router
{
    /**
     * @var array<string, array<string, callable|array{0: class-string, 1: string}>>
     */
    private array $routes = [];

    public function get(string $path, callable|array $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function dispatch(string $method, string $uri): void
    {
        $path = $this->normalizePath($uri);
        $handler = $this->routes[$method][$path] ?? null;

        if ($handler === null) {
            Response::json([
                'success' => false,
                'message' => 'Route not found',
                'path' => $path,
            ], 404);
        }

        try {
            if (is_array($handler) && count($handler) === 2) {
                [$class, $action] = $handler;
                $controller = new $class();
                $controller->{$action}();
                return;
            }

            $handler();
        } catch (\Throwable $e) {
            // In production we still want a JSON response (not a blank 500 page).
            error_log(sprintf(
                '[API_ERROR] %s %s | %s: %s in %s:%d',
                $method,
                $path,
                get_class($e),
                $e->getMessage(),
                $e->getFile(),
                $e->getLine()
            ));

            Response::json([
                'success' => false,
                'message' => 'Error interno del servidor.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    private function addRoute(string $method, string $path, callable|array $handler): void
    {
        $this->routes[$method][$this->formatPath($path)] = $handler;
    }

    private function normalizePath(string $uri): string
    {
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $basePath = str_replace('\\', '/', dirname($scriptName));

        if ($basePath !== '/' && str_starts_with($path, $basePath)) {
            $path = substr($path, strlen($basePath));
        }

        return $this->formatPath($path);
    }

    private function formatPath(string $path): string
    {
        $trimmed = trim($path, '/');

        return $trimmed === '' ? '/' : '/' . $trimmed;
    }
}
