<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use PDO;

final class WhatsappController
{
    public function publicData(): void
    {
        $db = Database::connection();
        $stmt = $db->query(
            'SELECT phone, default_message
             FROM tbl_whatsapp_config
             WHERE id_config = 1
             LIMIT 1'
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::json([
            'success' => true,
            'item' => $row ?: null,
        ]);
    }

    public function adminData(): void
    {
        Auth::requireUser();
        $this->publicData();
    }

    public function update(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);

        $phone = trim((string) ($payload['phone'] ?? ''));
        $defaultMessage = trim((string) ($payload['default_message'] ?? ''));

        if ($phone === '') {
            Response::json([
                'success' => false,
                'message' => 'El numero de WhatsApp es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO tbl_whatsapp_config (id_config, phone, default_message)
             VALUES (1, :phone, :default_message)
             ON DUPLICATE KEY UPDATE
                phone = VALUES(phone),
                default_message = VALUES(default_message),
                updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            'phone' => $phone,
            'default_message' => $defaultMessage,
        ]);

        Response::json(['success' => true]);
    }
}

