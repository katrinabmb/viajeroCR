CREATE DATABASE IF NOT EXISTS viajero_cr
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE viajero_cr;

CREATE TABLE IF NOT EXISTS tbl_usuario (
    id_usuario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_permiso BIGINT UNSIGNED NULL,
    estado ENUM('activo', 'inactivo', 'bloqueado') NOT NULL DEFAULT 'activo',
    ultimo_login_at DATETIME NULL,
    intentos_fallidos INT UNSIGNED NOT NULL DEFAULT 0,
    bloqueo_hasta DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_tbl_usuario_correo (correo),
    KEY idx_tbl_usuario_estado (estado),
    KEY idx_tbl_usuario_permiso (id_permiso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_permiso (
    id_permiso BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_permiso),
    UNIQUE KEY uq_tbl_permiso_codigo (codigo)
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

INSERT INTO tbl_permiso (nombre, codigo, is_active) VALUES
    ('Administrador', 'admin', 1),
    ('Editor', 'editor', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    is_active = VALUES(is_active);

ALTER TABLE tbl_usuario
    ADD CONSTRAINT fk_tbl_usuario_permiso
        FOREIGN KEY (id_permiso) REFERENCES tbl_permiso (id_permiso)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

UPDATE tbl_usuario u
JOIN tbl_permiso p ON p.codigo = 'admin'
SET u.id_permiso = p.id_permiso
WHERE u.id_permiso IS NULL;

-- Password del usuario demo:
-- Admin123*
