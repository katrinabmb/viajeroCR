CREATE DATABASE IF NOT EXISTS viajero_cr
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE viajero_cr;

CREATE TABLE IF NOT EXISTS tbl_usuario (
    id_usuario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    estado ENUM('activo', 'inactivo', 'bloqueado') NOT NULL DEFAULT 'activo',
    ultimo_login_at DATETIME NULL,
    intentos_fallidos INT UNSIGNED NOT NULL DEFAULT 0,
    bloqueo_hasta DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_tbl_usuario_correo (correo),
    KEY idx_tbl_usuario_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_usuario_refresh_token (
    id_refresh_token BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_usuario BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    last_used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_refresh_token),
    UNIQUE KEY uq_tbl_usuario_refresh_token_hash (token_hash),
    KEY idx_tbl_usuario_refresh_token_usuario (id_usuario),
    KEY idx_tbl_usuario_refresh_token_expires (expires_at),
    CONSTRAINT fk_tbl_usuario_refresh_token_usuario
        FOREIGN KEY (id_usuario) REFERENCES tbl_usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_usuario (
    nombre,
    correo,
    password_hash,
    estado
) VALUES (
    'Admin',
    'admin@viajero.com',
    '$2y$10$AFH/oiMArzpdbVfTq6dGze6.peEg16a57DCXdt4gsxOfSe4H0l8Vu',
    'activo'
)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    estado = VALUES(estado);

-- Password del usuario demo:
-- Admin123*
