-- Run this inside your DB (local: viajero_cr, production: u768363471_viajerocr)

CREATE TABLE IF NOT EXISTS tbl_seccion1_slider (
    id_slider BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(180) NOT NULL,
    subtitle VARCHAR(220) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_slider),
    KEY idx_tbl_seccion1_slider_active (is_active),
    UNIQUE KEY uq_tbl_seccion1_slider_sort (sort_order),
    KEY idx_tbl_seccion1_slider_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
