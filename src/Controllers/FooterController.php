<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use PDO;

final class FooterController
{
    public function publicData(): void
    {
        $db = Database::connection();
        $stmt = $db->query(
            'SELECT brand_name, rights_text, phone, email, address_line
             FROM tbl_footer_config
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

        $brandName = trim((string) ($payload['brand_name'] ?? ''));
        $rightsText = trim((string) ($payload['rights_text'] ?? ''));
        $phone = trim((string) ($payload['phone'] ?? ''));
        $email = trim((string) ($payload['email'] ?? ''));
        $addressLine = trim((string) ($payload['address_line'] ?? ''));

        if ($brandName === '' || $rightsText === '' || $phone === '' || $email === '' || $addressLine === '') {
            Response::json([
                'success' => false,
                'message' => 'Completa todos los campos del footer.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO tbl_footer_config (id_config, brand_name, rights_text, phone, email, address_line)
             VALUES (1, :brand_name, :rights_text, :phone, :email, :address_line)
             ON DUPLICATE KEY UPDATE
               brand_name = VALUES(brand_name),
               rights_text = VALUES(rights_text),
               phone = VALUES(phone),
               email = VALUES(email),
               address_line = VALUES(address_line),
               updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            'brand_name' => $brandName,
            'rights_text' => $rightsText,
            'phone' => $phone,
            'email' => $email,
            'address_line' => $addressLine,
        ]);

        Response::json(['success' => true]);
    }
}

