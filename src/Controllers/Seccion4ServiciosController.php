<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Upload;
use PDO;

final class Seccion4ServiciosController
{
    private string $tempDir;
    private string $finalDir;

    public function __construct()
    {
        $root = dirname(__DIR__, 2);
        $this->tempDir = $root . '/imagenes/temp';
        $this->finalDir = $root . '/imagenes/seccion4';
    }

    public function publicData(): void
    {
        $db = Database::connection();

        $title = $this->getTitle($db);
        $stmt = $db->query(
            'SELECT id_service, title, title2, description, image_path, sort_order
             FROM tbl_seccion4_service
             WHERE is_active = 1
             ORDER BY sort_order ASC, id_service ASC'
        );

        Response::json([
            'success' => true,
            'title' => $title,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    public function adminData(): void
    {
        Auth::requireUser();
        $db = Database::connection();

        $title = $this->getTitle($db);
        $stmt = $db->query(
            'SELECT id_service, title, title2, description, image_path, is_active, sort_order, created_at, updated_at
             FROM tbl_seccion4_service
             ORDER BY sort_order ASC, id_service ASC'
        );

        Response::json([
            'success' => true,
            'title' => $title,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

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
            'INSERT INTO tbl_seccion4_config (id_config, title)
             VALUES (1, :title)
             ON DUPLICATE KEY UPDATE title = VALUES(title), updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute(['title' => $title]);

        Response::json(['success' => true]);
    }

    public function uploadTemp(): void
    {
        Auth::requireUser();

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            Response::json([
                'success' => false,
                'message' => 'Archivo requerido.',
                'code' => 'FILE_REQUIRED',
            ], 422);
        }

        $file = $_FILES['file'];

        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::json([
                'success' => false,
                'message' => 'No se pudo cargar el archivo.',
                'code' => 'UPLOAD_FAILED',
            ], 400);
        }

        $original = (string) ($file['name'] ?? 'image');
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));

        if (!Upload::isAllowedImageExtension($ext)) {
            Response::json([
                'success' => false,
                'message' => 'Tipo de archivo invalido. Usa jpg, png o webp.',
                'code' => 'INVALID_FILE_TYPE',
            ], 422);
        }

        Upload::ensureDir($this->tempDir);

        $key = Upload::randomKey('svc');
        $safeName = Upload::safeBasename(pathinfo($original, PATHINFO_FILENAME)) . '.' . $ext;
        $tempFile = $key . '_' . $safeName;
        $target = $this->tempDir . '/' . $tempFile;

        if (!move_uploaded_file((string) ($file['tmp_name'] ?? ''), $target)) {
            Response::json([
                'success' => false,
                'message' => 'No se pudo almacenar el archivo.',
                'code' => 'STORE_FAILED',
            ], 500);
        }

        Response::json([
            'success' => true,
            'temp_key' => $tempFile,
        ]);
    }

    public function create(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);

        $title = trim((string) ($payload['title'] ?? ''));
        $title2 = trim((string) ($payload['title2'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($title === '' || $title2 === '' || $tempKey === '') {
            Response::json([
                'success' => false,
                'message' => 'Debes completar titulo, titulo2 e imagen.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if ($sortOrder < 1) {
            Response::json([
                'success' => false,
                'message' => 'El orden debe ser 1 o mayor.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        if ($this->sortOrderExists($db, $sortOrder, null)) {
            Response::json([
                'success' => false,
                'message' => 'El orden ya esta en uso.',
                'code' => 'DUPLICATE_ORDER',
            ], 409);
        }

        $imagePath = $this->moveTempToFinal($tempKey);

        $stmt = $db->prepare(
            'INSERT INTO tbl_seccion4_service (title, title2, description, image_path, is_active, sort_order)
             VALUES (:title, :title2, :description, :image_path, 1, :sort_order)'
        );
        $stmt->execute([
            'title' => $title,
            'title2' => $title2,
            'description' => $description,
            'image_path' => $imagePath,
            'sort_order' => $sortOrder,
        ]);

        Response::json(['success' => true]);
    }

    public function update(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);

        $id = (int) ($payload['id_service'] ?? 0);
        $title = trim((string) ($payload['title'] ?? ''));
        $title2 = trim((string) ($payload['title2'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($id < 1) {
            Response::json([
                'success' => false,
                'message' => 'id_service es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if ($title === '' || $title2 === '') {
            Response::json([
                'success' => false,
                'message' => 'Debes completar titulo y titulo2.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if ($sortOrder < 1) {
            Response::json([
                'success' => false,
                'message' => 'El orden debe ser 1 o mayor.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $existing = $this->findById($db, $id);
        if (!$existing) {
            Response::json([
                'success' => false,
                'message' => 'Item no encontrado.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        if ($this->sortOrderExists($db, $sortOrder, $id)) {
            Response::json([
                'success' => false,
                'message' => 'El orden ya esta en uso.',
                'code' => 'DUPLICATE_ORDER',
            ], 409);
        }

        $imagePath = (string) ($existing['image_path'] ?? '');
        if ($tempKey !== '') {
            $newImage = $this->moveTempToFinal($tempKey);
            $this->deleteFinalImageIfOwned($imagePath);
            $imagePath = $newImage;
        }

        $stmt = $db->prepare(
            'UPDATE tbl_seccion4_service
             SET title = :title,
                 title2 = :title2,
                 description = :description,
                 image_path = :image_path,
                 sort_order = :sort_order,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_service = :id'
        );
        $stmt->execute([
            'title' => $title,
            'title2' => $title2,
            'description' => $description,
            'image_path' => $imagePath,
            'sort_order' => $sortOrder,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }

    public function setActive(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_service'] ?? 0);
        $isActive = (int) ($payload['is_active'] ?? 0) ? 1 : 0;

        if ($id < 1) {
            Response::json([
                'success' => false,
                'message' => 'id_service es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE tbl_seccion4_service
             SET is_active = :active,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_service = :id'
        );
        $stmt->execute(['active' => $isActive, 'id' => $id]);

        Response::json(['success' => true]);
    }

    public function delete(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_service'] ?? 0);

        if ($id < 1) {
            Response::json([
                'success' => false,
                'message' => 'id_service es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $existing = $this->findById($db, $id);
        if (!$existing) {
            Response::json([
                'success' => false,
                'message' => 'Item no encontrado.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $stmt = $db->prepare('DELETE FROM tbl_seccion4_service WHERE id_service = :id');
        $stmt->execute(['id' => $id]);

        $this->deleteFinalImageIfOwned((string) ($existing['image_path'] ?? ''));

        Response::json(['success' => true]);
    }

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
            $check = $db->prepare("SELECT COUNT(*) FROM tbl_seccion4_service WHERE id_service IN ($placeholders)");
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

            // Avoid UNIQUE(sort_order) collisions while reordering.
            // Step 1: move all involved rows to a high offset, then assign 1..N.
            $offset = 100000;
            $bump = $db->prepare(
                "UPDATE tbl_seccion4_service
                 SET sort_order = sort_order + $offset,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_service IN ($placeholders)"
            );
            $bump->execute($ids);

            $update = $db->prepare(
                'UPDATE tbl_seccion4_service
                 SET sort_order = :sort_order,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_service = :id'
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
        $stmt = $db->query('SELECT title FROM tbl_seccion4_config WHERE id_config = 1');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) && isset($row['title']) ? (string) $row['title'] : 'Servicios';
    }

    private function moveTempToFinal(string $tempKey): string
    {
        $tempPath = $this->tempDir . '/' . basename($tempKey);

        if (!is_file($tempPath)) {
            Response::json([
                'success' => false,
                'message' => 'Archivo temporal no encontrado.',
                'code' => 'TEMP_NOT_FOUND',
            ], 404);
        }

        Upload::ensureDir($this->finalDir);

        $ext = strtolower(pathinfo($tempPath, PATHINFO_EXTENSION));
        $finalName = Upload::randomKey('servicio') . '.' . ($ext === '' ? 'png' : $ext);
        $finalPath = $this->finalDir . '/' . $finalName;

        if (!rename($tempPath, $finalPath)) {
            Response::json([
                'success' => false,
                'message' => 'No se pudo mover el archivo.',
                'code' => 'MOVE_FAILED',
            ], 500);
        }

        return '/imagenes/seccion4/' . $finalName;
    }

    private function deleteFinalImageIfOwned(string $imagePath): void
    {
        $imagePath = trim($imagePath);

        if ($imagePath === '' || !str_starts_with($imagePath, '/imagenes/seccion4/')) {
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

    private function findById(PDO $db, int $id): ?array
    {
        $stmt = $db->prepare('SELECT * FROM tbl_seccion4_service WHERE id_service = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    private function sortOrderExists(PDO $db, int $sortOrder, ?int $excludeId): bool
    {
        if ($excludeId !== null) {
            $stmt = $db->prepare(
                'SELECT 1 FROM tbl_seccion4_service WHERE sort_order = :sort_order AND id_service <> :id LIMIT 1'
            );
            $stmt->execute([
                'sort_order' => $sortOrder,
                'id' => $excludeId,
            ]);
        } else {
            $stmt = $db->prepare('SELECT 1 FROM tbl_seccion4_service WHERE sort_order = :sort_order LIMIT 1');
            $stmt->execute(['sort_order' => $sortOrder]);
        }

        return (bool) $stmt->fetchColumn();
    }
}
