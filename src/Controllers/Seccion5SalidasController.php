<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Upload;
use PDO;

final class Seccion5SalidasController
{
    private string $tempDir;
    private string $imageDir;
    private string $docDir;

    public function __construct()
    {
        $root = dirname(__DIR__, 2);
        $this->tempDir = $root . '/imagenes/temp';
        $this->imageDir = $root . '/imagenes/seccion5';
        $this->docDir = $root . '/docs/seccion5';
    }

    public function publicData(): void
    {
        $db = Database::connection();
        $title = $this->getTitle($db);
        $stmt = $db->query(
            'SELECT id_salida, title, description, fechas, precio, image_path, itinerario_path, sort_order
             FROM tbl_seccion5_salida
             WHERE is_active = 1
             ORDER BY sort_order ASC, id_salida ASC'
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
            'SELECT id_salida, title, description, fechas, precio, image_path, itinerario_path, is_active, sort_order, created_at, updated_at
             FROM tbl_seccion5_salida
             ORDER BY sort_order ASC, id_salida ASC'
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
            Response::json(['success' => false, 'message' => 'title es requerido.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO tbl_seccion5_config (id_config, title)
             VALUES (1, :title)
             ON DUPLICATE KEY UPDATE title = VALUES(title), updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute(['title' => $title]);

        Response::json(['success' => true]);
    }

    public function uploadTemp(): void
    {
        Auth::requireUser();
        $type = trim((string) ($_GET['type'] ?? 'image'));

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            Response::json(['success' => false, 'message' => 'Archivo requerido.', 'code' => 'FILE_REQUIRED'], 422);
        }
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::json(['success' => false, 'message' => 'No se pudo cargar el archivo.', 'code' => 'UPLOAD_FAILED'], 400);
        }

        $original = (string) ($file['name'] ?? 'file');
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));

        if ($type === 'pdf') {
            if ($ext !== 'pdf') {
                Response::json(['success' => false, 'message' => 'Solo se permite PDF.', 'code' => 'INVALID_FILE_TYPE'], 422);
            }
        } else {
            if (!Upload::isAllowedImageExtension($ext)) {
                Response::json(['success' => false, 'message' => 'Tipo de imagen invalido.', 'code' => 'INVALID_FILE_TYPE'], 422);
            }
        }

        Upload::ensureDir($this->tempDir);
        $key = Upload::randomKey($type === 'pdf' ? 'pdf' : 'img');
        $safeName = Upload::safeBasename(pathinfo($original, PATHINFO_FILENAME)) . '.' . $ext;
        $tempFile = $key . '_' . $safeName;
        $target = $this->tempDir . '/' . $tempFile;

        if (!move_uploaded_file((string) ($file['tmp_name'] ?? ''), $target)) {
            Response::json(['success' => false, 'message' => 'No se pudo almacenar el archivo.', 'code' => 'STORE_FAILED'], 500);
        }

