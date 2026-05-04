-- Run this inside your DB (local: viajero_cr, production: u768363471_viajerocr)

CREATE TABLE IF NOT EXISTS tbl_afiliados_config (
    id_config TINYINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_config)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_afiliados_config (id_config, title)
VALUES (1, 'Reserva tus servicios aqui')
ON DUPLICATE KEY UPDATE title = VALUES(title);

CREATE TABLE IF NOT EXISTS tbl_afiliados_logo (
    id_logo BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    image_path VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_logo),
    UNIQUE KEY uq_tbl_afiliados_logo_sort (sort_order),
    KEY idx_tbl_afiliados_logo_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

