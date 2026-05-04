-- Run this inside your DB (local: viajero_cr, production: u768363471_viajerocr)

CREATE TABLE IF NOT EXISTS tbl_seccion3_config (
    id_config TINYINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_config)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_seccion3_config (id_config, title)
VALUES (1, 'Destinos')
ON DUPLICATE KEY UPDATE title = VALUES(title);

CREATE TABLE IF NOT EXISTS tbl_seccion3_continent (
    id_continent BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(120) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_continent),
    UNIQUE KEY uq_tbl_seccion3_continent_sort (sort_order),
    KEY idx_tbl_seccion3_continent_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_seccion3_destination (
    id_destination BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_continent BIGINT UNSIGNED NOT NULL,
    title VARCHAR(140) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_destination),
    UNIQUE KEY uq_tbl_seccion3_destination_continent_sort (id_continent, sort_order),
    KEY idx_tbl_seccion3_destination_continent (id_continent),
    KEY idx_tbl_seccion3_destination_active_sort (is_active, sort_order),
    CONSTRAINT fk_tbl_seccion3_destination_continent
        FOREIGN KEY (id_continent) REFERENCES tbl_seccion3_continent (id_continent)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