        Response::json(['success' => true, 'temp_key' => $tempFile]);
    }

    public function create(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $title = trim((string) ($payload['title'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $fechas = trim((string) ($payload['fechas'] ?? ''));
        $precio = trim((string) ($payload['precio'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempImageKey = trim((string) ($payload['temp_image_key'] ?? ''));
        $tempPdfKey = trim((string) ($payload['temp_pdf_key'] ?? ''));

        if ($title === '' || $description === '' || $fechas === '' || $precio === '' || $tempImageKey === '' || $tempPdfKey === '') {
            Response::json(['success' => false, 'message' => 'Completa todos los campos y archivos.', 'code' => 'VALIDATION_ERROR'], 422);
        }
        if ($sortOrder < 1) {
            Response::json(['success' => false, 'message' => 'El orden debe ser 1 o mayor.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        if ($this->sortOrderExists($db, $sortOrder, null)) {
            Response::json(['success' => false, 'message' => 'El orden ya esta en uso.', 'code' => 'DUPLICATE_ORDER'], 409);
        }

        $imagePath = $this->moveTempToFinal($tempImageKey, 'image');
        $pdfPath = $this->moveTempToFinal($tempPdfKey, 'pdf');

        $stmt = $db->prepare(
            'INSERT INTO tbl_seccion5_salida (title, description, fechas, precio, image_path, itinerario_path, is_active, sort_order)
             VALUES (:title, :description, :fechas, :precio, :image_path, :itinerario_path, 1, :sort_order)'
        );
        $stmt->execute([
            'title' => $title,
            'description' => $description,
            'fechas' => $fechas,
            'precio' => $precio,
            'image_path' => $imagePath,
            'itinerario_path' => $pdfPath,
            'sort_order' => $sortOrder,
        ]);

        Response::json(['success' => true]);
    }

    public function update(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_salida'] ?? 0);
        $title = trim((string) ($payload['title'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $fechas = trim((string) ($payload['fechas'] ?? ''));
        $precio = trim((string) ($payload['precio'] ?? ''));
        $sortOrder = (int) ($payload['sort_order'] ?? 0);
        $tempImageKey = trim((string) ($payload['temp_image_key'] ?? ''));
        $tempPdfKey = trim((string) ($payload['temp_pdf_key'] ?? ''));

        if ($id < 1 || $title === '' || $description === '' || $fechas === '' || $precio === '') {
            Response::json(['success' => false, 'message' => 'Campos invalidos.', 'code' => 'VALIDATION_ERROR'], 422);
        }
        if ($sortOrder < 1) {
            Response::json(['success' => false, 'message' => 'El orden debe ser 1 o mayor.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $existing = $this->findById($db, $id);
        if (!$existing) {
            Response::json(['success' => false, 'message' => 'Salida no encontrada.', 'code' => 'NOT_FOUND'], 404);
        }
        if ($this->sortOrderExists($db, $sortOrder, $id)) {
            Response::json(['success' => false, 'message' => 'El orden ya esta en uso.', 'code' => 'DUPLICATE_ORDER'], 409);
        }

        $imagePath = (string) ($existing['image_path'] ?? '');
        $pdfPath = (string) ($existing['itinerario_path'] ?? '');

        if ($tempImageKey !== '') {
            $newImagePath = $this->moveTempToFinal($tempImageKey, 'image');
            $this->deleteOwnedFile($imagePath, 'image');
            $imagePath = $newImagePath;
        }
        if ($tempPdfKey !== '') {
            $newPdfPath = $this->moveTempToFinal($tempPdfKey, 'pdf');
            $this->deleteOwnedFile($pdfPath, 'pdf');
            $pdfPath = $newPdfPath;
        }

        $stmt = $db->prepare(
            'UPDATE tbl_seccion5_salida
             SET title = :title,
                 description = :description,
                 fechas = :fechas,
                 precio = :precio,
                 image_path = :image_path,
                 itinerario_path = :itinerario_path,
                 sort_order = :sort_order,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_salida = :id'
        );
        $stmt->execute([
            'title' => $title,
            'description' => $description,
            'fechas' => $fechas,
            'precio' => $precio,
            'image_path' => $imagePath,
            'itinerario_path' => $pdfPath,
            'sort_order' => $sortOrder,
            'id' => $id,
        ]);

        Response::json(['success' => true]);
    }

    public function setActive(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_salida'] ?? 0);
        $isActive = (int) ($payload['is_active'] ?? 0) ? 1 : 0;

        if ($id < 1) {
            Response::json(['success' => false, 'message' => 'id_salida es requerido.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare('UPDATE tbl_seccion5_salida SET is_active = :active, updated_at = CURRENT_TIMESTAMP WHERE id_salida = :id');
        $stmt->execute(['active' => $isActive, 'id' => $id]);

        Response::json(['success' => true]);
    }

    public function delete(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_salida'] ?? 0);

        if ($id < 1) {
            Response::json(['success' => false, 'message' => 'id_salida es requerido.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $existing = $this->findById($db, $id);
        if (!$existing) {
            Response::json(['success' => false, 'message' => 'Salida no encontrada.', 'code' => 'NOT_FOUND'], 404);
        }

        $stmt = $db->prepare('DELETE FROM tbl_seccion5_salida WHERE id_salida = :id');
        $stmt->execute(['id' => $id]);

        $this->deleteOwnedFile((string) ($existing['image_path'] ?? ''), 'image');
        $this->deleteOwnedFile((string) ($existing['itinerario_path'] ?? ''), 'pdf');

        Response::json(['success' => true]);
    }

    public function reorder(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $orderedIds = $payload['ordered_ids'] ?? null;

        if (!is_array($orderedIds) || count($orderedIds) === 0) {
            Response::json(['success' => false, 'message' => 'ordered_ids es requerido.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $ids = [];
        foreach ($orderedIds as $id) {
            $intId = (int) $id;
            if ($intId > 0) {
                $ids[] = $intId;
            }
        }
        if (count($ids) !== count($orderedIds)) {
            Response::json(['success' => false, 'message' => 'ordered_ids invalido.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $db->beginTransaction();

        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $check = $db->prepare("SELECT COUNT(*) FROM tbl_seccion5_salida WHERE id_salida IN ($placeholders)");
            $check->execute($ids);
            $count = (int) $check->fetchColumn();

            if ($count !== count($ids)) {
                $db->rollBack();
                Response::json(['success' => false, 'message' => 'Uno o mas items no existen.', 'code' => 'NOT_FOUND'], 404);
            }

            $offset = 100000;
            $bump = $db->prepare(
                "UPDATE tbl_seccion5_salida
                 SET sort_order = sort_order + $offset,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_salida IN ($placeholders)"
            );
            $bump->execute($ids);

            $update = $db->prepare(
                'UPDATE tbl_seccion5_salida
                 SET sort_order = :sort_order,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_salida = :id'
            );

            $order = 1;
            foreach ($ids as $id) {
                $update->execute(['sort_order' => $order, 'id' => $id]);
                $order++;
            }

            $db->commit();
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::json(['success' => false, 'message' => 'No se pudo reordenar.', 'code' => 'REORDER_FAILED'], 500);
        }

        Response::json(['success' => true]);
    }

    private function getTitle(PDO $db): string
    {
        $stmt = $db->query('SELECT title FROM tbl_seccion5_config WHERE id_config = 1');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) && isset($row['title']) ? (string) $row['title'] : 'Salidas Grupales';
    }

    private function moveTempToFinal(string $tempKey, string $type): string
    {
        $tempPath = $this->tempDir . '/' . basename($tempKey);
        if (!is_file($tempPath)) {
            Response::json(['success' => false, 'message' => 'Archivo temporal no encontrado.', 'code' => 'TEMP_NOT_FOUND'], 404);
        }

        $dir = $type === 'pdf' ? $this->docDir : $this->imageDir;
        Upload::ensureDir($dir);

        $ext = strtolower(pathinfo($tempPath, PATHINFO_EXTENSION));
        $fallback = $type === 'pdf' ? 'pdf' : 'jpg';
        $finalName = $type === 'pdf'
            ? $this->uniqueFinalName($dir, $this->originalNameFromTempKey($tempKey, $fallback))
            : Upload::randomKey('salida') . '.' . ($ext === '' ? $fallback : $ext);
        $finalPath = $dir . '/' . $finalName;

        if (!rename($tempPath, $finalPath)) {
            Response::json(['success' => false, 'message' => 'No se pudo mover el archivo.', 'code' => 'MOVE_FAILED'], 500);
        }

        return $type === 'pdf' ? '/docs/seccion5/' . $finalName : '/imagenes/seccion5/' . $finalName;
    }

    private function originalNameFromTempKey(string $tempKey, string $fallbackExt): string
    {
        $name = basename($tempKey);
        $name = preg_replace('/^(pdf|img)_[a-f0-9]{32}_/i', '', $name) ?? $name;
        $base = Upload::safeBasename(pathinfo($name, PATHINFO_FILENAME));
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION)) ?: $fallbackExt;

        return $base . '.' . $ext;
    }

    private function uniqueFinalName(string $dir, string $fileName): string
    {
        $base = Upload::safeBasename(pathinfo($fileName, PATHINFO_FILENAME));
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $candidate = $base . ($ext === '' ? '' : '.' . $ext);
        $counter = 2;

        while (is_file($dir . '/' . $candidate)) {
            $candidate = $base . '_' . $counter . ($ext === '' ? '' : '.' . $ext);
            $counter++;
        }

        return $candidate;
    }

    private function deleteOwnedFile(string $path, string $type): void
    {
        $path = trim($path);
        if ($path === '') {
            return;
        }
        if ($type === 'pdf' && !str_starts_with($path, '/docs/seccion5/')) {
            return;
        }
        if ($type === 'image' && !str_starts_with($path, '/imagenes/seccion5/')) {
            return;
        }

        $fileName = basename($path);
        if ($fileName === '' || $fileName === '.' || $fileName === '..') {
            return;
        }

        $baseDir = $type === 'pdf' ? $this->docDir : $this->imageDir;
        $fullPath = $baseDir . '/' . $fileName;
        if (is_file($fullPath)) {
            @unlink($fullPath);
        }
    }

    private function findById(PDO $db, int $id): ?array
    {
        $stmt = $db->prepare('SELECT * FROM tbl_seccion5_salida WHERE id_salida = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    private function sortOrderExists(PDO $db, int $sortOrder, ?int $excludeId): bool
    {
        if ($excludeId !== null) {
            $stmt = $db->prepare('SELECT 1 FROM tbl_seccion5_salida WHERE sort_order = :sort_order AND id_salida <> :id LIMIT 1');
            $stmt->execute(['sort_order' => $sortOrder, 'id' => $excludeId]);
        } else {
            $stmt = $db->prepare('SELECT 1 FROM tbl_seccion5_salida WHERE sort_order = :sort_order LIMIT 1');
            $stmt->execute(['sort_order' => $sortOrder]);
        }
        return (bool) $stmt->fetchColumn();
    }
}
