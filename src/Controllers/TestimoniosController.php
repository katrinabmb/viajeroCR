<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Upload;
use PDO;

final class TestimoniosController
{
    private string $tempDir;
    private string $finalDir;

    public function __construct()
    {
        $root = dirname(__DIR__, 2);
        $this->tempDir = $root . '/imagenes/temp';
        $this->finalDir = $root . '/imagenes/testimonios';
    }

    public function publicData(): void
    {
        $db = Database::connection();
        $config = $db->query('SELECT title FROM tbl_testimonios_config WHERE id_config = 1 LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        $recuerdos = $db->query(
            'SELECT slot_no, image_path
             FROM tbl_testimonio_recuerdo
             WHERE slot_no IN (1,2)
             ORDER BY slot_no ASC'
        )->fetchAll(PDO::FETCH_ASSOC);
        $items = $db->query(
            'SELECT id_testimonio, destino, author_name, testimonio, photo_path, sort_order
             FROM tbl_testimonio_item
             WHERE is_active = 1
             ORDER BY sort_order ASC, id_testimonio ASC'
        )->fetchAll(PDO::FETCH_ASSOC);

        Response::json([
            'success' => true,
            'config' => $config ?: null,
            'recuerdos' => $recuerdos,
            'items' => $items,
        ]);
    }

    public function adminData(): void
    {
        Auth::requireUser();
        $db = Database::connection();
        $config = $db->query('SELECT title FROM tbl_testimonios_config WHERE id_config = 1 LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        $recuerdos = $db->query(
            'SELECT slot_no, image_path
             FROM tbl_testimonio_recuerdo
             WHERE slot_no IN (1,2)
             ORDER BY slot_no ASC'
        )->fetchAll(PDO::FETCH_ASSOC);
        $items = $db->query(
            'SELECT id_testimonio, destino, author_name, testimonio, photo_path, is_active, sort_order, created_at, updated_at
             FROM tbl_testimonio_item
             ORDER BY sort_order ASC, id_testimonio ASC'
        )->fetchAll(PDO::FETCH_ASSOC);

        Response::json([
            'success' => true,
            'config' => $config ?: null,
            'recuerdos' => $recuerdos,
            'items' => $items,
        ]);
    }

