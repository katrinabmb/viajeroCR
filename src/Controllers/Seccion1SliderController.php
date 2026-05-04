<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Upload;
use PDO;

final class Seccion1SliderController
{
    private string $tempDir;
    private string $finalDir;

    public function __construct()
    {
        $root = dirname(__DIR__, 2);
        $this->tempDir = $root . '/imagenes/temp';
        $this->finalDir = $root . '/imagenes/seccion1';
    }

    // Public: active slides ordered
    public function listPublic(): void
    {
        $db = Database::connection();
        $stmt = $db->query(
            'SELECT id_slider, title, subtitle, image_path, sort_order
             FROM tbl_seccion1_slider
             WHERE is_active = 1
             ORDER BY sort_order ASC, id_slider ASC'
        );

        Response::json([
            'success' => true,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    // Admin: all slides
    public function listAdmin(): void
    {
        Auth::requireUser();
        $db = Database::connection();
        $stmt = $db->query(
            'SELECT id_slider, title, subtitle, image_path, is_active, sort_order, created_at, updated_at
             FROM tbl_seccion1_slider
             ORDER BY sort_order ASC, id_slider ASC'
        );

        Response::json([
            'success' => true,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    // Admin: upload temp file (multipart: file)
    public function uploadTemp(): void
    {
        Auth::requireUser();
        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            Response::json([
                'success' => false,
                'message' => 'File is required.',
                'code' => 'FILE_REQUIRED',
            ], 422);
        }

        $file = $_FILES['file'];

        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::json([
                'success' => false,
                'message' => 'Upload failed.',
                'code' => 'UPLOAD_FAILED',
            ], 400);
        }

        $original = (string) ($file['name'] ?? 'image');
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));

        if (!Upload::isAllowedImageExtension($ext)) {
            Response::json([
                'success' => false,
                'message' => 'Invalid file type. Use jpg, png, webp.',
                'code' => 'INVALID_FILE_TYPE',
            ], 422);
        }

        Upload::ensureDir($this->tempDir);

        $key = Upload::randomKey('s1');
        $safeName = Upload::safeBasename(pathinfo($original, PATHINFO_FILENAME)) . '.' . $ext;
        $tempFile = $key . '_' . $safeName;
        $target = $this->tempDir . '/' . $tempFile;

        if (!move_uploaded_file((string) ($file['tmp_name'] ?? ''), $target)) {
            Response::json([
                'success' => false,
                'message' => 'Could not store uploaded file.',
                'code' => 'STORE_FAILED',
            ], 500);
        }

        Response::json([
            'success' => true,
            'temp_key' => $tempFile,
        ]);
    }

    // Admin: create slide (JSON: title, subtitle, sort_order, temp_key)
    public function create(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $title = trim((string) ($payload['title'] ?? ''));
        $subtitle = trim((string) ($payload['subtitle'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($title === '' || $subtitle === '' || $tempKey === '') {
            Response::json([
                'success' => false,
                'message' => 'title, subtitle y temp_key son requeridos.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if ($sortOrder < 0) {
            Response::json([
                'success' => false,
                'message' => 'El orden no puede ser negativo.',
                'code' => 'INVALID_SORT_ORDER',
            ], 422);
        }

        if ($this->sortOrderExists($sortOrder)) {
            Response::json([
                'success' => false,
                'message' => 'Ese orden ya esta en uso. Elige otro.',
                'code' => 'SORT_ORDER_TAKEN',
            ], 422);
        }

        $imagePath = $this->moveTempToFinal($tempKey);

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO tbl_seccion1_slider (title, subtitle, image_path, is_active, sort_order)
             VALUES (:title, :subtitle, :image_path, 1, :sort_order)'
        );
        $stmt->execute([
            'title' => $title,
            'subtitle' => $subtitle,
            'image_path' => $imagePath,
            'sort_order' => $sortOrder,
        ]);

        Response::json([
            'success' => true,
            'id' => (int) $db->lastInsertId(),
        ], 201);
    }

    // Admin: update slide (JSON: id, title, subtitle, sort_order, optional temp_key)
    public function update(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id'] ?? 0);
        $title = trim((string) ($payload['title'] ?? ''));
        $subtitle = trim((string) ($payload['subtitle'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($id <= 0 || $title === '' || $subtitle === '') {
            Response::json([
                'success' => false,
                'message' => 'id, title y subtitle son requeridos.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if ($sortOrder < 0) {
            Response::json([
                'success' => false,
                'message' => 'El orden no puede ser negativo.',
                'code' => 'INVALID_SORT_ORDER',
            ], 422);
        }

        $db = Database::connection();
        $existing = $this->findById($id);

        if ($existing === null) {
            Response::json([
                'success' => false,
                'message' => 'Item no encontrado.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $imagePath = $existing['image_path'];

        if ($this->sortOrderExists($sortOrder, $id)) {
            Response::json([
                'success' => false,
                'message' => 'Ese orden ya esta en uso. Elige otro.',
                'code' => 'SORT_ORDER_TAKEN',
            ], 422);
        }

        if ($tempKey !== '') {
            $imagePath = $this->moveTempToFinal($tempKey);
        }

        $stmt = $db->prepare(
            'UPDATE tbl_seccion1_slider
             SET title = :title,
                 subtitle = :subtitle,
                 sort_order = :sort_order,
                 image_path = :image_path,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_slider = :id'
        );
        $stmt->execute([
            'title' => $title,
            'subtitle' => $subtitle,
            'sort_order' => $sortOrder,
            'image_path' => $imagePath,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }

    // Admin: toggle active (JSON: id, is_active)
    public function setActive(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id'] ?? 0);
        $isActive = (int) ((bool) ($payload['is_active'] ?? false));

        if ($id <= 0) {
            Response::json([
                'success' => false,
                'message' => 'id es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE tbl_seccion1_slider
             SET is_active = :is_active,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_slider = :id'
        );
        $stmt->execute([
            'is_active' => $isActive,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }

    // Admin: delete slide and its image (JSON: id)
    public function delete(): void
    {
        Auth::requireUser();

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id'] ?? 0);

        if ($id <= 0) {
            Response::json([
                'success' => false,
                'message' => 'id es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $existing = $this->findById($id);

        if ($existing === null) {
            Response::json([
                'success' => false,
                'message' => 'Item no encontrado.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $db = Database::connection();
        $stmt = $db->prepare('DELETE FROM tbl_seccion1_slider WHERE id_slider = :id');
        $stmt->execute(['id' => $id]);

        $this->deleteFinalImageIfOwned((string) ($existing['image_path'] ?? ''));

        Response::json(['success' => true]);
    }

    private function moveTempToFinal(string $tempKey): string
    {
        $tempPath = $this->tempDir . '/' . basename($tempKey);

        if (!is_file($tempPath)) {
            Response::json([
                'success' => false,
                'message' => 'Temp file not found.',
                'code' => 'TEMP_NOT_FOUND',
            ], 404);
        }

        Upload::ensureDir($this->finalDir);

        $ext = strtolower(pathinfo($tempPath, PATHINFO_EXTENSION));
        $finalName = Upload::randomKey('seccion1') . '.' . ($ext === '' ? 'jpg' : $ext);
        $finalPath = $this->finalDir . '/' . $finalName;

        if (!rename($tempPath, $finalPath)) {
            Response::json([
                'success' => false,
                'message' => 'Could not move file.',
                'code' => 'MOVE_FAILED',
            ], 500);
        }

        // Public path that frontend can request via the API host
        return '/imagenes/seccion1/' . $finalName;
    }

    private function deleteFinalImageIfOwned(string $imagePath): void
    {
        $imagePath = trim($imagePath);

        if ($imagePath === '' || !str_starts_with($imagePath, '/imagenes/seccion1/')) {
            return;
        }

        $fileName = basename($imagePath);

        if ($fileName === '' || $fileName === '.' || $fileName === '..') {
            return;
        }

        $fullPath = $this->finalDir . '/' . $fileName;

        if (is_file($fullPath)) {
            @unlink($fullPath);
        }
    }

    private function findById(int $id): ?array
    {
        $db = Database::connection();
        $stmt = $db->prepare('SELECT * FROM tbl_seccion1_slider WHERE id_slider = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    private function sortOrderExists(int $sortOrder, ?int $excludeId = null): bool
    {
        $db = Database::connection();

        if ($excludeId !== null) {
            $stmt = $db->prepare(
                'SELECT 1 FROM tbl_seccion1_slider WHERE sort_order = :sort_order AND id_slider <> :id LIMIT 1'
            );
            $stmt->execute([
                'sort_order' => $sortOrder,
                'id' => $excludeId,
            ]);
        } else {
            $stmt = $db->prepare('SELECT 1 FROM tbl_seccion1_slider WHERE sort_order = :sort_order LIMIT 1');
            $stmt->execute([
                'sort_order' => $sortOrder,
            ]);
        }

        return (bool) $stmt->fetchColumn();
    }
}
