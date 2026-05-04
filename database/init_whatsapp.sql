CREATE TABLE IF NOT EXISTS tbl_whatsapp_config (
    id_config TINYINT UNSIGNED NOT NULL,
    phone VARCHAR(40) NOT NULL,
    default_message VARCHAR(500) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_config)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_whatsapp_config (id_config, phone, default_message)
VALUES (1, '50683429727', '')
ON DUPLICATE KEY UPDATE
    phone = VALUES(phone),
    default_message = VALUES(default_message);

