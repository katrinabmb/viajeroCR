<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Upload;
use PDO;

final class Seccion3DestinosController
{
    private string $tempDir;
    private string $continentDir;
    private string $destinationDir;

    public function __construct()
    {
        $root = dirname(__DIR__, 2);
        $this->tempDir = $root . '/imagenes/temp';
        $this->continentDir = $root . '/imagenes/seccion3/continents';
        $this->destinationDir = $root . '/imagenes/seccion3/destinations';
    }

    // Public: section title + continents (active) with destinations (active)
    public function publicData(): void
    {
        $db = Database::connection();
        $title = $this->getSectionTitle($db);

        $continentsStmt = $db->query(
            'SELECT id_continent, title, image_path, sort_order
             FROM tbl_seccion3_continent
             WHERE is_active = 1
             ORDER BY sort_order ASC, id_continent ASC'
        );
        $continents = $continentsStmt->fetchAll(PDO::FETCH_ASSOC);

        $destStmt = $db->prepare(
            'SELECT id_destination, title, image_path, sort_order
             FROM tbl_seccion3_destination
             WHERE id_continent = :id_continent AND is_active = 1
             ORDER BY sort_order ASC, id_destination ASC'
        );

        foreach ($continents as &$continent) {
            $destStmt->execute(['id_continent' => (int) $continent['id_continent']]);
            $continent['destinations'] = $destStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        Response::json([
            'success' => true,
            'title' => $title,
            'continents' => $continents,
        ]);
    }

    // Admin: section title + continents
    public function adminContinents(): void
    {
        Auth::requireUser();
        $db = Database::connection();
        $title = $this->getSectionTitle($db);

        $stmt = $db->query(
            'SELECT id_continent, title, image_path, is_active, sort_order, created_at, updated_at
             FROM tbl_seccion3_continent
             ORDER BY sort_order ASC, id_continent ASC'
        );

        Response::json([
            'success' => true,
            'title' => $title,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    // Admin: list destinations for a continent (query ?continent_id=)
    public function adminDestinations(): void
    {
        Auth::requireUser();
        $continentId = (int) ($_GET['continent_id'] ?? 0);

        if ($continentId <= 0) {
            Response::json([
                'success' => false,
                'message' => 'continent_id es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'SELECT id_destination, id_continent, title, image_path, is_active, sort_order, created_at, updated_at
             FROM tbl_seccion3_destination
             WHERE id_continent = :id_continent
             ORDER BY sort_order ASC, id_destination ASC'
        );
        $stmt->execute(['id_continent' => $continentId]);

        Response::json([
            'success' => true,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    // Admin: update section title (JSON: title)
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
            'INSERT INTO tbl_seccion3_config (id_config, title)
             VALUES (1, :title)
             ON DUPLICATE KEY UPDATE title = VALUES(title), updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute(['title' => $title]);

        Response::json(['success' => true]);
    }

    // Admin: upload temp image (multipart: file) for either continent or destination (query ?type=continent|destination)
    public function uploadTemp(): void
    {
        Auth::requireUser();
        $type = (string) ($_GET['type'] ?? '');

        if ($type !== 'continent' && $type !== 'destination') {
            Response::json([
                'success' => false,
                'message' => 'type invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

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

        $key = Upload::randomKey($type === 'continent' ? 'c3' : 'd3');
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

    // Admin: create/update continent
    public function continentCreate(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $title = trim((string) ($payload['title'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($title === '' || $tempKey === '') {
            Response::json([
                'success' => false,
                'message' => 'title y temp_key son requeridos.',
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

        if ($this->continentSortExists($sortOrder)) {
            Response::json([
                'success' => false,
                'message' => 'Ese orden ya esta en uso. Elige otro.',
                'code' => 'SORT_ORDER_TAKEN',
            ], 422);
        }

        $imagePath = $this->moveTempToFinal($tempKey, 'continent');

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO tbl_seccion3_continent (title, image_path, is_active, sort_order)
             VALUES (:title, :image_path, 1, :sort_order)'
        );
        $stmt->execute([
            'title' => $title,
            'image_path' => $imagePath,
            'sort_order' => $sortOrder,
        ]);

        Response::json(['success' => true, 'id' => (int) $db->lastInsertId()], 201);
    }

    public function continentUpdate(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id'] ?? 0);
        $title = trim((string) ($payload['title'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($id <= 0 || $title === '') {
            Response::json([
                'success' => false,
                'message' => 'id y title son requeridos.',
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

        $existing = $this->findContinentById($id);
        if ($existing === null) {
            Response::json([
                'success' => false,
                'message' => 'Item no encontrado.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        if ($this->continentSortExists($sortOrder, $id)) {
            Response::json([
                'success' => false,
                'message' => 'Ese orden ya esta en uso. Elige otro.',
                'code' => 'SORT_ORDER_TAKEN',
            ], 422);
        }

        $imagePath = (string) $existing['image_path'];
        if ($tempKey !== '') {
            $imagePath = $this->moveTempToFinal($tempKey, 'continent');
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE tbl_seccion3_continent
             SET title = :title,
                 sort_order = :sort_order,
                 image_path = :image_path,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_continent = :id'
        );
        $stmt->execute([
            'title' => $title,
            'sort_order' => $sortOrder,
            'image_path' => $imagePath,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }

    public function continentSetActive(): void
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
            'UPDATE tbl_seccion3_continent
             SET is_active = :is_active,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_continent = :id'
        );
        $stmt->execute(['is_active' => $isActive, 'id' => $id]);

        Response::json(['success' => true]);
    }

    public function continentDelete(): void
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

        $existing = $this->findContinentById($id);
        if ($existing === null) {
            Response::json([
                'success' => false,
                'message' => 'Item no encontrado.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        // collect destination images before delete (cascade)
        $db = Database::connection();
        $dest = $db->prepare('SELECT image_path FROM tbl_seccion3_destination WHERE id_continent = :id');
        $dest->execute(['id' => $id]);
        $destImages = $dest->fetchAll(PDO::FETCH_COLUMN);

        $stmt = $db->prepare('DELETE FROM tbl_seccion3_continent WHERE id_continent = :id');
        $stmt->execute(['id' => $id]);

        $this->deleteFinalImageIfOwned((string) ($existing['image_path'] ?? ''), 'continent');
        foreach ($destImages as $path) {
            if (is_string($path)) {
                $this->deleteFinalImageIfOwned($path, 'destination');
            }
        }

        Response::json(['success' => true]);
    }

    public function continentReorder(): void
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

        $ids = array_map('intval', $orderedIds);
        $ids = array_values(array_filter($ids, static fn(int $v): bool => $v > 0));

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
            $check = $db->prepare("SELECT COUNT(*) FROM tbl_seccion3_continent WHERE id_continent IN ($placeholders)");
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
                'UPDATE tbl_seccion3_continent
                 SET sort_order = :sort_order, updated_at = CURRENT_TIMESTAMP
                 WHERE id_continent = :id'
            );
            $order = 1;
            foreach ($ids as $id) {
                $update->execute(['sort_order' => $order, 'id' => $id]);
                $order++;
            }
            $db->commit();
        } catch (\Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            Response::json([
                'success' => false,
                'message' => 'No se pudo reordenar.',
                'code' => 'REORDER_FAILED',
            ], 500);
        }

        Response::json(['success' => true]);
    }

    // Destinations CRUD
    public function destinationCreate(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $continentId = (int) ($payload['continent_id'] ?? 0);
        $title = trim((string) ($payload['title'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($continentId <= 0 || $title === '' || $tempKey === '') {
            Response::json([
                'success' => false,
                'message' => 'continent_id, title y temp_key son requeridos.',
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

        if ($this->destinationSortExists($continentId, $sortOrder)) {
            Response::json([
                'success' => false,
                'message' => 'Ese orden ya esta en uso en este continente.',
                'code' => 'SORT_ORDER_TAKEN',
            ], 422);
        }

        $imagePath = $this->moveTempToFinal($tempKey, 'destination');

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO tbl_seccion3_destination (id_continent, title, image_path, is_active, sort_order)
             VALUES (:id_continent, :title, :image_path, 1, :sort_order)'
        );
        $stmt->execute([
            'id_continent' => $continentId,
            'title' => $title,
            'image_path' => $imagePath,
            'sort_order' => $sortOrder,
        ]);

        Response::json(['success' => true, 'id' => (int) $db->lastInsertId()], 201);
    }

    public function destinationUpdate(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id'] ?? 0);
        $continentId = (int) ($payload['continent_id'] ?? 0);
        $title = trim((string) ($payload['title'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempKey = trim((string) ($payload['temp_key'] ?? ''));

        if ($id <= 0 || $continentId <= 0 || $title === '') {
            Response::json([
                'success' => false,
                'message' => 'id, continent_id y title son requeridos.',
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

        $existing = $this->findDestinationById($id);
        if ($existing === null) {
            Response::json([
                'success' => false,
                'message' => 'Item no encontrado.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        if ($this->destinationSortExists($continentId, $sortOrder, $id)) {
            Response::json([
                'success' => false,
                'message' => 'Ese orden ya esta en uso en este continente.',
                'code' => 'SORT_ORDER_TAKEN',
            ], 422);
        }

        $imagePath = (string) $existing['image_path'];
        if ($tempKey !== '') {
            $imagePath = $this->moveTempToFinal($tempKey, 'destination');
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE tbl_seccion3_destination
             SET title = :title,
                 sort_order = :sort_order,
                 image_path = :image_path,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_destination = :id AND id_continent = :id_continent'
        );
        $stmt->execute([
            'title' => $title,
            'sort_order' => $sortOrder,
            'image_path' => $imagePath,
            'id' => $id,
            'id_continent' => $continentId,
        ]);

        Response::json(['success' => true]);
    }

    public function destinationSetActive(): void
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
            'UPDATE tbl_seccion3_destination
             SET is_active = :is_active, updated_at = CURRENT_TIMESTAMP
             WHERE id_destination = :id'
        );
        $stmt->execute(['is_active' => $isActive, 'id' => $id]);

        Response::json(['success' => true]);
    }

    public function destinationDelete(): void
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

        $existing = $this->findDestinationById($id);
        if ($existing === null) {
            Response::json([
                'success' => false,
                'message' => 'Item no encontrado.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $db = Database::connection();
        $stmt = $db->prepare('DELETE FROM tbl_seccion3_destination WHERE id_destination = :id');
        $stmt->execute(['id' => $id]);

        $this->deleteFinalImageIfOwned((string) ($existing['image_path'] ?? ''), 'destination');

        Response::json(['success' => true]);
    }

    public function destinationReorder(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $continentId = (int) ($payload['continent_id'] ?? 0);
        $orderedIds = $payload['ordered_ids'] ?? null;

        if ($continentId <= 0 || !is_array($orderedIds) || count($orderedIds) === 0) {
            Response::json([
                'success' => false,
                'message' => 'continent_id y ordered_ids son requeridos.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $ids = array_map('intval', $orderedIds);
        $ids = array_values(array_filter($ids, static fn(int $v): bool => $v > 0));

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
            $check = $db->prepare(
                "SELECT COUNT(*) FROM tbl_seccion3_destination WHERE id_continent = ? AND id_destination IN ($placeholders)"
            );
            $check->execute(array_merge([$continentId], $ids));
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
                'UPDATE tbl_seccion3_destination
                 SET sort_order = :sort_order, updated_at = CURRENT_TIMESTAMP
                 WHERE id_destination = :id AND id_continent = :id_continent'
            );
            $order = 1;
            foreach ($ids as $id) {
                $update->execute(['sort_order' => $order, 'id' => $id, 'id_continent' => $continentId]);
                $order++;
            }
            $db->commit();
        } catch (\Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            Response::json([
                'success' => false,
                'message' => 'No se pudo reordenar.',
                'code' => 'REORDER_FAILED',
            ], 500);
        }

        Response::json(['success' => true]);
    }

    private function getSectionTitle(PDO $db): string
    {
        $stmt = $db->query('SELECT title FROM tbl_seccion3_config WHERE id_config = 1');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) && isset($row['title']) ? (string) $row['title'] : 'Destinos';
    }

    private function moveTempToFinal(string $tempKey, string $type): string
    {
        $tempPath = $this->tempDir . '/' . basename($tempKey);
        if (!is_file($tempPath)) {
            Response::json([
                'success' => false,
                'message' => 'Temp file not found.',
                'code' => 'TEMP_NOT_FOUND',
            ], 404);
        }

        $dir = $type === 'continent' ? $this->continentDir : $this->destinationDir;
        Upload::ensureDir($dir);

        $ext = strtolower(pathinfo($tempPath, PATHINFO_EXTENSION));
        $finalName = Upload::randomKey($type === 'continent' ? 'continent' : 'destination') . '.' . ($ext === '' ? 'jpg' : $ext);
        $finalPath = $dir . '/' . $finalName;

        if (!rename($tempPath, $finalPath)) {
            Response::json([
                'success' => false,
                'message' => 'Could not move file.',
                'code' => 'MOVE_FAILED',
            ], 500);
        }

        return $type === 'continent'
            ? '/imagenes/seccion3/continents/' . $finalName
            : '/imagenes/seccion3/destinations/' . $finalName;
    }

    private function deleteFinalImageIfOwned(string $imagePath, string $type): void
    {
        $imagePath = trim($imagePath);
        $prefix = $type === 'continent' ? '/imagenes/seccion3/continents/' : '/imagenes/seccion3/destinations/';
        if ($imagePath === '' || !str_starts_with($imagePath, $prefix)) {
            return;
        }

        $fileName = basename($imagePath);
        if ($fileName === '' || $fileName === '.' || $fileName === '..') return;

        $dir = $type === 'continent' ? $this->continentDir : $this->destinationDir;
        $fullPath = $dir . '/' . $fileName;
        if (is_file($fullPath)) @unlink($fullPath);
    }

    private function findContinentById(int $id): ?array
    {
        $db = Database::connection();
        $stmt = $db->prepare('SELECT * FROM tbl_seccion3_continent WHERE id_continent = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    private function findDestinationById(int $id): ?array
    {
        $db = Database::connection();
        $stmt = $db->prepare('SELECT * FROM tbl_seccion3_destination WHERE id_destination = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    private function continentSortExists(int $sortOrder, ?int $excludeId = null): bool
    {
        $db = Database::connection();
        if ($excludeId !== null) {
            $stmt = $db->prepare(
                'SELECT 1 FROM tbl_seccion3_continent WHERE sort_order = :sort_order AND id_continent <> :id LIMIT 1'
            );
            $stmt->execute(['sort_order' => $sortOrder, 'id' => $excludeId]);
        } else {
            $stmt = $db->prepare('SELECT 1 FROM tbl_seccion3_continent WHERE sort_order = :sort_order LIMIT 1');
            $stmt->execute(['sort_order' => $sortOrder]);
        }
        return (bool) $stmt->fetchColumn();
    }

    private function destinationSortExists(int $continentId, int $sortOrder, ?int $excludeId = null): bool
    {
        $db = Database::connection();
        if ($excludeId !== null) {
            $stmt = $db->prepare(
                'SELECT 1 FROM tbl_seccion3_destination
                 WHERE id_continent = :id_continent AND sort_order = :sort_order AND id_destination <> :id LIMIT 1'
            );
            $stmt->execute(['id_continent' => $continentId, 'sort_order' => $sortOrder, 'id' => $excludeId]);
        } else {
            $stmt = $db->prepare(
                'SELECT 1 FROM tbl_seccion3_destination WHERE id_continent = :id_continent AND sort_order = :sort_order LIMIT 1'
            );
            $stmt->execute(['id_continent' => $continentId, 'sort_order' => $sortOrder]);
        }
        return (bool) $stmt->fetchColumn();
    }
}