    public function uploadTemp(): void
    {
        Auth::requireUser();
        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            Response::json(['success' => false, 'message' => 'Archivo requerido.', 'code' => 'FILE_REQUIRED'], 422);
        }
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::json(['success' => false, 'message' => 'Upload failed.', 'code' => 'UPLOAD_FAILED'], 400);
        }
        $ext = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
        if (!Upload::isAllowedImageExtension($ext)) {
            Response::json(['success' => false, 'message' => 'Tipo de imagen invalido.', 'code' => 'INVALID_FILE_TYPE'], 422);
        }
        Upload::ensureDir($this->tempDir);
        $tmp = Upload::randomKey('test') . '_' . Upload::safeBasename(pathinfo((string) ($file['name'] ?? 'img'), PATHINFO_FILENAME)) . '.' . $ext;
        $target = $this->tempDir . '/' . $tmp;
        if (!move_uploaded_file((string) ($file['tmp_name'] ?? ''), $target)) {
            Response::json(['success' => false, 'message' => 'STORE_FAILED', 'code' => 'STORE_FAILED'], 500);
        }
        Response::json(['success' => true, 'temp_key' => $tmp]);
    }

    public function updateConfig(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $title = trim((string) ($payload['title'] ?? ''));
        if ($title === '') {
            Response::json(['success' => false, 'message' => 'title requerido.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO tbl_testimonios_config (id_config, title)
             VALUES (1, :title)
             ON DUPLICATE KEY UPDATE
               title = VALUES(title),
               updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute(['title' => $title]);

        Response::json(['success' => true]);
    }

    public function saveRecuerdo(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $slot = (int) ($payload['slot_no'] ?? 0);
        $tempKey = trim((string) ($payload['temp_image_key'] ?? ''));

        if (!in_array($slot, [1, 2], true) || $tempKey === '') {
            Response::json([
                'success' => false,
                'message' => 'Debes indicar slot 1 o 2 y subir una imagen.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare('SELECT image_path FROM tbl_testimonio_recuerdo WHERE slot_no = :slot LIMIT 1');
        $stmt->execute(['slot' => $slot]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $currentPath = is_array($row) ? (string) ($row['image_path'] ?? '') : '';
        $newPath = $this->moveTempToFinal($tempKey);
        $this->deleteOwned($currentPath);

        $up = $db->prepare(
            'INSERT INTO tbl_testimonio_recuerdo (slot_no, image_path)
             VALUES (:slot, :image_path)
             ON DUPLICATE KEY UPDATE
               image_path = VALUES(image_path),
               updated_at = CURRENT_TIMESTAMP'
        );
        $up->execute([
            'slot' => $slot,
            'image_path' => $newPath,
        ]);

        Response::json(['success' => true]);
    }

    public function create(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $destino = trim((string) ($payload['destino'] ?? ''));
        $author = trim((string) ($payload['author_name'] ?? ''));
        $text = trim((string) ($payload['testimonio'] ?? ''));
        $sort = (int) ($payload['sort_order'] ?? 0);
        $tmpPhoto = trim((string) ($payload['temp_photo_key'] ?? ''));
        if ($destino === '' || $author === '' || $text === '' || $sort < 1) {
            Response::json(['success' => false, 'message' => 'Campos invalidos.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        if ($this->sortExists($db, $sort, null)) {
            Response::json(['success' => false, 'message' => 'El orden ya esta en uso.', 'code' => 'DUPLICATE_ORDER'], 409);
        }
        $photo = $tmpPhoto !== '' ? $this->moveTempToFinal($tmpPhoto) : null;

        $stmt = $db->prepare(
            'INSERT INTO tbl_testimonio_item (destino, author_name, testimonio, photo_path, is_active, sort_order)
             VALUES (:destino, :author_name, :testimonio, :photo_path, 1, :sort_order)'
        );
        $stmt->execute([
            'destino' => $destino,
            'author_name' => $author,
            'testimonio' => $text,
            'photo_path' => $photo,
            'sort_order' => $sort,
        ]);
        Response::json(['success' => true]);
    }

    public function update(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_testimonio'] ?? 0);
        $destino = trim((string) ($payload['destino'] ?? ''));
        $author = trim((string) ($payload['author_name'] ?? ''));
        $text = trim((string) ($payload['testimonio'] ?? ''));
        $sort = (int) ($payload['sort_order'] ?? 0);
        $tmpPhoto = trim((string) ($payload['temp_photo_key'] ?? ''));
        if ($id < 1 || $destino === '' || $author === '' || $text === '' || $sort < 1) {
            Response::json(['success' => false, 'message' => 'Campos invalidos.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $existing = $this->findById($db, $id);
        if (!$existing) {
            Response::json(['success' => false, 'message' => 'No encontrado.', 'code' => 'NOT_FOUND'], 404);
        }
        if ($this->sortExists($db, $sort, $id)) {
            Response::json(['success' => false, 'message' => 'El orden ya esta en uso.', 'code' => 'DUPLICATE_ORDER'], 409);
        }

        $photo = (string) ($existing['photo_path'] ?? '');
        if ($tmpPhoto !== '') {
            $new = $this->moveTempToFinal($tmpPhoto);
            $this->deleteOwned($photo);
            $photo = $new;
        }
        $stmt = $db->prepare(
            'UPDATE tbl_testimonio_item
             SET destino = :destino, author_name = :author_name, testimonio = :testimonio, photo_path = :photo_path, sort_order = :sort_order, updated_at = CURRENT_TIMESTAMP
             WHERE id_testimonio = :id'
        );
        $stmt->execute([
            'destino' => $destino,
            'author_name' => $author,
            'testimonio' => $text,
            'photo_path' => $photo === '' ? null : $photo,
            'sort_order' => $sort,
            'id' => $id,
        ]);
        Response::json(['success' => true]);
    }

    public function setActive(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_testimonio'] ?? 0);
        $active = (int) ($payload['is_active'] ?? 0) ? 1 : 0;
        if ($id < 1) {
            Response::json(['success' => false, 'message' => 'id requerido.', 'code' => 'VALIDATION_ERROR'], 422);
        }
        $db = Database::connection();
        $db->prepare('UPDATE tbl_testimonio_item SET is_active = :a, updated_at = CURRENT_TIMESTAMP WHERE id_testimonio = :id')->execute(['a' => $active, 'id' => $id]);
        Response::json(['success' => true]);
    }

    public function delete(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_testimonio'] ?? 0);
        if ($id < 1) {
            Response::json(['success' => false, 'message' => 'id requerido.', 'code' => 'VALIDATION_ERROR'], 422);
        }
        $db = Database::connection();
        $existing = $this->findById($db, $id);
        if (!$existing) {
            Response::json(['success' => false, 'message' => 'No encontrado.', 'code' => 'NOT_FOUND'], 404);
        }
        $db->prepare('DELETE FROM tbl_testimonio_item WHERE id_testimonio = :id')->execute(['id' => $id]);
        $this->deleteOwned((string) ($existing['photo_path'] ?? ''));
        Response::json(['success' => true]);
    }

    public function reorder(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $orderedIds = $payload['ordered_ids'] ?? null;
        if (!is_array($orderedIds) || count($orderedIds) === 0) {
            Response::json(['success' => false, 'message' => 'ordered_ids requerido.', 'code' => 'VALIDATION_ERROR'], 422);
        }
        $ids = array_values(array_filter(array_map('intval', $orderedIds), static fn(int $v): bool => $v > 0));
        if (count($ids) !== count($orderedIds)) {
            Response::json(['success' => false, 'message' => 'ordered_ids invalido.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $db->beginTransaction();
        try {
            $ph = implode(',', array_fill(0, count($ids), '?'));
            $check = $db->prepare("SELECT COUNT(*) FROM tbl_testimonio_item WHERE id_testimonio IN ($ph)");
            $check->execute($ids);
            if ((int) $check->fetchColumn() !== count($ids)) {
                $db->rollBack();
                Response::json(['success' => false, 'message' => 'Uno o mas items no existen.', 'code' => 'NOT_FOUND'], 404);
            }

            $offset = 100000;
            $bump = $db->prepare("UPDATE tbl_testimonio_item SET sort_order = sort_order + $offset, updated_at = CURRENT_TIMESTAMP WHERE id_testimonio IN ($ph)");
            $bump->execute($ids);

            $up = $db->prepare('UPDATE tbl_testimonio_item SET sort_order = :sort_order, updated_at = CURRENT_TIMESTAMP WHERE id_testimonio = :id');
            $i = 1;
            foreach ($ids as $id) {
                $up->execute(['sort_order' => $i, 'id' => $id]);
                $i++;
            }
            $db->commit();
        } catch (\Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            Response::json(['success' => false, 'message' => 'No se pudo reordenar.', 'code' => 'REORDER_FAILED'], 500);
        }
        Response::json(['success' => true]);
    }

    private function moveTempToFinal(string $tempKey): string
    {
        $tempPath = $this->tempDir . '/' . basename($tempKey);
        if (!is_file($tempPath)) {
            Response::json(['success' => false, 'message' => 'Temp not found.', 'code' => 'TEMP_NOT_FOUND'], 404);
        }
        Upload::ensureDir($this->finalDir);
        $ext = strtolower(pathinfo($tempPath, PATHINFO_EXTENSION));
        $name = Upload::randomKey('testimonio') . '.' . ($ext === '' ? 'jpg' : $ext);
        $finalPath = $this->finalDir . '/' . $name;
        if (!rename($tempPath, $finalPath)) {
            Response::json(['success' => false, 'message' => 'MOVE_FAILED', 'code' => 'MOVE_FAILED'], 500);
        }
        return '/imagenes/testimonios/' . $name;
    }

    private function deleteOwned(string $path): void
    {
        $path = trim($path);
        if ($path === '' || !str_starts_with($path, '/imagenes/testimonios/')) return;
        $name = basename($path);
        if ($name === '' || $name === '.' || $name === '..') return;
        $full = $this->finalDir . '/' . $name;
        if (is_file($full)) @unlink($full);
    }

    private function findById(PDO $db, int $id): ?array
    {
        $st = $db->prepare('SELECT * FROM tbl_testimonio_item WHERE id_testimonio = :id LIMIT 1');
        $st->execute(['id' => $id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    private function sortExists(PDO $db, int $sort, ?int $excludeId): bool
    {
        if ($excludeId !== null) {
            $st = $db->prepare('SELECT 1 FROM tbl_testimonio_item WHERE sort_order = :s AND id_testimonio <> :id LIMIT 1');
            $st->execute(['s' => $sort, 'id' => $excludeId]);
        } else {
            $st = $db->prepare('SELECT 1 FROM tbl_testimonio_item WHERE sort_order = :s LIMIT 1');
            $st->execute(['s' => $sort]);
        }
        return (bool) $st->fetchColumn();
    }
}
