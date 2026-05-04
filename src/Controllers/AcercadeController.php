<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Upload;
use PDO;

final class AcercadeController
{
    private string $tempDir;
    private string $finalDir;

    public function __construct()
    {
        $root = dirname(__DIR__, 2);
        $this->tempDir = $root . '/imagenes/temp';
        $this->finalDir = $root . '/imagenes/acercade';
    }

    public function publicData(): void
    {
        $db = Database::connection();
        $stmt = $db->query(
            'SELECT id_config, title, image_path, paragraph_1, paragraph_2, updated_at
             FROM tbl_acercade_config
             WHERE id_config = 1
             LIMIT 1'
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::json([
            'success' => true,
            'item' => is_array($row) ? $row : null,
        ]);
    }

    public function adminData(): void
    {
        Auth::requireUser();
        $this->publicData();
    }

    public function uploadTemp(): void
    {
        Auth::requireUser();

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            Response::json(['success' => false, 'message' => 'Archivo requerido.', 'code' => 'FILE_REQUIRED'], 422);
        }
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::json(['success' => false, 'message' => 'No se pudo cargar el archivo.', 'code' => 'UPLOAD_FAILED'], 400);
        }

        $original = (string) ($file['name'] ?? 'image');
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        if (!Upload::isAllowedImageExtension($ext)) {
            Response::json(['success' => false, 'message' => 'Tipo de imagen invalido.', 'code' => 'INVALID_FILE_TYPE'], 422);
        }

        Upload::ensureDir($this->tempDir);
        $key = Upload::randomKey('about');
        $safeName = Upload::safeBasename(pathinfo($original, PATHINFO_FILENAME)) . '.' . $ext;
        $tempFile = $key . '_' . $safeName;
        $target = $this->tempDir . '/' . $tempFile;

        if (!move_uploaded_file((string) ($file['tmp_name'] ?? ''), $target)) {
            Response::json(['success' => false, 'message' => 'No se pudo almacenar el archivo.', 'code' => 'STORE_FAILED'], 500);
        }

        Response::json(['success' => true, 'temp_key' => $tempFile]);
    }

    public function update(): void
    {
        Auth::requireUser();

        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $title = trim((string) ($payload['title'] ?? ''));
        $paragraph1 = trim((string) ($payload['paragraph_1'] ?? ''));
        $paragraph2 = trim((string) ($payload['paragraph_2'] ?? ''));
        $tempImageKey = trim((string) ($payload['temp_image_key'] ?? ''));

        if ($title === '' || $paragraph1 === '' || $paragraph2 === '') {
            Response::json(['success' => false, 'message' => 'Completa titulo y parrafos.', 'code' => 'VALIDATION_ERROR'], 422);
        }

        $db = Database::connection();
        $stmt = $db->query('SELECT image_path FROM tbl_acercade_config WHERE id_config = 1 LIMIT 1');
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        $imagePath = is_array($current) ? (string) ($current['image_path'] ?? '') : '/imagenes/acercade/viajerocr2.jpeg';

        if ($tempImageKey !== '') {
            $newImage = $this->moveTempToFinal($tempImageKey);
            $this->deleteFinalImageIfOwned($imagePath);
            $imagePath = $newImage;
        }

        $up = $db->prepare(
            'INSERT INTO tbl_acercade_config (id_config, title, image_path, paragraph_1, paragraph_2)
             VALUES (1, :title, :image_path, :paragraph_1, :paragraph_2)
             ON DUPLICATE KEY UPDATE
               title = VALUES(title),
               image_path = VALUES(image_path),
               paragraph_1 = VALUES(paragraph_1),
               paragraph_2 = VALUES(paragraph_2),
               updated_at = CURRENT_TIMESTAMP'
        );
        $up->execute([
            'title' => $title,
            'image_path' => $imagePath,
            'paragraph_1' => $paragraph1,
            'paragraph_2' => $paragraph2,
        ]);

        Response::json(['success' => true]);
    }

    private function moveTempToFinal(string $tempKey): string
    {
        $tempPath = $this->tempDir . '/' . basename($tempKey);
        if (!is_file($tempPath)) {
            Response::json(['success' => false, 'message' => 'Archivo temporal no encontrado.', 'code' => 'TEMP_NOT_FOUND'], 404);
        }

        Upload::ensureDir($this->finalDir);
        $ext = strtolower(pathinfo($tempPath, PATHINFO_EXTENSION));
        $finalName = Upload::randomKey('acercade') . '.' . ($ext === '' ? 'jpg' : $ext);
        $finalPath = $this->finalDir . '/' . $finalName;

        if (!rename($tempPath, $finalPath)) {
            Response::json(['success' => false, 'message' => 'No se pudo mover el archivo.', 'code' => 'MOVE_FAILED'], 500);
        }

        return '/imagenes/acercade/' . $finalName;
    }

    private function deleteFinalImageIfOwned(string $imagePath): void
    {
        $imagePath = trim($imagePath);
        if ($imagePath === '' || !str_starts_with($imagePath, '/imagenes/acercade/')) {
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
}

