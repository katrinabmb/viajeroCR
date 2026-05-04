-- Run this inside your DB:
-- local: viajero_cr
-- production: u768363471_viajerocr

CREATE TABLE IF NOT EXISTS tbl_testimonios_config (
    id_config TINYINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_config)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_testimonios_config (id_config, title)
VALUES (1, 'Testimonios')
ON DUPLICATE KEY UPDATE
    title = VALUES(title);

CREATE TABLE IF NOT EXISTS tbl_testimonio_item (
    id_testimonio BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    destino VARCHAR(180) NOT NULL,
    author_name VARCHAR(180) NOT NULL,
    testimonio TEXT NOT NULL,
    photo_path VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_testimonio),
    UNIQUE KEY uq_tbl_testimonio_item_sort (sort_order),
    KEY idx_tbl_testimonio_item_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional migration for existing DBs:
-- ALTER TABLE tbl_testimonios_config DROP COLUMN image_1_path, DROP COLUMN image_2_path;
