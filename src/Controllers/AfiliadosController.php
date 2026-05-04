<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Upload;
use DateInterval;
use DateTimeImmutable;
use PDO;

final class AfiliadosController
{
    private string $tempDir;
    private string $finalDir;

    public function __construct()
    {
        $root = dirname(__DIR__, 2);
        $this->tempDir = $root . '/imagenes/temp';
        $this->finalDir = $root . '/imagenes/afiliados';
    }

    // Public: title + active logos
    public function publicData(): void
    {
        $db = Database::connection();

        $title = $this->getTitle($db);
        $stmt = $db->query(
            'SELECT id_logo, image_path, url, sort_order
             FROM tbl_afiliados_logo
             WHERE is_active = 1
             ORDER BY sort_order ASC, id_logo ASC'
        );

        Response::json([
            'success' => true,
            'title' => $title,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    // Admin: title + all logos
    public function adminData(): void
    {
        Auth::requireUser();
        $db = Database::connection();

        $title = $this->getTitle($db);
        $stmt = $db->query(
            'SELECT id_logo, image_path, url, is_active, sort_order, created_at, updated_at
             FROM tbl_afiliados_logo
             ORDER BY sort_order ASC, id_logo ASC'
        );

        Response::json([
            'success' => true,
            'title' => $title,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    // Admin: update title (JSON: title)
    public function updateTitle(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $title = trim((string) ($payload['title'] ?? ''));

        if ($title === '') {
            Response::json([
                'success' => false,
                'message' => 'title es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO tbl_afiliados_config (id_config, title)
             VALUES (1, :title)
             ON DUPLICATE KEY UPDATE title = VALUES(title), updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute(['title' => $title]);

        Response::json(['success' => true]);
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

        $key = Upload::randomKey('aff');
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

    // Admin: create logo (JSON: url, sort_order, temp_key)
    public function create(): void
    {
        Auth::requireUser();

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $url = trim((string) ($payload['url'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($url === '' || $tempKey === '') {
            Response::json([
                'success' => false,
                'message' => 'url y temp_key son requeridos.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if ($sortOrder < 1) {
            Response::json([
                'success' => false,
                'message' => 'El orden debe ser 1 o mayor.',
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
            'INSERT INTO tbl_afiliados_logo (image_path, url, is_active, sort_order)
             VALUES (:image_path, :url, 1, :sort_order)'
        );
        $stmt->execute([
            'image_path' => $imagePath,
            'url' => $url,
            'sort_order' => $sortOrder,
        ]);

        Response::json([
            'success' => true,
            'id' => (int) $db->lastInsertId(),
        ], 201);
    }

    // Admin: update logo (JSON: id, url, sort_order, optional temp_key)
    public function update(): void
    {
        Auth::requireUser();

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id'] ?? 0);
        $url = trim((string) ($payload['url'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($id <= 0 || $url === '') {
            Response::json([
                'success' => false,
                'message' => 'id y url son requeridos.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if ($sortOrder < 1) {
            Response::json([
                'success' => false,
                'message' => 'El orden debe ser 1 o mayor.',
                'code' => 'INVALID_SORT_ORDER',
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

        if ($this->sortOrderExists($sortOrder, $id)) {
            Response::json([
                'success' => false,
                'message' => 'Ese orden ya esta en uso. Elige otro.',
                'code' => 'SORT_ORDER_TAKEN',
            ], 422);
        }

        $imagePath = (string) $existing['image_path'];

        if ($tempKey !== '') {
            $imagePath = $this->moveTempToFinal($tempKey);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE tbl_afiliados_logo
             SET url = :url,
                 sort_order = :sort_order,
                 image_path = :image_path,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_logo = :id'
        );
        $stmt->execute([
            'url' => $url,
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
            'UPDATE tbl_afiliados_logo
             SET is_active = :is_active,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_logo = :id'
        );
        $stmt->execute([
            'is_active' => $isActive,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }

    // Admin: delete logo and its image (JSON: id)
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
        $stmt = $db->prepare('DELETE FROM tbl_afiliados_logo WHERE id_logo = :id');
        $stmt->execute(['id' => $id]);

        $this->deleteFinalImageIfOwned((string) ($existing['image_path'] ?? ''));

        Response::json(['success' => true]);
    }

    // Admin: reorder logos (JSON: ordered_ids: number[])
    public function reorder(): void
    {
        Auth::requireUser();

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $orderedIds = $payload['ordered_ids'] ?? null;

        if (!is_array($orderedIds) || count($orderedIds) === 0) {
            Response::json([
                'success' => false,
                'message' => 'ordered_ids es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $ids = [];
        foreach ($orderedIds as $id) {
            $intId = (int) $id;
            if ($intId > 0) {
                $ids[] = $intId;
            }
        }

        if (count($ids) !== count($orderedIds)) {
            Response::json([
                'success' => false,
                'message' => 'ordered_ids invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $db->beginTransaction();

        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $check = $db->prepare("SELECT COUNT(*) FROM tbl_afiliados_logo WHERE id_logo IN ($placeholders)");
            $check->execute($ids);
            $count = (int) $check->fetchColumn();

            if ($count !== count($ids)) {
                $db->rollBack();
                Response::json([
                    'success' => false,
                    'message' => 'Uno o mas items no existen.',
                    'code' => 'NOT_FOUND',
                ], 404);
            }

            $update = $db->prepare(
                'UPDATE tbl_afiliados_logo
                 SET sort_order = :sort_order,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_logo = :id'
            );

            $order = 1;
            foreach ($ids as $id) {
                $update->execute([
                    'sort_order' => $order,
                    'id' => $id,
                ]);
                $order++;
            }

            $db->commit();
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::json([
                'success' => false,
                'message' => 'No se pudo reordenar.',
                'code' => 'REORDER_FAILED',
            ], 500);
        }

        Response::json(['success' => true]);
    }

    private function getTitle(PDO $db): string
    {
        $stmt = $db->query('SELECT title FROM tbl_afiliados_config WHERE id_config = 1');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) && isset($row['title']) ? (string) $row['title'] : 'Reserva tus servicios aqui';
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
        $finalName = Upload::randomKey('afiliado') . '.' . ($ext === '' ? 'png' : $ext);
        $finalPath = $this->finalDir . '/' . $finalName;

        if (!rename($tempPath, $finalPath)) {
            Response::json([
                'success' => false,
                'message' => 'Could not move file.',
                'code' => 'MOVE_FAILED',
            ], 500);
        }

        return '/imagenes/afiliados/' . $finalName;
    }

    private function deleteFinalImageIfOwned(string $imagePath): void
    {
        $imagePath = trim($imagePath);

        if ($imagePath === '' || !str_starts_with($imagePath, '/imagenes/afiliados/')) {
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
        $stmt = $db->prepare('SELECT * FROM tbl_afiliados_logo WHERE id_logo = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    private function sortOrderExists(int $sortOrder, ?int $excludeId = null): bool
    {
        $db = Database::connection();

        if ($excludeId !== null) {
            $stmt = $db->prepare(
                'SELECT 1 FROM tbl_afiliados_logo WHERE sort_order = :sort_order AND id_logo <> :id LIMIT 1'
            );
            $stmt->execute([
                'sort_order' => $sortOrder,
                'id' => $excludeId,
            ]);
        } else {
            $stmt = $db->prepare('SELECT 1 FROM tbl_afiliados_logo WHERE sort_order = :sort_order LIMIT 1');
            $stmt->execute([
                'sort_order' => $sortOrder,
            ]);
        }

        return (bool) $stmt->fetchColumn();
    }
}
