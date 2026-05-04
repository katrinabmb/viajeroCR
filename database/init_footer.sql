-- Run this inside your DB:
-- local: viajero_cr
-- production: u768363471_viajerocr

CREATE TABLE IF NOT EXISTS tbl_footer_config (
    id_config TINYINT UNSIGNED NOT NULL,
    brand_name VARCHAR(120) NOT NULL,
    rights_text VARCHAR(180) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(180) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_config)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_footer_config (id_config, brand_name, rights_text, phone, email, address_line)
VALUES (
    1,
    'Viajero CR',
    'Todos los derechos reservados',
    '+506 83429727',
    'info@viajerocr.com',
    'PLAZA FUTURA, LINDORA, SANTA ANA, COSTA RICA'
)
ON DUPLICATE KEY UPDATE
    brand_name = VALUES(brand_name),
    rights_text = VALUES(rights_text),
    phone = VALUES(phone),
    email = VALUES(email),
    address_line = VALUES(address_line);

